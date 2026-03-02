import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import { Expandable } from '../../../components/Expandable'
import type { CompiledContract, CompiledFunction } from '../../../types'

interface AnnexeContractRowProps {
  contract: CompiledContract
  functions: CompiledFunction[]
  adminsByFunction: Map<string, string[]>
  depsByFunction: Map<string, string[]>
}

export function AnnexeContractRow({
  contract,
  functions,
  adminsByFunction,
  depsByFunction,
}: AnnexeContractRowProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <Expandable
        trigger={
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="font-semibold text-text-primary">
              {contract.name}
            </span>
            <AddressDisplay address={contract.address} />
            {contract.proxyType && <Badge>{contract.proxyType}</Badge>}
            {contract.isExternal && <Badge variant="purple">External</Badge>}
            {contract.isGovernance && (
              <Badge variant="governance">Governance</Badge>
            )}
            <span className="text-sm text-text-muted">
              {functions.length} function{functions.length !== 1 ? 's' : ''}
            </span>
          </div>
        }
      >
        <div className="mt-3 space-y-2">
          {functions.map((fn) => {
            const key = `${fn.contractAddress}:${fn.functionName}`
            const fnAdmins = adminsByFunction.get(key) ?? []
            const fnDeps = depsByFunction.get(key) ?? []

            return (
              <div
                key={fn.functionName}
                className="rounded-lg border border-border/50 bg-bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary font-mono">
                    {fn.functionName}()
                  </span>
                  <Badge variant="admin-type" adminType="EOA">
                    {fn.impact}
                  </Badge>
                </div>
                {(fnAdmins.length > 0 || fnDeps.length > 0) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    {fnAdmins.length > 0 && (
                      <span>
                        Admins: {fnAdmins.join(', ')}
                      </span>
                    )}
                    {fnDeps.length > 0 && (
                      <span>
                        Deps: {fnDeps.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Expandable>
    </div>
  )
}
