import { AnnexeContractRow } from './AnnexeContractRow'
import type { CompiledReview } from '../../../types'

interface AnnexeSectionProps {
  review: CompiledReview
}

export function AnnexeSection({ review }: AnnexeSectionProps) {
  const { contracts, functions, admins, dependencies } = review

  // Group functions by contract address
  const functionsByContract = new Map<
    string,
    typeof functions
  >()
  for (const fn of functions) {
    const list = functionsByContract.get(fn.contractAddress) ?? []
    list.push(fn)
    functionsByContract.set(fn.contractAddress, list)
  }

  // Build admin lookup: contractAddress+functionName → admin names
  const adminsByFunction = new Map<string, string[]>()
  for (const admin of admins) {
    for (const fn of admin.functions) {
      const key = `${fn.contractAddress}:${fn.functionName}`
      const list = adminsByFunction.get(key) ?? []
      list.push(admin.name)
      adminsByFunction.set(key, list)
    }
  }

  // Build dependency lookup: contractAddress+functionName → dep names
  const depsByFunction = new Map<string, string[]>()
  for (const dep of dependencies) {
    for (const fn of dep.functions) {
      const key = `${fn.contractAddress}:${fn.functionName}`
      const list = depsByFunction.get(key) ?? []
      list.push(dep.name)
      depsByFunction.set(key, list)
    }
  }

  // Only show contracts that have permissioned functions
  const contractsWithFunctions = contracts.filter(
    (c) => functionsByContract.has(c.address),
  )

  if (contractsWithFunctions.length === 0) {
    return <p className="text-text-muted">No contracts with permissioned functions.</p>
  }

  return (
    <div>
      <p className="text-text-secondary mb-4">
        All {contractsWithFunctions.length} contracts with permissioned
        functions
      </p>
      <div className="space-y-3">
        {contractsWithFunctions.map((contract) => (
          <AnnexeContractRow
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
