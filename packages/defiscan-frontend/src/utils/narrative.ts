import type { CompiledReview, CompiledAdmin, CompiledDependency } from '../types'
import { formatUsdValue } from './format'

/** Generate executive summary sentence from review data */
export function generateExecutiveSummary(review: CompiledReview): string {
  const { totals, metadata, admins } = review
  const adminTypes = getAdminTypeSummary(admins)
  const capitalStr = formatUsdValue(totals.totalCapitalAtRisk)

  const parts: string[] = []

  parts.push(
    `${metadata.protocolName} has ${capitalStr} in capital managed across ${totals.contractCount} contracts`,
  )

  if (totals.adminCount > 0) {
    parts.push(
      `controlled by ${totals.adminCount} admin${totals.adminCount !== 1 ? 's' : ''} (${adminTypes})`,
    )
  }

  if (totals.dependencyCount > 0) {
    parts.push(
      `with ${totals.dependencyCount} external dependenc${totals.dependencyCount !== 1 ? 'ies' : 'y'}`,
    )
  }

  return parts.join(', ') + '.'
}

/** Summarize admin types into human-readable string */
function getAdminTypeSummary(admins: CompiledAdmin[]): string {
  const counts = new Map<string, number>()
  for (const admin of admins) {
    const t = admin.adminType
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([type, count]) => `${count} ${humanAdminType(type)}${count > 1 ? 's' : ''}`)
    .join(', ')
}

function humanAdminType(type: string): string {
  switch (type) {
    case 'EOA':
      return 'externally owned account'
    case 'EOAPermissioned':
      return 'permissioned EOA'
    case 'Multisig':
      return 'multisig'
    case 'Timelock':
      return 'timelock'
    case 'Contract':
    case 'Untemplatized':
      return 'contract'
    case 'Diamond':
      return 'diamond proxy'
    case 'Revoked':
      return 'revoked address'
    default:
      return type.toLowerCase()
  }
}

/** Determine overall risk level from admin types */
export type RiskLevel = 'low' | 'medium' | 'high'

export function assessOverallRisk(review: CompiledReview): {
  level: RiskLevel
  reasons: string[]
} {
  const reasons: string[] = []
  let hasEOA = false
  let hasMultisig = false
  let allImmutable = true

  for (const admin of review.admins) {
    if (admin.adminType === 'EOA' || admin.adminType === 'EOAPermissioned') {
      hasEOA = true
      allImmutable = false
    }
    if (admin.adminType === 'Multisig') {
      hasMultisig = true
      allImmutable = false
    }
    if (
      admin.adminType !== 'Revoked' &&
      admin.adminType !== 'Contract' &&
      admin.adminType !== 'Untemplatized'
    ) {
      allImmutable = false
    }
  }

  if (hasEOA) {
    reasons.push('One or more admin functions are controlled by externally owned accounts (EOAs), which represent single points of failure')
  }
  if (hasMultisig) {
    reasons.push('Multisig wallets provide shared control but still require trust in a known set of signers')
  }
  if (review.totals.dependencyCount > 3) {
    reasons.push(`The protocol depends on ${review.totals.dependencyCount} external systems, increasing its exposure to third-party risks`)
  }
  if (allImmutable && review.admins.length > 0) {
    reasons.push('All admin controls resolve to immutable contracts or revoked addresses, meaning no human can alter protocol behavior')
  }

  let level: RiskLevel = 'medium'
  if (hasEOA) {
    level = 'high'
  } else if (allImmutable) {
    level = 'low'
  }

  if (reasons.length === 0) {
    reasons.push('Standard DeFi protocol setup with typical governance controls')
  }

  return { level, reasons }
}

/** Generate human-readable admin narrative */
export function generateAdminNarrative(admin: CompiledAdmin): string {
  const capitalStr = admin.totalDirectCapital > 0
    ? ` with access to ${formatUsdValue(admin.totalDirectCapital)} in direct capital`
    : ''

  const funcCount = admin.functions.length
  const funcStr = `${funcCount} permissioned function${funcCount !== 1 ? 's' : ''}`

  return `This ${humanAdminType(admin.adminType)} controls ${funcStr}${capitalStr}.`
}

/** Group dependencies by entity for narrative display */
export function groupDependenciesByEntity(deps: CompiledDependency[]): Map<string, CompiledDependency[]> {
  const grouped = new Map<string, CompiledDependency[]>()
  for (const dep of deps) {
    const key = dep.entity ?? 'Other'
    const list = grouped.get(key) ?? []
    list.push(dep)
    grouped.set(key, list)
  }
  return grouped
}

