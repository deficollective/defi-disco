import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import { UsdValue } from '../../../components/UsdValue'
import { Expandable } from '../../../components/Expandable'
import type { CompiledAdmin, CompiledAdminFunction } from '../../../types'

interface AdminCardProps {
  admin: CompiledAdmin
}

export function AdminCard({ admin }: AdminCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="admin-type" adminType={admin.adminType}>
              {admin.adminType}
            </Badge>
            {admin.isGovernance && <Badge variant="governance">Governance</Badge>}
            <h3 className="font-semibold text-text-primary">{admin.name}</h3>
          </div>
          <div className="mt-1">
            <AddressDisplay address={admin.address} />
          </div>
          {admin.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {admin.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          {admin.totalDirectCapital > 0 && (
            <div className="text-sm">
              <span className="text-text-muted">Direct: </span>
              <UsdValue value={admin.totalDirectCapital} variant="capital" />
            </div>
          )}
          {admin.totalReachableCapital > 0 && (
            <div className="text-sm">
              <span className="text-text-muted">Reachable: </span>
              <UsdValue value={admin.totalReachableCapital} variant="capital" />
            </div>
          )}
          {admin.totalReachableTokenValue > 0 && (
            <div className="text-sm">
              <span className="text-text-muted">Token: </span>
              <UsdValue value={admin.totalReachableTokenValue} variant="token" />
            </div>
          )}
        </div>
      </div>

      {admin.functions.length > 0 && (
        <div className="mt-4">
          <Expandable
            trigger={
              <span className="text-sm font-medium text-text-secondary">
                {admin.functions.length} function
                {admin.functions.length !== 1 ? 's' : ''}
              </span>
            }
          >
            <div className="mt-2 space-y-2">
              {admin.functions.map((fn) => (
                <FunctionRow
                  key={`${fn.contractAddress}-${fn.functionName}`}
                  fn={fn}
                />
              ))}
            </div>
          </Expandable>
        </div>
      )}
    </div>
  )
}

function FunctionRow({ fn }: { fn: CompiledAdminFunction }) {
  return (
    <div className="rounded-lg border border-border/50 bg-bg-muted/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-text-muted">{fn.contractName}</span>
          <span className="text-text-primary font-medium">.{fn.functionName}()</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {fn.directFundsUsd > 0 && (
            <UsdValue value={fn.directFundsUsd} variant="capital" className="text-xs" />
          )}
          <Badge variant="admin-type" adminType="EOA">
            {fn.impact}
          </Badge>
        </div>
      </div>

      {fn.reachableContracts.length > 0 && (
        <div className="mt-2">
          <Expandable
            trigger={
              <span className="text-xs text-text-muted">
                {fn.reachableContracts.length} reachable contract
                {fn.reachableContracts.length !== 1 ? 's' : ''}
              </span>
            }
          >
            <ul className="mt-1 space-y-1">
              {fn.reachableContracts.map((rc) => (
                <li
                  key={rc.address}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className={
                      rc.fundsAtRisk
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    }
                  >
                    {rc.name}
                    {rc.viewOnlyPath && (
                      <span className="ml-1 text-text-muted">(view-only)</span>
                    )}
                  </span>
                  {rc.fundsUsd > 0 && (
                    <UsdValue
                      value={rc.fundsUsd}
                      variant="capital"
                      className="text-xs"
                    />
                  )}
                </li>
              ))}
            </ul>
          </Expandable>
        </div>
      )}
    </div>
  )
}
