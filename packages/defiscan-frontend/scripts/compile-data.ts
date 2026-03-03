import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
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
  funds?: {
    address: string
    name: string
    description: string
    balances: { totalUsdValue: number } | null
    positions: { totalUsdValue: number } | null
    tokenInfo: {
      symbol: string
      price: number
      totalSupply: string
      tokenValue: number
    } | null
  }[]
}

interface FundsData {
  contracts: Record<string, {
    balances?: { totalUsdValue: number }
    positions?: { totalUsdValue: number }
    tokenInfo?: {
      symbol: string
      price: number
      totalSupply: string
      tokenValue: number
    }
  }>
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
    // Look in config/projects first, then fall back to public/data (for committed reviews)
    const configReviewPath = join(PROJECTS_DIR, projectName, 'compiled-review.json')
    const localReviewPath = join(OUTPUT_DIR, projectName, 'compiled-review.json')
    const reviewPath = existsSync(configReviewPath) ? configReviewPath : localReviewPath

    if (!existsSync(reviewPath)) {
      console.log(`  Skipping ${projectName} — no compiled-review.json`)
      continue
    }

    const review: CompiledReview = JSON.parse(readFileSync(reviewPath, 'utf8'))
    const slug = review.metadata.protocolSlug

    console.log(`  Processing ${slug}`)

    // Patch funds data from funds-data.json if available
    const fundsDataPath = join(PROJECTS_DIR, projectName, 'funds-data.json')
    if (existsSync(fundsDataPath) && review.funds) {
      const fundsData: FundsData = JSON.parse(readFileSync(fundsDataPath, 'utf8'))
      // Build case-insensitive lookup (review uses lowercase, funds-data uses checksummed)
      const fundsLookup = new Map<string, FundsData['contracts'][string]>()
      for (const [addr, data] of Object.entries(fundsData.contracts ?? {})) {
        fundsLookup.set(addr.toLowerCase(), data)
      }
      let patched = 0
      for (const fund of review.funds) {
        const contractFunds = fundsLookup.get(fund.address.toLowerCase())
        if (!contractFunds) continue
        if (contractFunds.balances) {
          fund.balances = { totalUsdValue: contractFunds.balances.totalUsdValue }
        }
        if (contractFunds.positions) {
          fund.positions = { totalUsdValue: contractFunds.positions.totalUsdValue }
        }
        if (contractFunds.tokenInfo) {
          fund.tokenInfo = {
            symbol: contractFunds.tokenInfo.symbol,
            price: contractFunds.tokenInfo.price,
            totalSupply: contractFunds.tokenInfo.totalSupply,
            tokenValue: contractFunds.tokenInfo.tokenValue,
          }
        }
        patched++
      }
      if (patched > 0) {
        console.log(`    Patched ${patched} fund(s) from funds-data.json`)
      }
    }

    // Write (potentially patched) compiled review to output
    const slugDir = join(OUTPUT_DIR, slug)
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(join(slugDir, 'compiled-review.json'), JSON.stringify(review, null, 2))

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
