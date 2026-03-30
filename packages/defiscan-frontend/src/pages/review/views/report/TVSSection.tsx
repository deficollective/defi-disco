import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { CompiledReview, CompiledFundHolder } from '../../../../types'
import { formatUsdValue } from '../../../../utils/format'
import { ShowMoreButton } from './_shared'

interface TVSSectionProps {
  review: CompiledReview
  onShowMore: () => void
}

const BLUE_SHADES = [
  '#2563eb',
  '#60a5fa',
  '#93c5fd',
  '#bfdbfe',
  '#dbeafe',
  '#1d4ed8',
  '#3b82f6',
]

function getFundName(fund: CompiledFundHolder): string {
  return fund.name || fund.address
}

function getFundValue(fund: CompiledFundHolder): number {
  if (fund.aggregate?.totalUsdValue) return fund.aggregate.totalUsdValue
  const balanceTotal = fund.balances?.totalUsdValue ?? 0
  const positionTotal = fund.positions?.totalUsdValue ?? 0
  return balanceTotal + positionTotal
}

export function TVSSection({ review, onShowMore }: TVSSectionProps) {
  const { totals, funds } = review
  const totalTvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  // Build pie data from fund holders
  const fundValues = funds
    .map((f) => ({ fund: f, value: getFundValue(f) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  const pieTotal = fundValues.reduce((s, x) => s + x.value, 0)

  const pieData = fundValues.map((x, i) => ({
    name: getFundName(x.fund),
    value: x.value,
    color: BLUE_SHADES[i % BLUE_SHADES.length] ?? '#2563eb',
  }))

  return (
    <div className="flex gap-[30px] items-stretch">
      {/* Left stats card */}
      <div className="w-[312px] shrink-0 bg-bg-card border border-border rounded-lg p-[33px] flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Total TVS
          </p>
          <p className="font-mono font-bold text-[36px] leading-[40px] text-text-primary">
            {formatUsdValue(totalTvs)}
          </p>
        </div>
        <div className="border-t border-border pt-[33px] flex flex-col gap-1">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Contracts Holding TVS
          </p>
          <p className="font-mono font-bold text-[36px] leading-[40px] text-text-primary">
            {funds.length}
          </p>
        </div>
      </div>

      {/* Right chart + legend */}
      <div className="flex-1 min-w-0 bg-white border border-border rounded-lg p-[33px] flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[12px] uppercase text-text-muted tracking-[1.2px]">
            Total Value Secured (TVS) Distribution
          </p>
          <ShowMoreButton onClick={onShowMore} />
        </div>

        {pieData.length > 0 ? (
          <div className="flex items-center gap-8">
            {/* Donut */}
            <div className="w-[256px] h-[256px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={112}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#f8fafc"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatUsdValue(val)}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {pieData.map((entry, i) => {
                const pct = pieTotal > 0 ? ((entry.value / pieTotal) * 100).toFixed(1) : '0'
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between pb-3 ${i < pieData.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ background: entry.color }}
                      />
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-[14px] text-text-primary truncate">
                          {entry.name}
                        </p>
                        <p className="font-mono text-[8px] font-bold uppercase text-text-muted tracking-[0.2px]">
                          {formatUsdValue(entry.value)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[14px] text-accent shrink-0 ml-2">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-text-muted text-sm">No fund distribution data available.</p>
        )}
      </div>
    </div>
  )
}
