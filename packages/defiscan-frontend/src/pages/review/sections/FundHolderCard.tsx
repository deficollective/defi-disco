import { AddressDisplay } from '../../../components/AddressDisplay'
import { UsdValue } from '../../../components/UsdValue'
import { Badge } from '../../../components/Badge'
import type { CompiledFundHolder } from '../../../types'

interface FundHolderCardProps {
  fund: CompiledFundHolder
}

export function FundHolderCard({ fund }: FundHolderCardProps) {
  const totalValue =
    (fund.balances?.totalUsdValue ?? 0) + (fund.positions?.totalUsdValue ?? 0)

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary">{fund.name}</h3>
          <div className="mt-1">
            <AddressDisplay address={fund.address} />
          </div>
          {fund.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {fund.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0 space-y-1">
          {totalValue > 0 && (
            <div>
              <UsdValue value={totalValue} variant="capital" className="text-lg font-semibold" />
            </div>
          )}
          {fund.balances && fund.positions && (
            <div className="text-xs text-text-muted">
              {fund.balances.totalUsdValue > 0 && (
                <span>
                  Balances: <UsdValue value={fund.balances.totalUsdValue} className="text-xs" />
                </span>
              )}
              {fund.balances.totalUsdValue > 0 && fund.positions.totalUsdValue > 0 && ' · '}
              {fund.positions.totalUsdValue > 0 && (
                <span>
                  Positions: <UsdValue value={fund.positions.totalUsdValue} className="text-xs" />
                </span>
              )}
            </div>
          )}
          {fund.tokenInfo && (
            <div className="mt-1">
              <Badge variant="purple">{fund.tokenInfo.symbol}</Badge>
              <span className="ml-2 text-xs text-token">
                MCap: <UsdValue value={fund.tokenInfo.tokenValue} variant="token" className="text-xs" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
