import type { Logger } from '@l2beat/backend-tools'
import { ProjectService } from '@l2beat/config'
import { createDatabase } from '@l2beat/database'
import {
  type ConfigRegistry,
  type DiscoveryOutput,
  diffDiscovery,
  generateStructureHash,
} from '@l2beat/discovery'
import { HttpClient } from '@l2beat/shared'
import { UnixTime } from '@l2beat/shared-pure'
import { createDefiscanServer } from '@l2beat/defiscan-endpoints/src/server'
import type { DiscordClient } from '../../../peripherals/discord/DiscordClient'
import { DiscordClient as DiscordClientClass } from '../../../peripherals/discord/DiscordClient'
import { Peripherals } from '../../../peripherals/Peripherals'
import { Clock } from '../../../tools/Clock'
import { TaskQueue } from '../../../tools/queue/TaskQueue'
import { createDiscoveryRunner } from '../../update-monitor/createDiscoveryRunner'
import type { DiscoveryRunner } from '../../update-monitor/DiscoveryRunner'
import { sanitizeDiscoveryOutput } from '../../update-monitor/sanitizeDiscoveryOutput'
import { UpdateMessagesService } from '../../update-monitor/UpdateMessagesService'
import { UpdateNotifier } from '../../update-monitor/UpdateNotifier'
import { findDependents } from '../../update-monitor/utils/findDependents'
import { findUnknownEntries } from '../../update-monitor/utils/findUnknownEntries'
import { FundsRefresher } from './FundsRefresher'
import type { MonitorConfig } from './monitorConfig'
import { ReviewCompiler } from './ReviewCompiler'

/**
 * DeFiDisco Continuous Monitoring Service
 *
 * Runs hourly to:
 * 1. Discover smart contracts for all DeFi projects in defidisco-config.json
 * 2. Diff against previous discovery (stored in PostgreSQL)
 * 3. Send Discord notifications on changes
 * 4. Refresh live funds data (token balances, DeFi positions)
 * 5. Compile self-contained review JSON per project (for future D1 ingestion)
 *
 * This is a lightweight orchestrator that reuses existing L2Beat infrastructure:
 * - DiscoveryRunner for contract analysis
 * - UpdateNotifier for Discord alerts (single channel)
 * - PostgreSQL for previous discovery storage
 * - defiscan-endpoints for DeBank API access
 */
export class DefidiscoMonitorApplication {
  private readonly taskQueue: TaskQueue<UnixTime>
  private readonly db: ReturnType<typeof createDatabase>
  private readonly clock: Clock
  private readonly runner: DiscoveryRunner
  private readonly updateNotifier: UpdateNotifier
  private readonly fundsRefresher: FundsRefresher
  private readonly reviewCompiler: ReviewCompiler
  private readonly discordClient: DiscordClient | undefined
  private stopClock?: () => void

  constructor(
    private readonly config: MonitorConfig,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)

    // Database
    this.db = createDatabase({
      connectionString: config.database.connectionString,
      application_name: 'defidisco-monitor',
      ...(config.database.ssl
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    })

    // Clock — hourly trigger
    // minTimestamp is 1 day ago (we only care about recent hours)
    // safeTimeOffset = 60s to avoid future timestamps
    this.clock = new Clock(
      UnixTime.now() - UnixTime.DAY,
      60,
    )

    // HTTP client
    const http = new HttpClient()

    // Peripherals (wraps DB + HTTP for createDiscoveryRunner)
    const peripherals = new Peripherals(this.db, http, logger)

    // Discovery runner
    this.runner = createDiscoveryRunner(
      config.discovery.paths,
      http,
      peripherals,
      logger,
      config.discovery.chains,
      config.discovery.cacheEnabled,
      config.discovery.cacheUri,
    )

    // Discord
    if (config.discord) {
      this.discordClient = DiscordClientClass.create(
        { httpClient: http },
        config.discord,
      )
    }

    const updateMessagesService = new UpdateMessagesService(this.db, 30)
    const projectService = new ProjectService()

    this.updateNotifier = new UpdateNotifier(
      this.db,
      this.discordClient,
      logger,
      updateMessagesService,
      projectService,
    )

    // Funds refresher
    const defiscanUrl = `http://localhost:${config.defiscanEndpoints.port}`
    this.fundsRefresher = new FundsRefresher(
      config.discovery.paths,
      defiscanUrl,
      logger,
    )

    // Review compiler
    this.reviewCompiler = new ReviewCompiler(config.discovery.paths, logger)

    // Task queue
    this.taskQueue = new TaskQueue(
      (timestamp) => this.update(timestamp),
      logger.for('taskQueue'),
      { metricsId: 'defidisco_monitor' },
    )
  }

