import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useIndex, useAllReviews } from '../../data/hooks'
import { formatUsdValue } from '../../utils/format'
import { adminTypeColor } from '../../utils/colors'
import { ProtocolTypeBadge } from '../../components/ProtocolTypeBadge'
import { UsdValue } from '../../components/UsdValue'
import type { CompiledReview } from '../../types'
import { getHumanAdmins } from '../../utils/admins'

type SortKey = 'name' | 'capital' | 'tokenValue' | 'dependencies'

function hasGovernance(review: CompiledReview): boolean {
  return review.admins.some((a) => a.isGovernance)
}

export function LandingPage() {
  const { data: indexData, isLoading: indexLoading } = useIndex()
  const { data: allReviews, isLoading: reviewsLoading } = useAllReviews()

  const [sortKey, setSortKey] = useState<SortKey>('capital')
  const [sortAsc, setSortAsc] = useState(false)

  const isLoading = indexLoading || reviewsLoading
  const protocols = indexData?.protocols ?? []

  const reviewMap = useMemo(() => {
    const map = new Map<string, CompiledReview>()
    if (allReviews) {
      for (const r of allReviews) {
        map.set(r.metadata.protocolSlug, r)
      }
    }
    return map
  }, [allReviews])

  const sorted = useMemo(() => {
    return [...protocols].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'capital':
          cmp = a.totals.totalCapitalAtRisk - b.totals.totalCapitalAtRisk
          break
        case 'tokenValue':
          cmp = (a.totals.totalTokenValue ?? a.totals.totalTokenValueAtRisk) - (b.totals.totalTokenValue ?? b.totals.totalTokenValueAtRisk)
          break
        case 'dependencies':
          cmp = a.totals.dependencyCount - b.totals.dependencyCount
          break
      }
      return sortAsc ? cmp : -cmp
    })
  }, [protocols, sortKey, sortAsc, reviewMap])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-72 rounded-lg bg-bg-muted" />
          <div className="h-4 w-96 rounded bg-bg-muted" />
          <div className="h-64 rounded-xl bg-bg-muted" />
        </div>
      </div>
    )
  }

  if (!indexData) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-status-red">Failed to load data.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 animate-fade-in">
      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-secondary">
          DeFi Protocol Reviews
        </h1>
        <div className="mt-6 flex items-center gap-8">
          <div>
            <span className="text-3xl font-bold text-text-primary tabular-nums">
              {indexData.globalTotals.protocolsReviewed}
            </span>
            <span className="ml-2 text-sm text-text-muted uppercase tracking-wide">protocols</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <span className="text-3xl font-bold text-capital tabular-nums">
              {formatUsdValue(indexData.globalTotals.totalCapitalAtRisk)}
            </span>
            <span className="ml-2 text-sm text-text-muted uppercase tracking-wide">total TVL</span>
          </div>
        </div>
      </div>

      {/* Protocol Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b border-border">
              <SortHeader label="Protocol" sortKey="name" current={sortKey} asc={sortAsc} onToggle={toggleSort} />
              <th className="text-left px-4 py-3 font-medium text-text-muted text-xs">Type</th>
              <SortHeader label="TVL" sortKey="capital" current={sortKey} asc={sortAsc} onToggle={toggleSort} align="right" />
              <SortHeader label="Token Value" sortKey="tokenValue" current={sortKey} asc={sortAsc} onToggle={toggleSort} align="right" />
              <th className="px-4 py-3 text-xs font-medium text-text-muted text-left whitespace-nowrap w-[1%]">Admins</th>
              <th className="px-4 py-3 text-xs font-medium text-text-muted text-center whitespace-nowrap w-[1%]">Gov</th>
              <SortHeader label="Dependencies" sortKey="dependencies" current={sortKey} asc={sortAsc} onToggle={toggleSort} align="right" shrink />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const review = reviewMap.get(p.slug)
              const govExists = review ? hasGovernance(review) : false
              const adminBreakdown = review ? computeAdminBreakdown(review) : {}

              return (
                <tr
                  key={p.slug}
                  className="border-b border-border/50 last:border-0 hover:bg-bg-muted/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <Link to={`/protocol/${p.slug}`} className="font-semibold text-text-primary hover:text-brand-600 hover:underline decoration-brand-200 underline-offset-2 transition-colors duration-150">
                      {p.name}
                    </Link>
                    <div className="text-xs text-text-muted mt-0.5">{p.chain}</div>
                  </td>
                  <td className="px-4 py-3"><ProtocolTypeBadge type={p.projectType} /></td>
                  <td className="px-4 py-3 text-right"><UsdValue value={p.totals.totalCapitalAtRisk} variant="capital" /></td>
                  <td className="px-4 py-3 text-right">
                    {(p.totals.totalTokenValue ?? p.totals.totalTokenValueAtRisk) > 0 ? <UsdValue value={p.totals.totalTokenValue ?? p.totals.totalTokenValueAtRisk} variant="token" /> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><AdminTypeBar breakdown={adminBreakdown} /></td>
                  <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
                    {govExists
                      ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 text-brand-600" title="Has governance">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </span>
                      : <span className="text-text-muted" title="No governance">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{p.totals.dependencyCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeAdminBreakdown(review: CompiledReview) {
  const counts: Record<string, number> = {}
  for (const admin of getHumanAdmins(review.admins)) {
    const t = admin.isGovernance ? 'Governance' : (admin.adminType || 'Unknown')
    counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

function AdminTypeBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0)
  if (total === 0) return <span className="inline-flex items-center gap-1.5 text-xs text-status-green"><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>None</span>
  return (
    <div className="flex items-center gap-1.5">
      {Object.entries(breakdown).map(([type, count]) => (
        <span key={type} className="inline-flex items-center gap-1 text-xs" title={`${count} ${type}`}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: adminTypeColor(type) }} />
          <span className="text-text-secondary">{count}</span>
        </span>
      ))}
    </div>
  )
}

function SortHeader({ label, sortKey, current, asc, onToggle, align = 'left', shrink }: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean; onToggle: (k: SortKey) => void; align?: 'left' | 'right'; shrink?: boolean
}) {
  const active = current === sortKey
  return (
    <th
      className={`px-4 py-3 font-medium cursor-pointer select-none transition-colors duration-150 text-xs whitespace-nowrap ${active ? 'text-brand-600' : 'text-text-muted hover:text-text-secondary'} ${align === 'right' ? 'text-right' : 'text-left'} ${shrink ? 'w-[1%]' : ''}`}
      onClick={() => onToggle(sortKey)}
    >
      {label}
      {active && <span className="ml-1 text-brand-400">{asc ? '\u25B2' : '\u25BC'}</span>}
    </th>
  )
}

