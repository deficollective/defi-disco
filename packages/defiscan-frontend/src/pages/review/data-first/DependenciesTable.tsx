import { useState, useMemo } from 'react'
import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import type { CompiledReview, CompiledDependency } from '../../../types'

interface DependenciesTableProps {
  review: CompiledReview
}

type SortField = 'name' | 'entity' | 'functions'
type SortDir = 'asc' | 'desc'

export function DependenciesTable({ review }: DependenciesTableProps) {
  const { dependencies } = review
  const [sortField, setSortField] = useState<SortField>('functions')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...dependencies]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'entity':
          cmp = (a.entity ?? '').localeCompare(b.entity ?? '')
          break
        case 'functions':
          cmp = a.functions.length - b.functions.length
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return copy
  }, [dependencies, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (dependencies.length === 0) {
    return <p className="text-text-muted">No external dependencies found.</p>
  }

  // Entity summary
  const entities = new Map<string, number>()
  for (const dep of dependencies) {
    if (dep.entity) {
      entities.set(dep.entity, (entities.get(dep.entity) ?? 0) + 1)
    }
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">{dependencies.length}</span> dependenc{dependencies.length !== 1 ? 'ies' : 'y'}
        </span>
        {Array.from(entities.entries()).map(([entity, count]) => (
          <span key={entity} className="inline-flex items-center gap-1.5">
            <Badge variant="purple">{entity}</Badge>
            <span className="text-text-muted">{count}</span>
          </span>
        ))}
      </div>

      {/* Dependency risk diagram */}
      <div className="rounded-lg border border-border bg-white p-4 mb-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Dependency Risk Concept
        </h3>
        <DependencyRiskDiagram entityCount={entities.size} depCount={dependencies.length} />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-muted">
              <SortHeader field="name" label="Dependency" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader field="entity" label="Entity" current={sortField} dir={sortDir} onClick={handleSort} />
              <th className="px-4 py-2 font-medium text-text-secondary text-left">Address</th>
              <SortHeader field="functions" label="Used By" current={sortField} dir={sortDir} onClick={handleSort} className="text-right" />
              <th className="px-4 py-2 font-medium text-text-secondary text-left">Detection</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((dep) => (
              <DependencyRow key={dep.address} dep={dep} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DependencyRow({ dep }: { dep: CompiledDependency }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-border hover:bg-bg-muted/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 text-text-muted transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-text-primary">{dep.name}</span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          {dep.entity ? (
            <Badge variant="purple">{dep.entity}</Badge>
          ) : (
            <span className="text-text-muted">-</span>
          )}
        </td>
        <td className="px-4 py-2.5">
          <AddressDisplay address={dep.address} className="text-xs" />
        </td>
        <td className="px-4 py-2.5 text-right font-medium text-text-primary">
          {dep.functions.length}
        </td>
        <td className="px-4 py-2.5">
          <span className={`text-xs px-2 py-0.5 rounded-full ${dep.isAutoDetected ? 'bg-status-blue/10 text-status-blue' : 'bg-purple-100 text-purple-700'}`}>
            {dep.isAutoDetected ? 'Auto' : 'Manual'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-0 py-0 bg-bg-muted/50 border-b border-border">
            {dep.description && (
              <p className="px-8 py-3 text-sm text-text-secondary border-b border-border/50">
                {dep.description}
              </p>
            )}
            <div className="px-8 py-3">
              <p className="text-xs font-medium text-text-muted mb-2">Used by functions:</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
                {dep.functions.map((fn) => (
                  <span key={`${fn.contractAddress}-${fn.functionName}`} className="text-xs">
                    <span className="text-text-muted">{fn.contractName}.</span>
                    <span className="font-mono text-text-primary">{fn.functionName}()</span>
                  </span>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SortHeader({
  field,
  label,
  current,
  dir,
  onClick,
  className,
}: {
  field: SortField
  label: string
  current: SortField
  dir: SortDir
  onClick: (f: SortField) => void
  className?: string
}) {
  const isActive = current === field
  return (
    <th
      className={`px-4 py-2 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors text-left ${className ?? ''}`}
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            {dir === 'desc' ? <path d="M6 8L2 4h8z" /> : <path d="M6 4l4 4H2z" />}
          </svg>
        )}
      </span>
    </th>
  )
}

function DependencyRiskDiagram({
  entityCount,
  depCount,
}: {
  entityCount: number
  depCount: number
}) {
  return (
    <svg viewBox="0 0 700 130" className="w-full" style={{ maxHeight: '130px' }}>
      {/* Protocol box */}
      <rect x="20" y="30" width="150" height="70" rx="8" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="1.5" />
      <text x="95" y="55" textAnchor="middle" fill="#6D28D9" fontWeight="600" fontSize="12">Your Protocol</text>
      <text x="95" y="75" textAnchor="middle" fill="#9CA3AF" fontSize="10">{depCount} dep contracts</text>

      {/* Arrows to entities */}
      <line x1="170" y1="50" x2="250" y2="35" stroke="#FB923C" strokeWidth="1.5" markerEnd="url(#arrDep)" />
      <line x1="170" y1="65" x2="250" y2="65" stroke="#FB923C" strokeWidth="1.5" markerEnd="url(#arrDep)" />
      {entityCount > 1 && (
        <line x1="170" y1="80" x2="250" y2="95" stroke="#FB923C" strokeWidth="1.5" markerEnd="url(#arrDep)" />
      )}

      {/* Entity boxes */}
      <rect x="250" y="10" width="180" height="50" rx="6" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5" />
      <text x="340" y="32" textAnchor="middle" fill="#9A3412" fontWeight="600" fontSize="11">External Entity</text>
      <text x="340" y="48" textAnchor="middle" fill="#9CA3AF" fontSize="10">e.g. Chainlink Oracles</text>

      <rect x="250" y="70" width="180" height="50" rx="6" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5" />
      <text x="340" y="92" textAnchor="middle" fill="#9A3412" fontWeight="600" fontSize="11">External Protocol</text>
      <text x="340" y="108" textAnchor="middle" fill="#9CA3AF" fontSize="10">e.g. Morpho Blue</text>

      {/* Risk explanation */}
      <rect x="470" y="20" width="210" height="90" rx="6" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1" />
      <text x="575" y="42" textAnchor="middle" fill="#991B1B" fontWeight="600" fontSize="11">Dependency Risk</text>
      <text x="575" y="60" textAnchor="middle" fill="#6B7280" fontSize="9">If a dependency fails or is</text>
      <text x="575" y="74" textAnchor="middle" fill="#6B7280" fontSize="9">compromised, functions that</text>
      <text x="575" y="88" textAnchor="middle" fill="#6B7280" fontSize="9">rely on it may malfunction,</text>
      <text x="575" y="102" textAnchor="middle" fill="#6B7280" fontSize="9">affecting protocol funds.</text>

      <defs>
        <marker id="arrDep" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#FB923C" />
        </marker>
      </defs>
    </svg>
  )
}
