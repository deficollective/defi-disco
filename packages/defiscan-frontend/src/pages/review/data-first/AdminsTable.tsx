import { useState, useMemo } from 'react'
import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import { UsdValue } from '../../../components/UsdValue'
import { formatUsdValue } from '../../../utils/format'
import type { CompiledReview, CompiledAdmin, CompiledAdminFunction } from '../../../types'

interface AdminsTableProps {
  review: CompiledReview
}

type SortField = 'name' | 'type' | 'directCapital' | 'reachableCapital' | 'functions' | 'tokenValue'
type SortDir = 'asc' | 'desc'

export function AdminsTable({ review }: AdminsTableProps) {
  const { admins, totals } = review
  const [sortField, setSortField] = useState<SortField>('directCapital')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sorted = useMemo(() => {
    const copy = [...admins]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'type':
          cmp = a.adminType.localeCompare(b.adminType)
          break
        case 'directCapital':
          cmp = a.totalDirectCapital - b.totalDirectCapital
          break
        case 'reachableCapital':
          cmp = a.totalReachableCapital - b.totalReachableCapital
          break
        case 'functions':
          cmp = a.functions.length - b.functions.length
          break
        case 'tokenValue':
          cmp = a.totalReachableTokenValue - b.totalReachableTokenValue
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return copy
  }, [admins, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function toggleExpand(address: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(address)) {
        next.delete(address)
      } else {
        next.add(address)
      }
      return next
    })
  }

  if (admins.length === 0) {
    return <p className="text-text-muted">No admins found.</p>
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">{admins.length}</span> admin{admins.length !== 1 ? 's' : ''}
        </span>
        <span className="text-text-secondary">
          Capital: <UsdValue value={totals.totalCapitalAtRisk} variant="capital" className="text-sm" />
        </span>
        {totals.totalTokenValueAtRisk > 0 && (
          <span className="text-text-secondary">
            Token: <UsdValue value={totals.totalTokenValueAtRisk} variant="token" className="text-sm" />
          </span>
        )}
      </div>

      {/* Admin hierarchy diagram */}
      <div className="rounded-lg border border-border bg-white p-4 mb-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Admin Hierarchy Overview
        </h3>
        <AdminHierarchySvg admins={admins} />
      </div>

      {/* Sortable table */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-muted">
              <SortHeader field="name" label="Admin" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader field="type" label="Type" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader field="directCapital" label="Direct Capital" current={sortField} dir={sortDir} onClick={handleSort} className="text-right" />
              <SortHeader field="reachableCapital" label="Reachable Capital" current={sortField} dir={sortDir} onClick={handleSort} className="text-right" />
              <SortHeader field="tokenValue" label="Token Value" current={sortField} dir={sortDir} onClick={handleSort} className="text-right" />
              <SortHeader field="functions" label="Functions" current={sortField} dir={sortDir} onClick={handleSort} className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((admin) => (
              <AdminRow
                key={admin.address}
                admin={admin}
                isExpanded={expanded.has(admin.address)}
                onToggle={() => toggleExpand(admin.address)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-bg-muted/50">
              <td colSpan={2} className="px-4 py-2 font-semibold text-text-primary">Total</td>
              <td className="px-4 py-2 text-right">
                <UsdValue value={totals.totalCapitalAtRisk} variant="capital" className="text-sm font-semibold" />
              </td>
              <td className="px-4 py-2 text-right text-text-muted text-xs">-</td>
              <td className="px-4 py-2 text-right">
                {totals.totalTokenValueAtRisk > 0 ? (
                  <UsdValue value={totals.totalTokenValueAtRisk} variant="token" className="text-sm font-semibold" />
                ) : (
                  <span className="text-text-muted">-</span>
                )}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-text-primary">
                {totals.permissionedFunctionCount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Concept: Direct vs Reachable Capital */}
      <div className="rounded-lg border border-border bg-white p-4 mt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Direct vs Reachable Capital
        </h3>
        <DirectVsReachableDiagram />
      </div>
    </div>
  )
}

function AdminRow({
  admin,
  isExpanded,
  onToggle,
}: {
  admin: CompiledAdmin
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b border-border hover:bg-bg-muted/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <svg
              className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div className="min-w-0">
              <div className="font-medium text-text-primary truncate max-w-[200px]" title={admin.name}>
                {admin.name}
              </div>
              <AddressDisplay address={admin.address} className="text-xs" />
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <Badge variant="admin-type" adminType={admin.adminType}>
            {admin.adminType}
          </Badge>
          {admin.isGovernance && (
            <Badge variant="governance" className="ml-1">Gov</Badge>
          )}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {admin.totalDirectCapital > 0 ? (
            <UsdValue value={admin.totalDirectCapital} variant="capital" className="text-sm" />
          ) : (
            <span className="text-text-muted">-</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {admin.totalReachableCapital > 0 ? (
            <UsdValue value={admin.totalReachableCapital} variant="capital" className="text-sm" />
          ) : (
            <span className="text-text-muted">-</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {admin.totalReachableTokenValue > 0 ? (
            <UsdValue value={admin.totalReachableTokenValue} variant="token" className="text-sm" />
          ) : (
            <span className="text-text-muted">-</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right font-medium text-text-primary">
          {admin.functions.length}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <ExpandedFunctions admin={admin} />
          </td>
        </tr>
      )}
    </>
  )
}

function ExpandedFunctions({ admin }: { admin: CompiledAdmin }) {
  // Group functions by contract
  const byContract = new Map<string, CompiledAdminFunction[]>()
  for (const fn of admin.functions) {
    const key = fn.contractName
    const list = byContract.get(key) ?? []
    list.push(fn)
    byContract.set(key, list)
  }

  return (
    <div className="bg-bg-muted/50 border-t border-border">
      {admin.description && (
        <p className="px-6 py-3 text-sm text-text-secondary border-b border-border/50 leading-relaxed">
          {admin.description}
        </p>
      )}
      <div className="px-6 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left pb-1 font-medium">Contract</th>
              <th className="text-left pb-1 font-medium">Function</th>
              <th className="text-right pb-1 font-medium">Direct $</th>
              <th className="text-right pb-1 font-medium">Reachable Contracts</th>
            </tr>
          </thead>
          <tbody>
            {admin.functions.map((fn) => (
              <tr key={`${fn.contractAddress}-${fn.functionName}`} className="border-t border-border/30">
                <td className="py-1.5 text-text-secondary">{fn.contractName}</td>
                <td className="py-1.5">
                  <span className="font-mono text-text-primary">{fn.functionName}()</span>
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {fn.directFundsUsd > 0 ? (
                    <span className="text-capital font-medium">{formatUsdValue(fn.directFundsUsd)}</span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="py-1.5 text-right">
                  {fn.reachableContracts.length > 0 ? (
                    <span className="text-text-primary">
                      {fn.reachableContracts.length}
                      {fn.reachableContracts.some((rc) => rc.fundsAtRisk) && (
                        <span className="ml-1 text-capital">
                          ({formatUsdValue(fn.reachableContracts.filter((rc) => rc.fundsAtRisk).reduce((s, rc) => s + rc.fundsUsd, 0))})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

function AdminHierarchySvg({ admins }: { admins: CompiledAdmin[] }) {
  // Build a simple hierarchy: group by type, show capital
  const types = new Map<string, { count: number; capital: number; names: string[] }>()
  for (const admin of admins) {
    const existing = types.get(admin.adminType) ?? { count: 0, capital: 0, names: [] }
    existing.count += 1
    existing.capital += admin.totalDirectCapital
    existing.names.push(admin.name)
    types.set(admin.adminType, existing)
  }

  const entries = Array.from(types.entries()).sort((a, b) => b[1].capital - a[1].capital)
  const typeColors: Record<string, string> = {
    EOA: '#EF4444', EOAPermissioned: '#EF4444', Multisig: '#F59E0B',
    Timelock: '#10B981', Contract: '#3B82F6', Diamond: '#3B82F6',
    Revoked: '#6B7280', Untemplatized: '#8B5CF6',
  }

  const boxWidth = 160
  const boxHeight = 50
  const gap = 20
  const totalWidth = entries.length * (boxWidth + gap) - gap
  const viewWidth = Math.max(totalWidth + 40, 400)

  return (
    <svg viewBox={`0 0 ${viewWidth} ${boxHeight + 40}`} className="w-full" style={{ maxHeight: '90px' }}>
      {entries.map((entry, i) => {
        const [type, data] = entry
        const x = 20 + i * (boxWidth + gap)
        const color = typeColors[type] ?? '#6B7280'
        return (
          <g key={type}>
            <rect
              x={x}
              y={10}
              width={boxWidth}
              height={boxHeight}
              rx={6}
              fill={`${color}10`}
              stroke={color}
              strokeWidth={1.5}
            />
            <text
              x={x + boxWidth / 2}
              y={30}
              textAnchor="middle"
              fill={color}
              fontWeight="600"
              fontSize="11"
            >
              {type} ({data.count})
            </text>
            <text
              x={x + boxWidth / 2}
              y={48}
              textAnchor="middle"
              fill="#10B981"
              fontWeight="500"
              fontSize="10"
            >
              {data.capital > 0 ? formatUsdValue(data.capital) : 'No direct capital'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DirectVsReachableDiagram() {
  return (
    <svg viewBox="0 0 700 120" className="w-full" style={{ maxHeight: '120px' }}>
      {/* Direct capital box */}
      <rect x="20" y="20" width="200" height="80" rx="8" fill="#DCFCE7" stroke="#10B981" strokeWidth="1.5" />
      <text x="120" y="48" textAnchor="middle" fill="#166534" fontWeight="600" fontSize="12">Direct Capital</text>
      <text x="120" y="68" textAnchor="middle" fill="#6B7280" fontSize="10">Funds held in the contract</text>
      <text x="120" y="84" textAnchor="middle" fill="#6B7280" fontSize="10">the function modifies directly</text>

      {/* Arrow */}
      <line x1="220" y1="60" x2="280" y2="60" stroke="#10B981" strokeWidth="1.5" markerEnd="url(#arrowDR)" />
      <text x="250" y="53" textAnchor="middle" fill="#9CA3AF" fontSize="9">calls</text>

      {/* Reachable capital box */}
      <rect x="280" y="20" width="200" height="80" rx="8" fill="#DCFCE7" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="380" y="48" textAnchor="middle" fill="#166534" fontWeight="600" fontSize="12">Reachable Capital</text>
      <text x="380" y="68" textAnchor="middle" fill="#6B7280" fontSize="10">Funds in downstream contracts</text>
      <text x="380" y="84" textAnchor="middle" fill="#6B7280" fontSize="10">reachable via call graph</text>

      {/* Distinction note */}
      <rect x="510" y="25" width="170" height="70" rx="6" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="1" />
      <text x="595" y="48" textAnchor="middle" fill="#6D28D9" fontWeight="600" fontSize="11">Key Distinction</text>
      <text x="595" y="65" textAnchor="middle" fill="#6B7280" fontSize="9">Direct = worst case if admin</text>
      <text x="595" y="78" textAnchor="middle" fill="#6B7280" fontSize="9">acts maliciously on one contract</text>

      <defs>
        <marker id="arrowDR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
        </marker>
      </defs>
    </svg>
  )
}
