import type { CompiledReview, CompiledDependency } from '../../../../types'
import { formatUsdValue } from '../../../../utils/format'
import { MitigationBadge } from '../../../../components/MitigationBadge'
import { deduplicateMitigations } from '../explorer/shared'
import { SectionHeader, ShowMoreButton } from './_shared'

interface DependenciesSectionProps {
  review: CompiledReview
  onShowMore: () => void
}

function depFunds(dep: CompiledDependency): number {
  return dep.totalFundsAtRisk + (dep.totalTokenValueAtRisk ?? 0)
}

export function DependenciesSection({ review, onShowMore }: DependenciesSectionProps) {
  const { dependencies, totals } = review
  const totalTvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  // Empty state
  if (dependencies.length === 0) {
    return (
      <div className="border border-capital/30 bg-capital/5 rounded-lg p-[33px]">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-full bg-capital/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="size-5 text-capital" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[18px] text-capital mb-2">
              No External Dependencies
            </p>
            <p className="text-[14px] text-text-muted leading-[22px]">
              This protocol does not rely on any external contracts for its core
              operations. This minimizes the risk of failures cascading from
              third parties.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Group by entity (null last)
  const grouped = new Map<string | null, CompiledDependency[]>()
  for (const dep of dependencies) {
    const key = dep.entity
    const list = grouped.get(key) ?? []
    list.push(dep)
    grouped.set(key, list)
  }
  const entityGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return a.localeCompare(b)
  })

  const namedEntities = entityGroups
    .filter(([e]) => e !== null)
    .map(([e]) => e as string)

  const totalAtRisk = dependencies.reduce((s, d) => s + depFunds(d), 0)
  const atRiskPct = totalTvs > 0 ? Math.round((totalAtRisk / totalTvs) * 100) : 0

  return (
    <div className="flex gap-[30px] items-start">
      {/* Left: grouped dependency list */}
      <div className="flex-1 min-w-0 border border-border rounded-lg p-[33px] flex flex-col gap-6">
        <SectionHeader
          icon={
            <svg className="size-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          }
          label="External Dependencies"
          action={<ShowMoreButton onClick={onShowMore} />}
        />

        {/* One row per entity group */}
        <div className="flex flex-col gap-6">
          {entityGroups.map(([entity, deps]) => {
            const groupFunds = deps.reduce((s, d) => s + depFunds(d), 0)
            const groupLabel =
              entity ?? (namedEntities.length > 0 ? 'Other' : 'Unknown')
            const maxGroupFunds = Math.max(
              ...entityGroups.map(([, ds]) => ds.reduce((s, d) => s + depFunds(d), 0)),
              0,
            )
            const barWidth = maxGroupFunds > 0 ? (groupFunds / maxGroupFunds) * 100 : 0
            const mitigations = deduplicateMitigations(
              deps.flatMap((d) => d.functions?.flatMap((f) => f.mitigations ?? []) ?? []),
            )

            return (
              <div key={entity ?? '__ungrouped'} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-text-primary">{groupLabel}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-text-muted bg-border/60">
                      {deps.length} contract{deps.length !== 1 ? 's' : ''}
                    </span>
                    {mitigations.map((m, i) => (
                      <MitigationBadge key={i} mitigation={m} />
                    ))}
                  </div>
                  <span className="font-mono font-bold text-sm text-text-primary shrink-0 ml-2">
                    {groupFunds > 0 ? formatUsdValue(groupFunds) : '—'}
                  </span>
                </div>
                <div className="h-[10px] bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.max(barWidth, barWidth > 0 ? 1 : 0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-[312px] shrink-0 bg-bg-card border border-border rounded-lg p-[33px] flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <svg className="size-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
          <span className="font-bold text-[12px] uppercase text-text-muted tracking-[1.2px]">
            Dependency Stats
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Impacted TVS
          </p>
          <p className="font-mono font-bold text-[30px] leading-[36px] text-text-primary">
            {atRiskPct}%
          </p>
          <p className="text-xs text-text-muted mt-1">
            Proportion of TVS exposed to external dependency risk.
          </p>
        </div>

        <div className="border-t border-border pt-6 flex flex-col gap-2">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Dependencies
          </p>
          <p className="font-mono font-bold text-[30px] leading-[36px] text-text-primary">
            {totals.dependencyCount}
          </p>
          {namedEntities.length > 0 && (
            <p className="text-xs text-text-muted">
              from {namedEntities.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
