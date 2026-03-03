import type {
  CompiledReview,
  CompiledAdmin,
  CompiledDependency,
  CompiledFundHolder,
} from '../types'
import { formatUsdValue } from './format'

/** Classify overall risk level based on admin types and capital */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskAssessment {
  level: RiskLevel
  label: string
  color: string
  bgColor: string
  borderColor: string
  summary: string
}

/** Determine the overall risk assessment for a protocol */
export function assessRisk(review: CompiledReview): RiskAssessment {
  const { admins, totals, dependencies } = review

  const hasEOA = admins.some(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned',
  )
  const hasMultisig = admins.some((a) => a.adminType === 'Multisig')
  const hasHighCapital = totals.totalCapitalAtRisk > 50_000_000
  const hasOnlyImmutable = admins.every(
    (a) =>
      a.adminType === 'Revoked' ||
      a.adminType === 'Untemplatized' ||
      a.adminType === 'Contract',
  )
  const allZeroAddress = admins.every(
    (a) =>
      a.address.includes('0x000000000000000000000000000000000000') ||
      a.adminType === 'Revoked',
  )

  if (allZeroAddress || (hasOnlyImmutable && !hasEOA && !hasMultisig)) {
    return {
      level: 'low',
      label: 'Low Risk',
      color: 'text-status-green',
      bgColor: 'bg-status-green/10',
      borderColor: 'border-status-green/30',
      summary: buildLowRiskSummary(review),
    }
  }

  if (hasEOA && hasHighCapital) {
    return {
      level: 'critical',
      label: 'Critical Risk',
      color: 'text-status-red',
      bgColor: 'bg-status-red/10',
      borderColor: 'border-status-red/30',
      summary: buildCriticalRiskSummary(review),
    }
  }

  if (hasEOA || (hasMultisig && hasHighCapital && dependencies.length > 3)) {
    return {
      level: 'high',
      label: 'High Risk',
      color: 'text-status-amber',
      bgColor: 'bg-status-amber/10',
      borderColor: 'border-status-amber/30',
      summary: buildHighRiskSummary(review),
    }
  }

  return {
    level: 'medium',
    label: 'Medium Risk',
    color: 'text-status-amber',
    bgColor: 'bg-status-amber/10',
    borderColor: 'border-status-amber/30',
    summary: buildMediumRiskSummary(review),
  }
}

function buildLowRiskSummary(review: CompiledReview): string {
  const { metadata, totals } = review
  return `${metadata.protocolName} demonstrates strong decentralization properties. All ${totals.contractCount} contracts are immutable with no upgradeable admin keys, meaning no single party can unilaterally modify the protocol after deployment.`
}

function buildCriticalRiskSummary(review: CompiledReview): string {
  const { metadata, admins, totals } = review
  const eoas = admins.filter(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned',
  )
  return `${metadata.protocolName} has critical centralization risks. ${eoas.length} externally owned account${eoas.length !== 1 ? 's' : ''} (EOA) control${eoas.length === 1 ? 's' : ''} permissioned functions over ${formatUsdValue(totals.totalCapitalAtRisk)} in capital. A single compromised key could put user funds at risk.`
}

function buildHighRiskSummary(review: CompiledReview): string {
  const { metadata, admins, totals } = review
  const keyAdmins = admins.filter(
    (a) =>
      a.adminType === 'EOA' ||
      a.adminType === 'EOAPermissioned' ||
      a.adminType === 'Multisig',
  )
  return `${metadata.protocolName} has significant centralization points. ${keyAdmins.length} key admin${keyAdmins.length !== 1 ? 's' : ''} control permissioned functions affecting ${formatUsdValue(totals.totalCapitalAtRisk)} in capital. While some safeguards exist, concentrated control remains a concern.`
}

