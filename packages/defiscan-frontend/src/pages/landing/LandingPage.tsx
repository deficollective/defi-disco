import { useState, useMemo } from 'react'
import { useAllReviews, useIndex } from '../../data/hooks'
import { extractMetrics, buildRadarData, computeAverages } from '../../utils/comparison'
import { formatUsdValue } from '../../utils/format'
import { StatCard } from '../../components/StatCard'
import { ComparisonTable } from '../compare/ComparisonTable'
import { ProtocolRadarChart } from '../compare/ProtocolRadarChart'
import { CapitalScatterPlot } from '../compare/CapitalScatterPlot'
import { AdminTypeChart } from '../compare/AdminTypeChart'
import { RankingsPanel } from '../compare/RankingsPanel'
import { BenchmarkBars } from '../compare/BenchmarkBars'
import { SharedDependencyMap } from '../compare/SharedDependencyMap'

export function LandingPage() {
  const { data: index, isLoading: indexLoading } = useIndex()
  const { data: reviews, isLoading: reviewsLoading } = useAllReviews()
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'rankings'>('overview')

  const metrics = useMemo(() => {
    if (!reviews) return []
    return reviews.map((r, i) => extractMetrics(r, i))
  }, [reviews])

  const radarData = useMemo(() => buildRadarData(metrics), [metrics])
  const averages = useMemo(() => computeAverages(metrics), [metrics])

  const isLoading = indexLoading || reviewsLoading

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-muted rounded w-64" />
          <div className="h-4 bg-bg-muted rounded w-96" />
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!index || !reviews) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-status-red">Failed to load data.</p>
      </div>
    )
  }

  function toggleSelect(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const selectedMetrics = metrics.filter((m) => selectedSlugs.includes(m.slug))
  const chartMetrics = selectedSlugs.length >= 2 ? selectedMetrics : metrics

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-text-primary">
          DeFi Protocol Comparison
        </h1>
        <p className="mt-2 text-lg text-text-secondary max-w-3xl">
          Compare DeFi protocols side-by-side across capital, admin structure,
          dependencies, and permissioned functions. Select protocols to focus comparisons.
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Capital Reviewed"
          value={formatUsdValue(index.globalTotals.totalCapitalAtRisk)}
          sublabel={`across ${index.globalTotals.protocolsReviewed} protocols`}
        />
        <StatCard
          label="Protocols Reviewed"
          value={String(index.globalTotals.protocolsReviewed)}
        />
        <StatCard
          label="Avg. Admins per Protocol"
          value={averages ? averages.avgAdmins.toFixed(1) : '0'}
          sublabel={averages ? `avg capital/admin: ${formatUsdValue(averages.avgCapitalPerAdmin)}` : undefined}
        />
        <StatCard
          label="Dependencies Tracked"
          value={String(index.dependencies.length)}
          sublabel="cross-protocol external dependencies"
        />
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {(
          [
            { id: 'overview', label: 'Overview & Table' },
            { id: 'charts', label: 'Charts & Scatter Plots' },
            { id: 'rankings', label: 'Rankings & Dependencies' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeView === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-text-secondary hover:text-purple-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedSlugs.length > 0 && selectedSlugs.length < 2 && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200 text-sm text-purple-700">
          Select at least 2 protocols to compare, or deselect all to see global charts.
        </div>
      )}

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-8">
          {/* Radar chart + Admin type side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProtocolRadarChart data={radarData} metrics={chartMetrics} />
            <AdminTypeChart metrics={chartMetrics} />
          </div>

          {/* Comparison table */}
          <ComparisonTable
            metrics={metrics}
            onSelectForCompare={toggleSelect}
            selectedSlugs={selectedSlugs}
          />
        </div>
      )}

      {/* Charts Tab */}
      {activeView === 'charts' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CapitalScatterPlot
              metrics={chartMetrics}
              xKey="adminCount"
              xLabel="Admin Count"
            />
            <CapitalScatterPlot
              metrics={chartMetrics}
              xKey="dependencyCount"
              xLabel="Dependency Count"
            />
          </div>

          <BenchmarkBars metrics={chartMetrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProtocolRadarChart data={buildRadarData(chartMetrics)} metrics={chartMetrics} />
            <AdminTypeChart metrics={chartMetrics} />
          </div>
        </div>
      )}

      {/* Rankings Tab */}
      {activeView === 'rankings' && (
        <div className="space-y-8">
          <RankingsPanel metrics={metrics} />
          <SharedDependencyMap reviews={reviews} />
        </div>
      )}
    </div>
  )
}
