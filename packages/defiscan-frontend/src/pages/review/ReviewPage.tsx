import { useParams, Link } from 'react-router-dom'
import { useReview } from '../../data/hooks'
import { NarrativeHero } from './sections/NarrativeHero'
import { getSectionsForType } from './SectionRegistry'

export function ReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: review, isLoading, error } = useReview(slug ?? '')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-bg-muted rounded-lg w-64" />
          <div className="h-4 bg-bg-muted rounded w-full max-w-xl" />
          <div className="h-4 bg-bg-muted rounded w-full max-w-lg" />
          <div className="h-32 bg-bg-muted rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
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
    <article className="mx-auto max-w-4xl px-4 py-8">
      {/* Back navigation */}
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

      {/* Executive summary / hero */}
      <NarrativeHero review={review} />

      {/* Story navigation -- sticky on scroll */}
      <nav className="mt-10 sticky top-0 z-40 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {section.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Story sections -- generous spacing for readability */}
      <div className="mt-10 space-y-16">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              {section.title}
            </h2>
            <section.component review={review} />
          </section>
        ))}
      </div>

      {/* Review metadata footer */}
      <div className="mt-16 pt-8 border-t border-border">
        <p className="text-sm text-text-muted">
          Review compiled on{' '}
          {new Date(review.compiledAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          . Data is automatically refreshed daily. This review is for
          informational purposes only and does not constitute financial advice.
        </p>
      </div>
    </article>
  )
}