function buildMediumRiskSummary(review: CompiledReview): string {
  const { metadata, totals, admins } = review
  const multisigs = admins.filter((a) => a.adminType === 'Multisig')
  if (multisigs.length > 0) {
    return `${metadata.protocolName} uses multisig governance to manage ${formatUsdValue(totals.totalCapitalAtRisk)} in capital. While multisigs provide shared control, they still represent centralization compared to fully immutable or DAO-governed protocols.`
  }
  return `${metadata.protocolName} has a moderate centralization profile with ${totals.adminCount} admin${totals.adminCount !== 1 ? 's' : ''} and ${formatUsdValue(totals.totalCapitalAtRisk)} in capital at risk.`
}

/** Get a plain-English description of an admin type */
export function describeAdminType(adminType: string): string {
  switch (adminType) {
    case 'EOA':
      return 'A single private key (externally owned account). If this key is compromised, an attacker gains full control.'
    case 'EOAPermissioned':
      return 'A permissioned externally owned account. Controlled by a single private key with specific permissions.'
    case 'Multisig':
      return 'A multi-signature wallet requiring multiple parties to approve transactions, providing shared control.'
    case 'Timelock':
      return 'A timelock contract that enforces a delay before changes take effect, giving users time to react.'
    case 'Contract':
      return 'A smart contract with programmatic rules governing its behavior.'
    case 'Diamond':
      return 'A diamond proxy pattern contract that can be upgraded by swapping facets.'
    case 'Revoked':
      return 'Ownership has been permanently renounced. No one can exercise these permissions.'
    case 'Untemplatized':
      return 'An internal protocol contract acting as a permissioned caller. Not a human-controlled admin.'
    default:
      return 'An entity with administrative permissions over the protocol.'
  }
}

/** Build a narrative sentence about what an admin can do */
export function narrativeForAdmin(admin: CompiledAdmin): string {
  const funcs = admin.functions
  if (funcs.length === 0) return ''

  const uniqueContracts = new Set(funcs.map((f) => f.contractName))
  const contractWord =
    uniqueContracts.size === 1
      ? uniqueContracts.values().next().value
      : `${uniqueContracts.size} contracts`

  const capital = admin.totalDirectCapital
  const capitalStr = capital > 0 ? ` affecting ${formatUsdValue(capital)}` : ''

  return `Controls ${funcs.length} function${funcs.length !== 1 ? 's' : ''} on ${contractWord}${capitalStr}.`
}

/** Summarize dependency risk for a reader */
export function narrativeForDependency(dep: CompiledDependency): string {
  const funcCount = dep.functions.length
  if (funcCount === 0) return dep.description

  const contracts = new Set(dep.functions.map((f) => f.contractName))
  return `Used by ${funcCount} function${funcCount !== 1 ? 's' : ''} across ${contracts.size} contract${contracts.size !== 1 ? 's' : ''}. ${dep.description}`
}

/** Build a "what does this mean" explanation for fund holders */
export function narrativeForFund(fund: CompiledFundHolder): string {
  const total =
    (fund.balances?.totalUsdValue ?? 0) + (fund.positions?.totalUsdValue ?? 0)
  if (total === 0) return fund.description

  const parts: string[] = []
  if (fund.balances && fund.balances.totalUsdValue > 0) {
    parts.push(`${formatUsdValue(fund.balances.totalUsdValue)} in token balances`)
  }
  if (fund.positions && fund.positions.totalUsdValue > 0) {
    parts.push(
      `${formatUsdValue(fund.positions.totalUsdValue)} in DeFi positions`,
    )
  }

  return `Holds ${parts.join(' and ')}. ${fund.description}`
}

/** Generate key findings from the review data */
export interface KeyFinding {
  type: 'positive' | 'concern' | 'critical' | 'info'
  title: string
  detail: string
}