  async start(): Promise<void> {
    this.logger.info('Starting DeFiDisco Monitor', {
      projects: this.config.projects,
      projectCount: this.config.projects.length,
    })

    // Start defiscan-endpoints in-process
    const defiscanServer = createDefiscanServer(
      this.config.defiscanEndpoints,
      this.logger.for('defiscan-endpoints'),
    )
    await defiscanServer.start()
    this.logger.info('defiscan-endpoints started', {
      port: this.config.defiscanEndpoints.port,
    })

    // Send startup notification
    await this.sendDirectDiscordMessage('Monitor started.')

    // Queue immediate update if configured
    if (this.config.runOnStart) {
      this.taskQueue.addToFront(UnixTime.now() - UnixTime.MINUTE)
    }

    // Schedule hourly updates
    this.stopClock = this.clock.onNewHour((timestamp) => {
      this.taskQueue.addToFront(timestamp - UnixTime.MINUTE)
    })

    this.logger.info('DeFiDisco Monitor started successfully')
  }

  async stop(): Promise<void> {
    this.stopClock?.()
    await this.db.close()
    this.logger.info('DeFiDisco Monitor stopped')
  }

  // ==========================================================================
  // Main Update Loop
  // ==========================================================================

  private async update(timestamp: UnixTime): Promise<void> {
    const updateStart = UnixTime.now()

    this.logger.info('Update cycle started', {
      timestamp,
      date: UnixTime.toDate(timestamp).toISOString(),
      projectCount: this.config.projects.length,
    })

    for (const project of this.config.projects) {
      await this.updateProject(project, timestamp)
    }

    const updateEnd = UnixTime.now()
    this.logger.info('Update cycle completed', {
      duration: updateEnd - updateStart,
      projectCount: this.config.projects.length,
    })
  }

