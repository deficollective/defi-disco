import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAllReviews } from '../../data/hooks'
import { extractMetrics, buildRadarData } from '../../utils/comparison'
import { formatUsdValue } from '../../utils/format'
import { Badge } from '../../components/Badge'
import { ProtocolTypeBadge } from '../../components/ProtocolTypeBadge'
import { ProtocolRadarChart } from './ProtocolRadarChart'
import { adminTypeBgClass } from '../../utils/colors'
import type { CompiledReview, CompiledAdmin, CompiledDependency } from '../../types'

export function ComparePage() {
  const { slugs } = useParams<{ slugs: string }>()
  const slugList = useMemo(() => (slugs ?? '').split(',').filter(Boolean), [slugs])
  const { data: reviews, isLoading, error } = useAllReviews()

  const selectedReviews = useMemo(() => {
    if (!reviews) return []
    return slugList
      .map((slug) => reviews.find((r) => r.metadata.protocolSlug === slug))
      .filter((r): r is CompiledReview => r !== undefined)
  }, [reviews, slugList])

  const metrics = useMemo(
    () => selectedReviews.map((r, i) => extractMetrics(r, i)),
    [selectedReviews],
  )

  const radarData = useMemo(() => buildRadarData(metrics), [metrics])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-text-muted">Loading comparison...</p>
      </div>
    )
  }

  if (error || selectedReviews.length < 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-status-red">
          {error ? 'Failed to load data.' : 'Select at least 2 protocols to compare.'}
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-purple-600 hover:text-purple-800"
        >
          Back to Comparison
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-purple-600 transition-colors mb-6"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Overview
      </Link>

      <h1 className="text-3xl font-bold text-text-primary mb-2">
        Side-by-Side Comparison
      </h1>
      <p className="text-text-secondary mb-8">
        Comparing {selectedReviews.map((r) => r.metadata.protocolName).join(' vs ')}
      </p>

      {/* Protocol headers */}
      <div className={`grid gap-4 mb-8`} style={{ gridTemplateColumns: `repeat(${selectedReviews.length}, 1fr)` }}>
        {selectedReviews.map((r, idx) => {
          const m = metrics[idx]
          if (!m) return null
          return (
          <div
            key={r.project}
            className="rounded-xl border-2 p-5"
            style={{ borderColor: m.color }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <h2 className="text-xl font-bold text-text-primary">
                {r.metadata.protocolName}
              </h2>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge>{r.metadata.chain}</Badge>
              <ProtocolTypeBadge type={r.metadata.projectType} />
              <Badge variant="purple">{r.metadata.tokenName}</Badge>
            </div>
            <p className="text-sm text-text-secondary line-clamp-3">
              {r.metadata.description}
            </p>
          </div>
          )
        })}
      </div>

      {/* Radar */}
      <div className="mb-8">
        <ProtocolRadarChart data={radarData} metrics={metrics} />
      </div>

      {/* Key Metrics Comparison Grid */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-text-primary p-5 border-b border-border">
          Key Metrics
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-muted">
              <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Metric
              </th>
              {selectedReviews.map((r, idx) => {
                const m = metrics[idx]
                return (
                <th
                  key={r.project}
                  className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: m?.color }}
                >
                  {r.metadata.protocolName}
                </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Capital at Risk"
              values={metrics.map((m) => formatUsdValue(m.totalCapitalAtRisk))}
              highlight={highlightMax(metrics.map((m) => m.totalCapitalAtRisk))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Token Value at Risk"
              values={metrics.map((m) => formatUsdValue(m.totalTokenValueAtRisk))}
              highlight={highlightMax(metrics.map((m) => m.totalTokenValueAtRisk))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Total Admins"
              values={metrics.map((m) => String(m.adminCount))}
              highlight={highlightMax(metrics.map((m) => m.adminCount))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="EOA Admins"
              values={metrics.map((m) => String(m.eoaAdminCount))}
              highlight={highlightMax(metrics.map((m) => m.eoaAdminCount))}
              colors={metrics.map((m) => m.color)}
              highlightClass="text-status-red font-bold"
            />
            <MetricRow
              label="Multisig Admins"
              values={metrics.map((m) => String(m.multisigAdminCount))}
              highlight={highlightMax(metrics.map((m) => m.multisigAdminCount))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Dependencies"
              values={metrics.map((m) => String(m.dependencyCount))}
              highlight={highlightMax(metrics.map((m) => m.dependencyCount))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Permissioned Functions"
              values={metrics.map((m) => String(m.permissionedFunctionCount))}
              highlight={highlightMax(metrics.map((m) => m.permissionedFunctionCount))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Contracts"
              values={metrics.map((m) => String(m.contractCount))}
              highlight={highlightMax(metrics.map((m) => m.contractCount))}
              colors={metrics.map((m) => m.color)}
            />
            <MetricRow
              label="Capital per Admin"
              values={metrics.map((m) => formatUsdValue(m.capitalPerAdmin))}
              highlight={highlightMax(metrics.map((m) => m.capitalPerAdmin))}
              colors={metrics.map((m) => m.color)}
            />
          </tbody>
        </table>
      </div>

      {/* Admin Comparison */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-text-primary p-5 border-b border-border">
          Admin Comparison
        </h3>
        <div className={`grid gap-0 divide-x divide-border`} style={{ gridTemplateColumns: `repeat(${selectedReviews.length}, 1fr)` }}>
          {selectedReviews.map((r, idx) => (
            <div key={r.project} className="p-5">
              <h4
                className="font-medium text-sm mb-3"
                style={{ color: metrics[idx]?.color }}
              >
                {r.metadata.protocolName} ({r.admins.length} admins)
              </h4>
              <div className="space-y-3">
                {r.admins.map((admin) => (
                  <AdminCompareCard key={admin.address} admin={admin} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies Comparison */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-text-primary p-5 border-b border-border">
          Dependencies Comparison
        </h3>
        <div className={`grid gap-0 divide-x divide-border`} style={{ gridTemplateColumns: `repeat(${selectedReviews.length}, 1fr)` }}>
          {selectedReviews.map((r, idx) => (
            <div key={r.project} className="p-5">
              <h4
                className="font-medium text-sm mb-3"
                style={{ color: metrics[idx]?.color }}
              >
                {r.metadata.protocolName} ({r.dependencies.length} deps)
              </h4>
              <div className="space-y-2">
                {r.dependencies.map((dep) => (
                  <DependencyCompareCard key={dep.address} dep={dep} />
                ))}
                {r.dependencies.length === 0 && (
                  <p className="text-sm text-text-muted">No dependencies</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fund Holders Comparison */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold text-text-primary p-5 border-b border-border">
          Fund Holders Comparison
        </h3>
        <div className={`grid gap-0 divide-x divide-border`} style={{ gridTemplateColumns: `repeat(${selectedReviews.length}, 1fr)` }}>
          {selectedReviews.map((r, idx) => {
            const fundsWithValue = r.funds.filter(
              (f) =>
                (f.balances?.totalUsdValue ?? 0) > 0 ||
                (f.positions?.totalUsdValue ?? 0) > 0 ||
                (f.tokenInfo?.tokenValue ?? 0) > 0,
            )
            return (
              <div key={r.project} className="p-5">
                <h4
                  className="font-medium text-sm mb-3"
                  style={{ color: metrics[idx]?.color }}
                >
                  {r.metadata.protocolName} ({fundsWithValue.length} with funds)
                </h4>
                <div className="space-y-2">
                  {fundsWithValue.map((f) => (
                    <div
                      key={f.address}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {f.name}
                      </p>
                      {f.balances && f.balances.totalUsdValue > 0 && (
                        <p className="text-xs text-capital">
                          Balances: {formatUsdValue(f.balances.totalUsdValue)}
                        </p>
                      )}
                      {f.positions && f.positions.totalUsdValue > 0 && (
                        <p className="text-xs text-capital">
                          Positions: {formatUsdValue(f.positions.totalUsdValue)}
                        </p>
                      )}
                      {f.tokenInfo && f.tokenInfo.tokenValue > 0 && (
                        <p className="text-xs text-token">
                          Token: {formatUsdValue(f.tokenInfo.tokenValue)}
                        </p>
                      )}
                    </div>
                  ))}
                  {fundsWithValue.length === 0 && (
                    <p className="text-sm text-text-muted">No fund data</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricRow({
  label,
  values,
  highlight,
  colors,
  highlightClass,
}: {
  label: string
  values: string[]
  highlight: number
  colors: string[]
  highlightClass?: string
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-muted/50 transition-colors">
      <td className="px-5 py-3 font-medium text-text-primary">{label}</td>
      {values.map((v, idx) => (
        <td
          key={idx}
          className={`px-5 py-3 text-right tabular-nums ${
            idx === highlight
              ? highlightClass ?? 'font-bold text-text-primary'
              : 'text-text-secondary'
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  )
}

function highlightMax(values: number[]): number {
  let maxIdx = 0
  for (let i = 1; i < values.length; i++) {
    if ((values[i] ?? 0) > (values[maxIdx] ?? 0)) maxIdx = i
  }
  return maxIdx
}

function AdminCompareCard({ admin }: { admin: CompiledAdmin }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${adminTypeBgClass(admin.adminType)}`}>
          {admin.adminType}
        </span>
        {admin.isGovernance && (
          <Badge variant="governance">Gov</Badge>
        )}
      </div>
      <p className="text-sm font-medium text-text-primary truncate" title={admin.name}>
        {admin.name}
      </p>
      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
        <span>{admin.functions.length} fn{admin.functions.length !== 1 ? 's' : ''}</span>
        {admin.totalDirectCapital > 0 && (
          <span className="text-capital">
            {formatUsdValue(admin.totalDirectCapital)}
          </span>
        )}
      </div>
    </div>
  )
}

function DependencyCompareCard({ dep }: { dep: CompiledDependency }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-text-primary truncate" title={dep.name}>
          {dep.name}
        </p>
        {dep.entity && (
          <Badge variant="purple">{dep.entity}</Badge>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        Used by {dep.functions.length} function{dep.functions.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
