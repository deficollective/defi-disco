import type {
  CompiledAdmin,
  CompiledAdminFunction,
  CompiledGovernanceDuration,
  CompiledReview,
} from '../types'

const DAY = 86_400
const HOUR = 3_600

// Trace capital under $1 USD is ignored — upstream capital math occasionally
// leaks sub-cent floating-point dust (e.g. Lido Oracle Committee EOAs show
// ~$3e-5 reachable capital each), which should not trigger EOA detection or
// inflate governance impact share.
const DUST_USD = 1

function adminImpact(a: CompiledAdmin): number {
  return (a.totalReachableCapital ?? 0) + (a.totalReachableTokenValue ?? 0)
}

function hasMeaningfulImpact(a: CompiledAdmin): boolean {
  return adminImpact(a) >= DUST_USD
}

function computeVerifiability(review: CompiledReview): number {
  const { totals, audits = [] } = review
  const coverage = totals.coverage
  const loc = totals.linesOfCode ?? 0
  const auditCount = audits.length
  const maxBounty = audits.reduce((m, a) => Math.max(m, a.bounty ?? 0), 0)

  const coverageScore =
    coverage === undefined
      ? 40
      : coverage >= 1
        ? 50
        : coverage >= 0.95
          ? 40
          : coverage >= 0.9
            ? 20
            : 5

  const auditScore =
    auditCount === 0
      ? 0
      : auditCount === 1
        ? 10
        : auditCount === 2
          ? 18
          : auditCount === 3
            ? 22
            : 25

  const locScore =
    loc === 0
      ? 8
      : loc <= 5000
        ? 15
        : loc <= 10000
          ? 12
          : loc <= 20000
            ? 8
            : loc <= 50000
              ? 4
              : 1

  const bountyScore =
    maxBounty === 0
      ? 0
      : maxBounty < 100_000
        ? 2
        : maxBounty < 500_000
          ? 5
          : maxBounty < 1_000_000
            ? 7
            : 10

  return Math.min(
    100,
    Math.round(coverageScore + auditScore + locScore + bountyScore),
  )
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

function computeGovernance(review: CompiledReview): number {
  const { admins, totals, governance } = review
  const tvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  // Without a documented governance process there's nothing to score —
  // return a neutral 55 (researcher hasn't filled in governance.json yet,
  // or the protocol genuinely has no governance layer). This is preferable
  // to either rewarding (95) or penalising (low) the absence.
  if (governance === undefined) return 55

  const govAdmins = admins.filter((a) => a.isGovernance && hasMeaningfulImpact(a))

  const execScore = governance.voteExecution === 'onchain' ? 35 : 10

  const delay =
    durationSeconds(governance?.proposalPeriod) +
    durationSeconds(governance?.executionDelay)
  const delayScore =
    delay >= 10 * DAY
      ? 35
      : delay >= 7 * DAY
        ? 28
        : delay >= 3 * DAY
          ? 18
          : delay >= 1 * DAY
            ? 10
            : delay >= 12 * HOUR
              ? 5
              : 2

  const impactAdmins =
    govAdmins.length > 0 ? govAdmins : admins.filter(hasMeaningfulImpact)
  const govImpact = impactAdmins.reduce((s, a) => s + adminImpact(a), 0)
  // Admins can reach overlapping contracts, so raw sums may exceed TVS.
  // Cap share at 1.0 — the tier boundaries are what matters, not the ratio.
  const share = Math.min(1, tvs > 0 ? govImpact / tvs : govImpact > 0 ? 1 : 0)
  const impactScore =
    share <= 0.1 ? 30 : share <= 0.3 ? 22 : share <= 0.6 ? 12 : 5

  return Math.min(100, Math.round(execScore + delayScore + impactScore))
}

// A timelock long enough to let users exit neutralises an admin action.
// Tiers express how much of the action's fund impact survives the delay.
function delayAttenuation(delaySeconds: number): number {
  if (delaySeconds >= 7 * DAY) return 0
  if (delaySeconds >= 3 * DAY) return 0.4
  if (delaySeconds >= 1 * DAY) return 0.7
  return 1
}

// Shortest delay gating a function's fund-impacting paths — an attacker takes
// the fastest route, so a single undelayed path means the function is undelayed.
function functionDelaySeconds(f: CompiledAdminFunction): number {
  const delays = (f.mitigations ?? [])
    .filter((m) => m.type === 'delay' && typeof m.delaySeconds === 'number')
    .map((m) => m.delaySeconds as number)
  return delays.length > 0 ? Math.min(...delays) : 0
}

function functionImpactUsd(f: CompiledAdminFunction): number {
  let impact = f.directFundsUsd + f.directTokenValueUsd
  for (const rc of f.reachableContracts) {
    if (!rc.fundsAtRisk) continue
    const raw = rc.fundsUsd + rc.tokenValueUsd
    impact +=
      rc.effectiveCapUsd !== undefined ? Math.min(raw, rc.effectiveCapUsd) : raw
  }
  return impact
}

// "How many independent keys must be compromised." EOA and a 1/N multisig
// both anchor at 1.0 (worst case); each extra required signer buys safety.
function adminRiskMultiplier(a: CompiledAdmin): number {
  if (a.adminType === 'EOA' || a.adminType === 'EOAPermissioned') return 1
  if (a.adminType === 'Multisig') {
    const t = a.multisigThreshold
    if (t === undefined || t < 1) return 0.7
    return Math.max(0.35, 1 - 0.15 * (t - 1))
  }
  return 0.5
}

function computeControl(review: CompiledReview): number {
  const { admins, totals } = review
  const tvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  const impacting = admins.filter(hasMeaningfulImpact)
  if (impacting.length === 0) return 100

  // Worst admin sets the score. Capital analysis over-flares — many admins
  // all show 100% of TVS reachable — so combining risks across admins isn't
  // meaningful yet; the single worst admin is the honest signal.
  let worstRisk = 0
  for (const a of impacting) {
    let effectiveImpact = 0
    for (const f of a.functions) {
      const raw = functionImpactUsd(f)
      if (raw <= 0) continue
      effectiveImpact += raw * delayAttenuation(functionDelaySeconds(f))
    }
    // Per-function sums can double-count shared reachable contracts — cap at
    // the admin's deduplicated reachable total.
    effectiveImpact = Math.min(effectiveImpact, adminImpact(a))

    const fundShare =
      tvs > 0
        ? Math.min(1, effectiveImpact / tvs)
        : effectiveImpact > 0
          ? 1
          : 0
    worstRisk = Math.max(worstRisk, adminRiskMultiplier(a) * fundShare)
  }

  return Math.round(100 * (1 - worstRisk))
}

// Dependency score is worst-exposure driven. DEP_K_WORST sets how hard a
// fully-exposed entity hits — it caps the score at 100·(1−DEP_K_WORST).
// DEP_K_TAIL is the concave penalty applied to every other exposed entity.
const DEP_K_WORST = 0.65
const DEP_K_TAIL = 7.5

function computeDependencies(review: CompiledReview): number {
  const { dependencies, totals } = review
  const tvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  // Group by entity (fall back to address when untagged) — depending on a
  // protocol with N contracts is one dependency risk, not N. Within an
  // entity the contracts cover disjoint capital (losing the entity loses
  // all of them), so exposure is the summed TVS share, capped at 1.
  const exposureByEntity = new Map<string, number>()
  for (const d of dependencies) {
    const impact = (d.totalFundsAtRisk ?? 0) + (d.totalTokenValueAtRisk ?? 0)
    if (impact < DUST_USD) continue
    const key = d.entity ?? d.address
    const share = tvs > 0 ? Math.min(1, impact / tvs) : 1
    exposureByEntity.set(
      key,
      Math.min(1, (exposureByEntity.get(key) ?? 0) + share),
    )
  }

  const shares = [...exposureByEntity.values()].sort((a, b) => b - a)
  if (shares.length === 0) return 100

  // The single worst entity defines the dependency risk; everything beyond
  // it is a concave (√) tail, so dependency-heavy protocols degrade smoothly
  // rather than cratering to 0.
  const worst = shares[0]
  const tail = shares.reduce((s, x) => s + x, 0) - worst
  const score = 100 * (1 - DEP_K_WORST * worst) - DEP_K_TAIL * Math.sqrt(tail)
  return Math.round(Math.max(0, Math.min(100, score)))
}

export function deriveRadarData(review: CompiledReview) {
  const { resources = [] } = review

  const frontendCount = resources.filter((r) => r.type === 'frontend').length

  const control = computeControl(review)
  const deps = computeDependencies(review)
  const access =
    frontendCount === 0
      ? 20
      : frontendCount === 1
        ? 50
        : frontendCount <= 3
          ? 75
          : 100
  const verifiability = computeVerifiability(review)
  const governance = computeGovernance(review)

  return [
    { axis: 'ADMIN CONTROL', value: control },
    { axis: 'DEPENDENCIES', value: deps },
    { axis: 'ACCESS', value: access },
    { axis: 'VERIFIABILITY', value: verifiability },
    { axis: 'GOVERNANCE', value: governance },
  ]
}
