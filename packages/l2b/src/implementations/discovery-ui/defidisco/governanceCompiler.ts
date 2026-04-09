import type { DiscoveryPaths } from '@l2beat/discovery'
import * as fs from 'fs'
import * as path from 'path'
import { addressesEqual } from './addressUtils'
import { resolveDelayFromDiscovered } from './functions'
import type {
  GovernanceConfig,
  GovernanceDuration,
  GovernanceVoteExecution,
} from './types'

export interface CompiledGovernanceDuration {
  kind: 'fieldRef' | 'fixed' | 'none'
  // fieldRef-resolved fields
  seconds?: number
  resolved?: boolean
  error?: string
  contractAddress?: string
  contractName?: string
  fieldName?: string
  // fixed field
  value?: string
}

export interface CompiledGovernance {
  framework: string
  voteExecution: GovernanceVoteExecution
  votingUnit: string
  proposalRequirements: string
  votingProcess: string
  proposalPeriod: CompiledGovernanceDuration
  executionDelay: CompiledGovernanceDuration
}

/**
 * Resolves a GovernanceConfig from review-config.json into its compiled form.
 * Field-ref durations are resolved against discovered.json via
 * resolveDelayFromDiscovered() — fixed and none durations pass through unchanged.
 */
export function resolveGovernance(
  governance: GovernanceConfig | undefined,
  paths: DiscoveryPaths,
  project: string,
): CompiledGovernance | undefined {
  if (!governance) return undefined

  return {
    framework: governance.framework,
    voteExecution: governance.voteExecution,
    votingUnit: governance.votingUnit,
    proposalRequirements: governance.proposalRequirements,
    votingProcess: governance.votingProcess ?? '',
    proposalPeriod: resolveDuration(governance.proposalPeriod, paths, project),
    executionDelay: resolveDuration(governance.executionDelay, paths, project),
  }
}

function resolveDuration(
  duration: GovernanceDuration,
  paths: DiscoveryPaths,
  project: string,
): CompiledGovernanceDuration {
  if (duration.kind === 'none') {
    return { kind: 'none' }
  }
  if (duration.kind === 'fixed') {
    return { kind: 'fixed', value: duration.value }
  }

  // fieldRef — reuse the same resolver as function delays.
  const { contractAddress, fieldName } = duration.ref
  if (!contractAddress || !fieldName) {
    return {
      kind: 'fieldRef',
      contractAddress,
      fieldName,
      resolved: false,
      error: 'Field reference is incomplete',
    }
  }

  const resolved = resolveDelayFromDiscovered(paths, project, {
    contractAddress,
    fieldName,
  })

  return {
    kind: 'fieldRef',
    contractAddress,
    fieldName,
    contractName: lookupContractName(paths, project, contractAddress),
    resolved: resolved.isResolved,
    seconds: resolved.isResolved ? resolved.seconds : undefined,
    error: resolved.isResolved ? undefined : resolved.error,
  }
}

/**
 * Best-effort contract name lookup from discovered.json for display purposes.
 * Returns undefined if the file can't be read or the contract isn't found.
 */
function lookupContractName(
  paths: DiscoveryPaths,
  project: string,
  contractAddress: string,
): string | undefined {
  try {
    const discoveredPath = path.join(paths.discovery, project, 'discovered.json')
    if (!fs.existsSync(discoveredPath)) return undefined
    const discovered = JSON.parse(fs.readFileSync(discoveredPath, 'utf8'))
    const entries: any[] = discovered?.entries ?? []
    const entry = entries.find(
      (e: any) =>
        e.type === 'Contract' && addressesEqual(e.address, contractAddress),
    )
    return entry?.name
  } catch {
    return undefined
  }
}
