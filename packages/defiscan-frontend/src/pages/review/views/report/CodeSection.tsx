import type { CompiledReview } from '../../../../types'

const LENS_BASE_URL =
  'https://defiscan-v2-backend-prod-pzz23.ondigitalocean.app/ui/p'

interface CodeSectionProps {
  review: CompiledReview
}

export function CodeSection({ review }: CodeSectionProps) {
  const lensUrl = `${LENS_BASE_URL}/${review.metadata.protocolSlug}`

  return (
    <div>
      <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
        See the protocol on{' '}
        <a
          href={lensUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-purple-600 hover:text-purple-700 underline underline-offset-2 transition-colors"
        >
          Lens
        </a>
        .
      </p>
    </div>
  )
}
