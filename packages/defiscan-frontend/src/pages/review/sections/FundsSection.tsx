import { FundHolderCard } from './FundHolderCard'
import { FundsChart } from './FundsChart'
import type { CompiledReview } from '../../../types'

interface FundsSectionProps {
  review: CompiledReview
}

export function FundsSection({ review }: FundsSectionProps) {
  const { funds } = review

  if (funds.length === 0) {
    return <p className="text-text-muted">No fund data available.</p>
  }

  const chartData = funds
    .map((f) => ({
      name: f.name,
      value:
        (f.balances?.totalUsdValue ?? 0) + (f.positions?.totalUsdValue ?? 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div>
      {chartData.length > 0 && (
        <div className="mb-8">
          <FundsChart data={chartData} />
        </div>
      )}
      <div className="space-y-4">
        {funds.map((fund) => (
          <FundHolderCard key={fund.address} fund={fund} />
        ))}
      </div>
    </div>
  )
}
