import type {
  CompiledAdmin,
  CompiledDependency,
  CompiledGovernanceDuration,
  CompiledReview,
} from '../types'

const DAY = 86_400
const HOUR = 3_600

// Trace capital under $1 USD is ignored — upstream capital math occasionally
// leaks sub-cent floating-point dust (e.g. Lido Oracle Committee EOAs show
// ~$3e-5 reachable capital each), which should not trigger EOA detection or
// inflate impact share.
const DUST_USD = 1

function adminImpact(a: CompiledAdmin): number {
  return (a.totalReachableCapital ?? 0) + (a.totalReachableTokenValue ?? 0)
}

function dependencyImpact(d: CompiledDependency): number {
  return (d.totalFundsAtRisk ?? 0) + (d.totalTokenValueAtRisk ?? 0)
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 1
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

// ---------------------------------------------------------------------------
// Weight functions: 0 = perfect mitigation, 1 = no mitigation.
// Combined multiplicatively across independent mitigations (setup × delay ×
// concentration), so any one strong lever can dominate.
// ---------------------------------------------------------------------------

function setupWeight(admin: CompiledAdmin): number {
  if (admin.adminType === 'EOA' || admin.adminType === 'EOAPermissioned') {
    return 1.0
  }
  if (admin.adminType === 'Multisig' && admin.multisigThreshold !== undefined) {
    const t = admin.multisigThreshold
    if (t >= 5) return 0.0
    if (t === 4) return 0.25
    if (t === 3) return 0.5
    if (t === 2) return 0.75
    return 1.0 // T = 1 (or below) — single signer is no better than EOA
  }
  // Other admin types (Upgradeable, Timelock, Immutable, …) get no setup
  // credit — only delay-based mitigations protect them.
  return 1.0
}

function delayWeightFromSeconds(seconds: number): number {
  if (seconds >= 30 * DAY) return 0.0
  if (seconds >= 7 * DAY) return 0.1
  if (seconds >= 3 * DAY) return 0.3
  if (seconds >= 1 * DAY) return 0.5
  if (seconds > 0) return 0.8
  return 1.0
}

/**
 * Minimum effective delay an admin is subject to across its functions.
 * For each function: take the strongest delay mitigation (max delaySeconds).
 * Across functions: take the weakest path (min) — admin can pick the easiest
 * route. A function with no `delay` mitigation contributes 0.
 */
function adminMinDelaySeconds(admin: CompiledAdmin): number {
  let min = Infinity
  for (const fn of admin.functions ?? []) {
    const fnDelay = (fn.mitigations ?? [])
      .filter((m) => m.type === 'delay')
      .reduce((acc, m) => Math.max(acc, m.delaySeconds ?? 0), 0)
    if (fnDelay < min) min = fnDelay
    if (min === 0) return 0
  }
  return Number.isFinite(min) ? min : 0
}

function adminWeight(admin: CompiledAdmin): number {
  return setupWeight(admin) * delayWeightFromSeconds(adminMinDelaySeconds(admin))
}

const FIXED_UNIT_SECONDS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: HOUR,
  day: DAY,
  week: 7 * DAY,
}

function parseFixedDuration(value: string | undefined): number {
  if (!value) return 0
  const re = /(\d+(?:\.\d+)?)\s*(second|minute|hour|day|week)s?/gi
  let total = 0
  for (const m of value.matchAll(re)) {
    const n = Number.parseFloat(m[1])
    const factor = FIXED_UNIT_SECONDS[m[2].toLowerCase()]
    if (!Number.isNaN(n) && factor) total += n * factor
  }
  return total
}

function durationSeconds(d: CompiledGovernanceDuration | undefined): number {
  if (!d) return 0
  if (d.kind === 'none') return 0
  if (d.kind === 'fieldRef')
    return d.resolved && typeof d.seconds === 'number' ? d.seconds : 0
  if (d.kind === 'fixed') return parseFixedDuration(d.value)
  return 0
}

function hasMeaningfulImpact(impact: number): boolean {
  return impact >= DUST_USD
}

// Admin types that represent an actual control surface (a human signer or an
// upgradeable contract whose ownership matters). Mirrors the same set used in
// reviewCompiler.ts when building the per-function risk view, so the radar
// stays consistent with what the report shows. Immutable/Revoked/Token/etc.
// contracts can hold permissions but aren't a control risk on their own.
const MEANINGFUL_ADMIN_TYPES = new Set([
  'EOA',
  'EOAPermissioned',
  'Multisig',
  'Upgradeable',
])

