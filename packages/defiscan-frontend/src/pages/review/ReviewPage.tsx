import { lazy, Suspense } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useReview } from '../../data/hooks'
import { ViewModeToggle, type ViewMode } from '../../components/ViewModeToggle'
import { TYPE_LABELS } from '../../components/ProtocolTypeBadge'

const ReportView = lazy(() => import('./views/report/ReportView').then((m) => ({ default: m.ReportView })))
const ExplorerView = lazy(() => import('./views/explorer/ExplorerView').then((m) => ({ default: m.ExplorerView })))

function isValidView(v: string | null): v is ViewMode {
  return v === 'report' || v === 'explorer'
}

export function ReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: review, isLoading, error } = useReview(slug ?? '')
  const [searchParams, setSearchParams] = useSearchParams()

  const viewParam = searchParams.get('view')
  const view: ViewMode = isValidView(viewParam) ? viewParam : 'report'

  function handleViewChange(mode: ViewMode) {
    setSearchParams({ view: mode }, { replace: true })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-24 rounded bg-bg-muted" />
          <div className="h-12 w-72 rounded-lg bg-bg-muted" />
          <div className="h-4 w-96 rounded bg-bg-muted" />
          <div className="h-48 rounded-xl bg-bg-muted" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-xl border border-status-red/20 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-900">Failed to load review</h2>
          <p className="mt-2 text-sm text-red-700">
            The review data for this protocol could not be loaded.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-brand-600 hover:text-brand-700 font-medium transition-colors duration-150"
          >
            Back to all reviews
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      {/* Back nav + Protocol header + View toggle */}
      <div className="mb-8 print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors duration-150 mb-6 print:hidden"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All reviews
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-text-primary leading-tight">
              {review.metadata.protocolName}
            </h1>
            <p className="mt-2 text-sm text-text-secondary flex items-center gap-2">
              <span>{review.metadata.chain}</span>
              <span className="text-border">/</span>
              <span>{TYPE_LABELS[review.metadata.projectType] ?? review.metadata.projectType}</span>
              {review.metadata.tokenName && (
                <>
                  <span className="text-border">/</span>
                  <span>{review.metadata.tokenName}</span>
                </>
              )}
            </p>
          </div>
          <div className="print:hidden">
            <ViewModeToggle current={view} onChange={handleViewChange} />
          </div>
        </div>
      </div>

      {/* View content */}
      <Suspense
        fallback={
          <div className="py-12 text-center text-text-muted">Loading view...</div>
        }
      >
        {view === 'report' && <ReportView review={review} />}
        {view === 'explorer' && <ExplorerView review={review} />}
      </Suspense>

    </div>
  )
}
