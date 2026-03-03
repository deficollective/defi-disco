import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReview } from '../../../data/hooks'
import { Badge } from '../../../components/Badge'
import { ProtocolTypeBadge } from '../../../components/ProtocolTypeBadge'
import { UsdValue } from '../../../components/UsdValue'
import { formatUsdValue } from '../../../utils/format'
import { KeyFindings } from './KeyFindings'
import { AdminsTable } from './AdminsTable'
import { DependenciesTable } from './DependenciesTable'
import { FundsBreakdown } from './FundsBreakdown'
import { ContractsTable } from './ContractsTable'
import { CodeAndAuditsSection } from '../sections/CodeAndAuditsSection'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'admins', label: 'Admins' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'funds', label: 'Funds' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'code', label: 'Code & Audits' },
] as const

type TabId = (typeof TABS)[number]['id']

export function DataFirstReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: review, isLoading, error } = useReview(slug ?? '')
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-muted rounded w-48" />
          <div className="h-4 bg-bg-muted rounded w-96" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-status-red">Failed to load review.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-purple-600 hover:text-purple-800"
        >
          Back to Reviews
        </Link>
      </div>
    )
  }

  const { metadata, totals } = review

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-purple-600 transition-colors mb-4"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Reviews
      </Link>

      {/* Compact header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">
              {metadata.protocolName}
            </h1>
            <ProtocolTypeBadge type={metadata.projectType} />
            <Badge>{metadata.chain}</Badge>
            {metadata.tokenName && (
              <Badge variant="purple">{metadata.tokenName}</Badge>
            )}
          </div>
          {metadata.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-4xl">
              {metadata.description}
            </p>
          )}
        </div>
        {/* Quick stats on the right */}
        <div className="flex gap-4 text-right shrink-0">
          <div>
            <p className="text-xs text-text-muted">Capital at Risk</p>
            <UsdValue
              value={totals.totalCapitalAtRisk}
              variant="capital"
              className="text-lg font-bold"
            />
          </div>
          {totals.totalTokenValueAtRisk > 0 && (
            <div>
              <p className="text-xs text-text-muted">Token Value</p>
              <UsdValue
                value={totals.totalTokenValueAtRisk}
                variant="token"
                className="text-lg font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="mt-6 flex gap-0 border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const count = getTabCount(tab.id, review)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'text-purple-600 border-purple-600'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border'
              }`}
            >
              {tab.label}
              {count !== null && (
                <span className={`ml-1.5 text-xs ${isActive ? 'text-purple-400' : 'text-text-muted'}`}>
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'overview' && <KeyFindings review={review} />}
        {activeTab === 'admins' && <AdminsTable review={review} />}
        {activeTab === 'dependencies' && <DependenciesTable review={review} />}
        {activeTab === 'funds' && <FundsBreakdown review={review} />}
        {activeTab === 'contracts' && <ContractsTable review={review} />}
        {activeTab === 'code' && <CodeAndAuditsSection review={review} />}
      </div>
    </div>
  )
}

function getTabCount(tabId: TabId, review: { totals: { adminCount: number; dependencyCount: number; contractCount: number }; funds: unknown[] }): number | null {
  switch (tabId) {
    case 'admins':
      return review.totals.adminCount
    case 'dependencies':
      return review.totals.dependencyCount
    case 'funds':
      return review.funds.length
    case 'contracts':
      return review.totals.contractCount
    default:
      return null
  }
}