function isMeaningfulAdmin(a: CompiledAdmin): boolean {
  return MEANINGFUL_ADMIN_TYPES.has(a.adminType) || a.isGovernance
}

// ---------------------------------------------------------------------------
// Per-dimension scoring
// riskPct = Σ entryTVS × weight / protocolTVS  (can exceed 1)
// radarValue = round((1 − clamp01(riskPct)) × 100)
// ---------------------------------------------------------------------------

function protocolTvs(review: CompiledReview): number {
  return (
    (review.totals.totalCapitalAtRisk ?? 0) +
    (review.totals.totalTokenValue ?? 0)
  )
}

function radarFromRisk(riskPct: number): number {
  return Math.round((1 - clamp01(riskPct)) * 100)
}

function computeControl(review: CompiledReview): number {
  const tvs = protocolTvs(review)
  // Pool: non-governance admins of a controllable type, with meaningful impact.
  // `Immutable` / `Revoked` / `Token` etc. contracts can hold permissions but
  // aren't a real control surface — exclude them so they don't dominate risk.
  const pool = review.admins.filter(
    (a) =>
      !a.isGovernance &&
      isMeaningfulAdmin(a) &&
      hasMeaningfulImpact(adminImpact(a)),
  )
  if (pool.length === 0) return 100
  if (tvs <= 0) return 0
  const weighted = pool.reduce((s, a) => s + adminImpact(a) * adminWeight(a), 0)
  return radarFromRisk(weighted / tvs)
}

function computeGovernance(review: CompiledReview): number {
  const { admins, governance } = review
  // Without a documented governance process there's nothing to score —
  // return a neutral 55 (researcher hasn't filled in governance.json yet,
  // or the protocol genuinely has no governance layer).
  if (governance === undefined) return 55

  const tvs = protocolTvs(review)
  const pool = admins.filter(
    (a) => a.isGovernance && hasMeaningfulImpact(adminImpact(a)),
  )
  if (pool.length === 0) return 100
  if (tvs <= 0) return 0

  // Governance formula differs from admin/dependency: sum reachable TVS
  // across governance admins, normalize against protocol TVS, cap the share
  // at 100% before applying weight. This avoids over-counting when several
  // governance contracts (Executor, PayloadsController, …) each independently
  // reach the same funds — overlap raises the raw sum above TVS but the cap
  // keeps the score bounded.
  const sumImpact = pool.reduce((s, a) => s + adminImpact(a), 0)
  const cappedShare = Math.min(1, sumImpact / tvs)

  // Governance weight: delay × concentration. Concentration data isn't
  // available yet, so it's pinned at 1.0 (worst) — only delay reduces risk.
  const totalDelay =
    durationSeconds(governance.proposalPeriod) +
    durationSeconds(governance.executionDelay)
  const concentrationWeight = 1.0
  const weight = delayWeightFromSeconds(totalDelay) * concentrationWeight

  return radarFromRisk(cappedShare * weight)
}

function computeDependencies(review: CompiledReview): number {
  const tvs = protocolTvs(review)
  const pool = review.dependencies.filter((d) =>
    hasMeaningfulImpact(dependencyImpact(d)),
  )
  if (pool.length === 0) return 100
  if (tvs <= 0) return 0
  // No mitigations modeled for dependencies yet — weight = 1 for every entry.
  const weighted = pool.reduce((s, d) => s + dependencyImpact(d), 0)
  return radarFromRisk(weighted / tvs)
}

function computeVerifiability(review: CompiledReview): number {
  const { coverage, fundsVerifiability } = review.totals
  // Both inputs are 0..100 percentages. Combined verifiability is the product
  // of code-side coverage and on-chain funds verifiability. If coverage is
  // missing (compiler hasn't run), treat as 0 — no claim of verifiability.
  if (coverage === undefined) return 0
  const fv = fundsVerifiability ?? 100
  return Math.round((coverage * fv) / 100)
}

function computeAccess(review: CompiledReview): number {
  const frontendCount = (review.resources ?? []).filter(
    (r) => r.type === 'frontend',
  ).length
  if (frontendCount === 0) return 20
  if (frontendCount === 1) return 50
  if (frontendCount <= 3) return 75
  return 100
}

export function deriveRadarData(review: CompiledReview) {
  return [
    { axis: 'ADMIN CONTROL', value: computeControl(review) },
    { axis: 'DEPENDENCIES', value: computeDependencies(review) },
    { axis: 'ACCESS', value: computeAccess(review) },
    { axis: 'VERIFIABILITY', value: computeVerifiability(review) },
    { axis: 'GOVERNANCE', value: computeGovernance(review) },
  ]
}
