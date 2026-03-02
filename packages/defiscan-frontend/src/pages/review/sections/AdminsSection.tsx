import { UsdValue } from '../../../components/UsdValue'
import { formatUsdValue } from '../../../utils/format'
import { AdminCard } from './AdminCard'
import type { CompiledReview } from '../../../types'

interface AdminsSectionProps {
  review: CompiledReview
}

export function AdminsSection({ review }: AdminsSectionProps) {
  const { admins, totals } = review

  if (admins.length === 0) {
    return <p className="text-text-muted">No admins found.</p>
  }

  return (
    <div>
      <p className="text-text-secondary mb-6">
        {admins.length} admin{admins.length !== 1 ? 's' : ''} controlling{' '}
        <UsdValue value={totals.totalCapitalAtRisk} variant="capital" /> in
        capital
        {totals.totalTokenValueAtRisk > 0 && (
          <>
            {' '}
            and{' '}
            <UsdValue
              value={totals.totalTokenValueAtRisk}
              variant="token"
            />{' '}
            in protocol tokens
          </>
        )}
      </p>
      <div className="space-y-4">
        {admins.map((admin) => (
          <AdminCard key={admin.address} admin={admin} />
        ))}
      </div>
    </div>
  )
}
