import { useState, useMemo } from 'react'
import { Badge } from '../../../../components/Badge'
import { AddressDisplay } from '../../../../components/AddressDisplay'
import type { CompiledReview, CompiledDependency } from '../../../../types'
import { DependencyRiskDiagram } from './svg/DependencyRiskDiagram'

interface DepsTabProps {
  review: CompiledReview
}

type SortField = 'name' | 'entity' | 'functions'
type SortDir = 'asc' | 'desc'

export function DepsTab({ review }: DepsTabProps) {
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
          <span className="font-semibold text-text-primary">
            {dependencies.length}
          </span>{' '}
          dependenc{dependencies.length !== 1 ? 'ies' : 'y'}
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
          Dependency Entity Concentration
        </h3>
        <DependencyRiskDiagram dependencies={dependencies} />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-muted">
              <SortHeader
                field="name"
                label="Dependency"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                field="entity"
                label="Entity"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <th className="px-4 py-2 font-medium text-text-secondary text-left">
                Address
              </th>
              <SortHeader
                field="functions"
                label="Used By"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
                className="text-right"
              />
              <th className="px-4 py-2 font-medium text-text-secondary text-left">
                Detection
              </th>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
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
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${dep.isAutoDetected ? 'bg-status-blue/10 text-status-blue' : 'bg-purple-100 text-purple-700'}`}
          >
            {dep.isAutoDetected ? 'Auto' : 'Manual'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td
            colSpan={5}
            className="px-0 py-0 bg-bg-muted/50 border-b border-border"
          >
            {dep.description && (
              <p className="px-8 py-3 text-sm text-text-secondary border-b border-border/50">
                {dep.description}
              </p>
            )}
            <div className="px-8 py-3">
              <p className="text-xs font-medium text-text-muted mb-2">
                Used by functions:
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
                {dep.functions.map((fn) => (
                  <span
                    key={`${fn.contractAddress}-${fn.functionName}`}
                    className="text-xs"
                  >
                    <span className="text-text-muted">{fn.contractName}.</span>
                    <span className="font-mono text-text-primary">
                      {fn.functionName}()
                    </span>
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
            {dir === 'desc' ? (
              <path d="M6 8L2 4h8z" />
            ) : (
              <path d="M6 4l4 4H2z" />
            )}
          </svg>
        )}
      </span>
    </th>
  )
}