  private async updateProject(
    project: string,
    timestamp: UnixTime,
  ): Promise<void> {
    const projectStart = UnixTime.now()

    this.logger.info('Project update started', { project })

    try {
      // Step 1: Discovery
      const { discovery, diff } = await this.runDiscovery(project, timestamp)

      // Step 2: Notify on changes
      if (discovery && diff && diff.length > 0) {
        await this.notifyChanges(project, discovery, diff, timestamp)
      }

      // Step 3: Store discovery
      if (discovery) {
        await this.storeDiscovery(project, discovery, timestamp)
      }

      // Step 4: Refresh funds
      await this.fundsRefresher.refreshFundsForProject(project)

      // Step 5: Compile review
      await this.compileReview(project)
    } catch (error) {
      this.logger.error(
        { project },
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    const projectEnd = UnixTime.now()
    this.logger.info('Project update completed', {
      project,
      duration: projectEnd - projectStart,
    })
  }

  // ==========================================================================
  // Discovery
  // ==========================================================================

  private async runDiscovery(
    project: string,
    timestamp: UnixTime,
  ): Promise<{
    discovery: DiscoveryOutput | undefined
    diff: ReturnType<typeof diffDiscovery> | undefined
  }> {
    const { configReader } = this.config.discovery

    let projectConfig: ConfigRegistry
    try {
      projectConfig = configReader.readConfig(project)
    } catch (error) {
      this.logger.warn('Cannot read project config, skipping discovery', {
        project,
        error: String(error),
      })
      return { discovery: undefined, diff: undefined }
    }

    if (projectConfig.archived) {
      this.logger.info('Skipping archived project', { project })
      return { discovery: undefined, diff: undefined }
    }

    // Run discovery
    const runResult = await this.runner.run(
      projectConfig,
      timestamp,
      this.logger,
      { [projectConfig.name]: { timestamp } },
    )

    const { discovery } = runResult

    // Get previous discovery for diffing
    const previousDiscovery = await this.getPreviousDiscovery(project)
    if (!previousDiscovery) {
      this.logger.info('No previous discovery — first run', { project })
      return { discovery, diff: undefined }
    }

    // Diff
    const committedDiscovery = configReader.readDiscovery(project)
    const unverifiedEntries = committedDiscovery.entries
      .filter((c) => c.unverified)
      .map((c) => c.name)
      .filter((c): c is string => c !== undefined)

    const prevSanitized = sanitizeDiscoveryOutput(previousDiscovery)
    const currSanitized = sanitizeDiscoveryOutput(discovery)

    const diff = diffDiscovery(
      prevSanitized.entries,
      currSanitized.entries,
      unverifiedEntries,
    )

    return { discovery, diff }
  }

  private async getPreviousDiscovery(
    project: string,
  ): Promise<DiscoveryOutput | undefined> {
    // Try database first
    const dbEntry = await this.db.updateMonitor.findLatest(project)
    if (dbEntry) {
      return dbEntry.discovery
    }

    // Fallback to committed discovered.json
    try {
      return this.config.discovery.configReader.readDiscovery(project)
    } catch {
      return undefined
    }
  }

  // ==========================================================================
  // Notification
  // ==========================================================================

  private async notifyChanges(
    project: string,
    discovery: DiscoveryOutput,
    diff: ReturnType<typeof diffDiscovery>,
    timestamp: UnixTime,
  ): Promise<void> {
    const { configReader } = this.config.discovery

    const dependents = findDependents(project, configReader)
    const unknownEntries = findUnknownEntries(
      discovery.name,
      discovery.entries,
      configReader,
    )

    await this.updateNotifier.handleUpdate(
      project,
      diff,
      dependents,
      unknownEntries,
      timestamp,
    )

    this.logger.info('Discord notification sent', {
      project,
      diffCount: diff.length,
    })
  }

  // ==========================================================================
  // Storage
  // ==========================================================================

  private async storeDiscovery(
    project: string,
    discovery: DiscoveryOutput,
    timestamp: UnixTime,
  ): Promise<void> {
    const { configReader } = this.config.discovery
    const projectConfig = configReader.readConfig(project)

    await this.db.updateMonitor.upsert({
      projectId: project,
      timestamp,
      blockNumber: 0,
      discovery,
      configHash: generateStructureHash(projectConfig.structure),
    })
  }

  // ==========================================================================
  // Review Compilation
  // ==========================================================================

  private async compileReview(project: string): Promise<void> {
    const result = this.reviewCompiler.compile(project)

    switch (result.status) {
      case 'success':
        this.logger.info('Review compiled', { project, path: result.path })
        break

      case 'skipped':
        if (result.reason === 'no-review-config') {
          await this.sendDirectDiscordMessage(
            `\u26A0\uFE0F **${project}**: No review-config.json found \u2014 skipping review compilation. Run /generate-review or create manually.`,
          )
        } else if (result.reason === 'no-call-graph') {
          await this.sendDirectDiscordMessage(
            `\u26A0\uFE0F **${project}**: No call-graph-data.json found \u2014 skipping review compilation. Run call graph generation in the UI.`,
          )
        }
        break

      case 'error':
        this.logger.error(
          { project },
          new Error(`Review compilation failed: ${result.error}`),
        )
        break
    }
  }

  // ==========================================================================
  // Discord Helpers
  // ==========================================================================

  /**
   * Sends a message directly via the Discord client, bypassing UpdateNotifier.
   * Used for operational alerts (startup, compilation warnings) that should
   * not be throttled.
   */
  private async sendDirectDiscordMessage(message: string): Promise<void> {
    if (!this.discordClient) return
    try {
      await this.discordClient.sendMessage(message, 'INTERNAL')
    } catch (error) {
      this.logger.error(
        'Failed to send Discord message',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }
}