export function generateKeyFindings(review: CompiledReview): KeyFinding[] {
  const findings: KeyFinding[] = []
  const { admins, dependencies, totals, funds, metadata } = review

  // Check for immutability
  const hasRevokedOwnership = admins.some(
    (a) =>
      a.adminType === 'Revoked' ||
      a.address.includes('0x000000000000000000000000000000000000'),
  )
  const allInternal = admins.every(
    (a) => a.adminType === 'Untemplatized' || a.adminType === 'Revoked',
  )

  if (allInternal) {
    findings.push({
      type: 'positive',
      title: 'Fully immutable protocol',
      detail: `All ${totals.contractCount} contracts have no external admin keys. The protocol cannot be modified after deployment.`,
    })
  } else if (hasRevokedOwnership) {
    findings.push({
      type: 'positive',
      title: 'Some ownership renounced',
      detail:
        'Ownership has been revoked on some contracts, reducing centralization risk.',
    })
  }

  // Check for EOA admins
  const eoas = admins.filter(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned',
  )
  if (eoas.length > 0) {
    const maxCapital = Math.max(...eoas.map((e) => e.totalDirectCapital))
    findings.push({
      type: 'critical',
      title: `${eoas.length} EOA admin${eoas.length !== 1 ? 's' : ''} detected`,
      detail: `Single-key accounts control permissioned functions with up to ${formatUsdValue(maxCapital)} at risk. EOAs are the highest centralization risk as a single compromised key enables full control.`,
    })
  }

  // Multisig analysis
  const multisigs = admins.filter((a) => a.adminType === 'Multisig')
  if (multisigs.length > 0) {
    const multisigNames = multisigs.map((m) => m.name).join(', ')
    findings.push({
      type: 'info',
      title: `${multisigs.length} multisig admin${multisigs.length !== 1 ? 's' : ''}`,
      detail: `Shared control via: ${multisigNames}. Multisigs reduce single-point-of-failure risk but still represent centralized control.`,
    })
  }

  // Capital concentration
  if (totals.totalCapitalAtRisk > 100_000_000) {
    findings.push({
      type: 'concern',
      title: `${formatUsdValue(totals.totalCapitalAtRisk)} in capital at risk`,
      detail:
        'Large capital concentration means any admin compromise or dependency failure could have significant impact.',
    })
  }

  // Dependency analysis
  if (dependencies.length > 0) {
    const entities = new Set(
      dependencies.filter((d) => d.entity).map((d) => d.entity),
    )
    findings.push({
      type: dependencies.length > 5 ? 'concern' : 'info',
      title: `${dependencies.length} external dependenc${dependencies.length !== 1 ? 'ies' : 'y'}`,
      detail: `The protocol depends on ${entities.size > 0 ? Array.from(entities).join(', ') : 'external contracts'} for core operations. If any dependency fails, it could affect protocol functionality.`,
    })
  }

  // Token value
  if (totals.totalTokenValueAtRisk > 0) {
    findings.push({
      type: 'info',
      title: `${formatUsdValue(totals.totalTokenValueAtRisk)} protocol token value`,
      detail: `The protocol's native token (${metadata.tokenName}) has significant market value that could be affected by admin actions.`,
    })
  }

  return findings
}

/** Get admin type risk tier for sorting */
export function adminTypeRiskTier(adminType: string): number {
  switch (adminType) {
    case 'EOA':
    case 'EOAPermissioned':
      return 0 // highest risk
    case 'Multisig':
      return 1
    case 'Timelock':
      return 2
    case 'Contract':
    case 'Diamond':
      return 3
    case 'Untemplatized':
      return 4
    case 'Revoked':
      return 5 // lowest risk
    default:
      return 3
  }
}

/** Sort admins by risk tier (highest risk first) */
export function sortAdminsByRisk(admins: CompiledAdmin[]): CompiledAdmin[] {
  return [...admins].sort((a, b) => {
    const tierDiff = adminTypeRiskTier(a.adminType) - adminTypeRiskTier(b.adminType)
    if (tierDiff !== 0) return tierDiff
    return b.totalDirectCapital - a.totalDirectCapital
  })
}
