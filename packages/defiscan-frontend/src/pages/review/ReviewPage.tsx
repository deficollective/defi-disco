import { useParams, Link } from 'react-router-dom'
import { useReview } from '../../data/hooks'
import { ReviewHeader } from './ReviewHeader'
import { getSectionsForType } from './SectionRegistry'

export function ReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: review, isLoading, error } = useReview(slug ?? '')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-text-muted">Loading review...</p>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
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

  const sections = getSectionsForType(review.metadata.projectType)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-purple-600 transition-colors mb-6"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Reviews
      </Link>

      <ReviewHeader review={review} />

      {/* Section Navigation */}
      <nav className="mt-8 flex gap-1 border-b border-border overflow-x-auto">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-purple-600 hover:border-b-2 hover:border-purple-600 transition-colors whitespace-nowrap"
          >
            {section.title}
          </a>
        ))}
      </nav>

      {/* Sections */}
      <div className="mt-8 space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-2xl font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              {section.title}
            </h2>
            <section.component review={review} />
          </section>
        ))}
      </div>
    </div>
  )
}
