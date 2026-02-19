import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFunctions, getProject } from '../api/api'
import type { Impact } from '../api/types'
import { useContractTags } from '../apps/discovery/defidisco/hooks/useContractTags'
import { usePanelStore } from '../apps/discovery/store/panel-store'
import { getImpactColor } from './scoringShared'

interface FunctionWithDependency {
  contractAddress: string
  contractName: string
  functionName: string
  impact: Impact
}

interface DependencyData {
  contractAddress: string
  contractName: string
  functions: FunctionWithDependency[]
}

/**
 * External contract section - displays functions that depend on this contract
 */
function DependencySection({
  dependency,
}: {
  dependency: DependencyData
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const selectGlobal = usePanelStore((state) => state.select)

  return (
    <div className="mb-2 ml-4">
      <div className="flex w-full items-center gap-2 rounded p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-coffee-800/30"
        >
          <span className="text-coffee-400 text-xs">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        <button
          onClick={() => selectGlobal(dependency.contractAddress)}
          className="cursor-pointer font-medium text-coffee-200 text-sm transition-colors hover:text-blue-400"
        >
          {dependency.contractName}
        </button>
        <span className="ml-2 text-coffee-400 text-xs">
          ({dependency.functions.length} function
          {dependency.functions.length !== 1 ? 's' : ''})
        </span>
      </div>

      {isExpanded && (
        <ul className="mt-2 ml-8 space-y-1.5">
          {dependency.functions.map((func, idx) => {
            const impactColor = getImpactColor(func.impact)

            return (
              <li
                key={idx}
                className="flex items-center gap-2 text-coffee-300 text-xs"
              >
                <button
                  onClick={() => selectGlobal(func.contractAddress)}
                  className="cursor-pointer font-medium text-coffee-200 transition-colors hover:text-blue-400"
                >
                  {func.contractName}
                </button>
                <span className="text-coffee-500">.</span>
                <span className="text-blue-400">{func.functionName}()</span>
                <span className="ml-2 text-coffee-500">(</span>
                <span style={{ color: impactColor }}>{func.impact}</span>
                <span className="text-coffee-500">)</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Dependencies Breakdown Component
 * Displays breakdown of functions grouped by external contract dependencies
 */
export function DependencyBreakdown() {
  const { project } = useParams()

  if (!project) {
    throw new Error('Cannot use component outside of project page!')
  }

  // Fetch data
  const { data: projectData } = useQuery({
    queryKey: ['projects', project],
    queryFn: () => getProject(project),
  })

  const { data: functions } = useQuery({
    queryKey: ['functions', project],
    queryFn: () => (project ? getFunctions(project) : null),
    enabled: !!project,
  })

  const { data: contractTags } = useContractTags(project)

  if (!projectData || !functions || !contractTags) {
    return (
      <div className="border-b border-b-coffee-600 pb-2">
        <h2 className="p-2 font-bold text-orange-400 text-xl">Dependencies</h2>
        <div className="mb-1 flex flex-col gap-2 border-transparent border-l-4 p-2 pl-1">
          <p className="ml-4 text-coffee-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Build contract name lookup map
  const contractNameMap = new Map<string, string>()
  projectData.entries?.forEach((entry: any) => {
    ;[
      ...(entry.initialContracts || []),
      ...(entry.discoveredContracts || []),
    ].forEach((contract: any) => {
      contractNameMap.set(contract.address, contract.name || 'Unknown Contract')
    })
  })

  // Process dependencies data
  const dependenciesMap = new Map<string, DependencyData>()

  if (functions.contracts) {
    Object.entries(functions.contracts).forEach(
      ([contractAddress, contractData]: [string, any]) => {
        contractData.functions.forEach((func: any) => {
          // Only process functions that have dependencies and impact
          if (
            func.dependencies &&
            func.dependencies.length > 0 &&
            func.impact
          ) {
            func.dependencies.forEach((dep: { contractAddress: string }) => {
              const depAddress = dep.contractAddress

              // Get tag from contract tags
              const normalizedAddress = depAddress
                .replace('eth:', '')
                .toLowerCase()
              const tag = contractTags.tags.find(
                (tag) =>
                  tag.contractAddress.toLowerCase() === normalizedAddress,
              )

              // Skip if not external
              if (!tag?.isExternal) {
                return
              }

              // Get or create dependency entry
              if (!dependenciesMap.has(depAddress)) {
                dependenciesMap.set(depAddress, {
                  contractAddress: depAddress,
                  contractName:
                    contractNameMap.get(depAddress) || 'Unknown Contract',
                  functions: [],
                })
              }

              // Add function to dependency
              const depData = dependenciesMap.get(depAddress)!
              depData.functions.push({
                contractAddress,
                contractName:
                  contractNameMap.get(contractAddress) || 'Unknown Contract',
                functionName: func.functionName,
                impact: func.impact as Impact,
              })
            })
          }
        })
      },
    )
  }

  const dependencies = Array.from(dependenciesMap.values())

  if (dependencies.length === 0) {
    return (
      <div className="border-b border-b-coffee-600 pb-2">
        <h2 className="p-2 font-bold text-orange-400 text-xl">Dependencies</h2>
        <div className="mb-1 flex flex-col gap-2 border-transparent border-l-4 p-2 pl-1">
          <p className="ml-4 text-coffee-400 text-sm">
            No external dependencies with scored functions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-b-coffee-600 pb-2">
      <h2 className="p-2 font-bold text-orange-400 text-xl">Dependencies</h2>
      <div className="mb-1 flex flex-col gap-2 border-transparent border-l-4 p-2 pl-1">
        <div className="mb-3 ml-4 flex items-center gap-2">
          <span className="text-coffee-400 text-xs">
            ({dependencies.length} external contract
            {dependencies.length !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Dependencies list */}
        <div className="ml-2">
          {dependencies.map((dep) => (
            <DependencySection
              key={dep.contractAddress}
              dependency={dep}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