/** Get key findings from the review data */
export interface KeyFinding {
  type: 'positive' | 'warning' | 'critical'
  title: string
  detail: string
}

export function getKeyFindings(review: CompiledReview): KeyFinding[] {
  const findings: KeyFinding[] = []
  const { admins, totals, dependencies } = review

  // Check for immutability
  const hasHumanAdmin = admins.some(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned' || a.adminType === 'Multisig',
  )
  const allRevoked = admins.every(
    (a) =>
      a.adminType === 'Revoked' ||
      a.adminType === 'Contract' ||
      a.adminType === 'Untemplatized',
  )

  if (allRevoked && admins.length > 0) {
    findings.push({
      type: 'positive',
      title: 'Fully immutable protocol',
      detail:
        'All admin controls resolve to immutable contracts or revoked addresses. No human entity can modify protocol behavior after deployment.',
    })
  }

  // Check for EOAs
  const eoas = admins.filter(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned',
  )
  if (eoas.length > 0) {
    const maxCapital = Math.max(...eoas.map((e) => e.totalDirectCapital))
    findings.push({
      type: 'critical',
      title: `${eoas.length} EOA${eoas.length > 1 ? 's' : ''} with admin access`,
      detail: `Externally owned account${eoas.length > 1 ? 's' : ''} can execute critical functions affecting up to ${formatUsdValue(maxCapital)} in capital. A single compromised private key could impact user funds.`,
    })
  }

  // Check for multisig
  const multisigs = admins.filter((a) => a.adminType === 'Multisig')
  if (multisigs.length > 0) {
    findings.push({
      type: 'warning',
      title: `${multisigs.length} multisig${multisigs.length > 1 ? 's' : ''} governing the protocol`,
      detail: `Multisig wallets provide distributed control but still require trust in a known group of signers. ${multisigs.map((m) => m.name).join(', ')}.`,
    })
  }

  // High capital concentration
  if (totals.totalCapitalAtRisk > 100_000_000) {
    findings.push({
      type: 'warning',
      title: `${formatUsdValue(totals.totalCapitalAtRisk)} in capital at risk`,
      detail: 'Large capital concentration increases the potential impact of any exploit or admin key compromise.',
    })
  }

  // Token value at risk
  if (totals.totalTokenValueAtRisk > 0) {
    findings.push({
      type: 'warning',
      title: `${formatUsdValue(totals.totalTokenValueAtRisk)} in protocol token value`,
      detail: `The protocol's native token (${review.metadata.tokenName}) has significant market capitalization that could be affected by protocol changes.`,
    })
  }

  // Dependency count
  if (dependencies.length > 3) {
    findings.push({
      type: 'warning',
      title: `${dependencies.length} external dependencies`,
      detail: 'Multiple external dependencies increase the attack surface and risk of cascading failures.',
    })
  } else if (dependencies.length <= 1) {
    findings.push({
      type: 'positive',
      title: 'Minimal external dependencies',
      detail: `The protocol relies on ${dependencies.length === 0 ? 'no' : 'only one'} external system${dependencies.length === 1 && dependencies[0] ? ` (${dependencies[0].name})` : ''}, reducing third-party risk.`,
    })
  }

  return findings
}

/** Glossary of DeFi terms */
export const GLOSSARY: Record<string, string> = {
  EOA: 'Externally Owned Account — a blockchain address controlled by a single private key, representing one person or entity.',
  Multisig: 'Multi-signature wallet — requires multiple parties to approve a transaction (e.g., 3-of-5 means 3 out of 5 keyholders must sign).',
  Timelock: 'A smart contract mechanism that enforces a mandatory waiting period before changes take effect, giving users time to react.',
  Proxy: 'A contract pattern that allows upgrading the underlying logic while keeping the same address. Users interact with the proxy, which delegates to an implementation.',
  'Permissioned Function': 'A smart contract function that can only be called by specific addresses (admins), not by the general public.',
  'Capital at Risk': 'The total USD value of funds that could be affected if an admin key is compromised or misused.',
  Immutable: 'A contract that cannot be changed after deployment — its code and behavior are permanently fixed on the blockchain.',
  CDP: 'Collateralized Debt Position — a mechanism where users lock collateral to borrow assets, commonly used in stablecoin protocols.',
  Oracle: 'A service that brings external data (like asset prices) onto the blockchain for smart contracts to use.',
  Governance: 'A contract or system that manages decision-making for a protocol, typically through token voting or delegated authority.',
}
