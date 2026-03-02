import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface CompiledReview {
  metadata: {
    protocolName: string
    protocolSlug: string
    chain: string
    projectType: string
    tokenName: string
  }
  totals: {
    contractCount: number
    permissionedFunctionCount: number
    scoredFunctionCount: number
    adminCount: number
    dependencyCount: number
    totalCapitalAtRisk: number
    totalTokenValueAtRisk: number
  }
  dependencies: {
    address: string
    name: string
    entity: string | null
    functions: { contractAddress: string; contractName: string; functionName: string }[]
  }[]
}

const CONFIG_DIR = join(__dirname, '..', '..', 'config', 'src')
const PROJECTS_DIR = join(CONFIG_DIR, 'projects')
const OUTPUT_DIR = join(__dirname, '..', 'public', 'data')

function main() {
  // Read project list
  const configPath = join(CONFIG_DIR, 'defidisco-config.json')
  if (!existsSync(configPath)) {
    console.error('defidisco-config.json not found at', configPath)
    process.exit(1)
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const projectNames: string[] = config.defiProjects

  // Ensure output dir exists
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const protocols: Array<{
    slug: string
    name: string
    chain: string
    projectType: string
    tokenName: string
    totals: CompiledReview['totals']
  }> = []

  // Dependency aggregation: address → { name, entity, totalFundsAtRisk, protocols }
  const depMap = new Map<
    string,
    {
      name: string
      entity: string | null
      totalFundsAtRisk: number
      protocols: { slug: string; name: string }[]
    }
  >()

  let totalCapitalAtRisk = 0
  let totalTokenValueAtRisk = 0

  for (const projectName of projectNames) {
    const reviewPath = join(PROJECTS_DIR, projectName, 'compiled-review.json')
    if (!existsSync(reviewPath)) {
      console.log(`  Skipping ${projectName} — no compiled-review.json`)
      continue
    }

    const review: CompiledReview = JSON.parse(readFileSync(reviewPath, 'utf8'))
    const slug = review.metadata.protocolSlug

    console.log(`  Processing ${slug}`)

    // Copy compiled review to output
    const slugDir = join(OUTPUT_DIR, slug)
    mkdirSync(slugDir, { recursive: true })
    copyFileSync(reviewPath, join(slugDir, 'compiled-review.json'))

    // Add to protocol list
    protocols.push({
      slug,
      name: review.metadata.protocolName,
      chain: review.metadata.chain,
      projectType: review.metadata.projectType,
      tokenName: review.metadata.tokenName,
      totals: review.totals,
    })

    totalCapitalAtRisk += review.totals.totalCapitalAtRisk
    totalTokenValueAtRisk += review.totals.totalTokenValueAtRisk

    // Aggregate dependencies across protocols
    for (const dep of review.dependencies) {
      const key = dep.address.toLowerCase()
      const existing = depMap.get(key)
      if (existing) {
        existing.protocols.push({ slug, name: review.metadata.protocolName })
        existing.totalFundsAtRisk += review.totals.totalCapitalAtRisk
      } else {
        depMap.set(key, {
          name: dep.name,
          entity: dep.entity,
          totalFundsAtRisk: review.totals.totalCapitalAtRisk,
          protocols: [{ slug, name: review.metadata.protocolName }],
        })
      }
    }
  }

  // Build dependencies list sorted by funds at risk
  const dependencies = Array.from(depMap.entries())
    .map(([address, data]) => ({
      address,
      name: data.name,
      entity: data.entity,
      totalFundsAtRisk: data.totalFundsAtRisk,
      protocols: data.protocols,
    }))
    .sort((a, b) => b.totalFundsAtRisk - a.totalFundsAtRisk)

  // Write index.json
  const index = {
    totalDefiTvl: 100_000_000_000, // Manually maintained — update periodically
    protocols,
    globalTotals: {
      totalCapitalAtRisk,
      totalTokenValueAtRisk,
      protocolsReviewed: protocols.length,
    },
    dependencies,
  }

  writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2))

  console.log(`\nCompiled ${protocols.length} protocols → ${OUTPUT_DIR}/index.json`)
  console.log(`Dependencies: ${dependencies.length}`)
}

main()
