import { useState } from 'react'
import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import { clsx } from 'clsx'
import type { CompiledReview, CompiledContract, CompiledFunction } from '../../../types'

interface NarrativeAnnexeProps {
  review: CompiledReview
}

export function NarrativeAnnexe({ review }: NarrativeAnnexeProps) {
  const { contracts, functions, admins, dependencies } = review

  // Group functions by contract address
  const functionsByContract = new Map<string, CompiledFunction[]>()
  for (const fn of functions) {
    const list = functionsByContract.get(fn.contractAddress) ?? []
    list.push(fn)
    functionsByContract.set(fn.contractAddress, list)
  }

  // Build admin lookup
  const adminsByFunction = new Map<string, string[]>()
  for (const admin of admins) {
    for (const fn of admin.functions) {
      const key = `${fn.contractAddress}:${fn.functionName}`
      const list = adminsByFunction.get(key) ?? []
      list.push(admin.name)
      adminsByFunction.set(key, list)
    }
  }

  // Build dependency lookup
  const depsByFunction = new Map<string, string[]>()
  for (const dep of dependencies) {
    for (const fn of dep.functions) {
      const key = `${fn.contractAddress}:${fn.functionName}`
      const list = depsByFunction.get(key) ?? []
      list.push(dep.name)
      depsByFunction.set(key, list)
    }
  }

  const contractsWithFunctions = contracts.filter((c) =>
    functionsByContract.has(c.address),
  )

  if (contractsWithFunctions.length === 0) {
    return (
      <p className="text-text-secondary">
        No contracts with permissioned functions found.
      </p>
    )
  }

  return (
    <div>
      <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
        Complete reference of all {contractsWithFunctions.length} contracts with
        permissioned functions, their admins, and dependencies. This is the raw
        data behind the narrative sections above.
      </p>

      <div className="space-y-3">
        {contractsWithFunctions.map((contract) => (
          <AnnexeContractCard
            key={contract.address}
            contract={contract}
            functions={functionsByContract.get(contract.address) ?? []}
            adminsByFunction={adminsByFunction}
            depsByFunction={depsByFunction}
          />
        ))}
      </div>
    </div>
  )
}

function AnnexeContractCard({
  contract,
  functions: fns,
  adminsByFunction,
  depsByFunction,
}: {
  contract: CompiledContract
  functions: CompiledFunction[]
  adminsByFunction: Map<string, string[]>
  depsByFunction: Map<string, string[]>
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-muted/30 transition-colors"
      >
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
            {fns.length} function{fns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className={clsx(
            'h-4 w-4 text-text-muted transition-transform shrink-0 ml-2',
            expanded && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
          {fns.map((fn) => {
            const key = `${fn.contractAddress}:${fn.functionName}`
            const fnAdmins = adminsByFunction.get(key) ?? []
            const fnDeps = depsByFunction.get(key) ?? []

            return (
              <div
                key={fn.functionName}
                className="rounded-lg border border-border/50 bg-bg-muted/30 px-3 py-2"
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
      )}
    </div>
  )
}
