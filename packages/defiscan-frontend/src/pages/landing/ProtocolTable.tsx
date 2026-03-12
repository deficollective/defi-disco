import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { ProtocolTypeBadge } from '../../components/ProtocolTypeBadge'
import { UsdValue } from '../../components/UsdValue'
import type { ProtocolSummary } from '../../types'

type SortKey = 'name' | 'capital' | 'admins' | 'dependencies'

interface ProtocolTableProps {
  protocols: ProtocolSummary[]
}

export function ProtocolTable({ protocols }: ProtocolTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('capital')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...protocols].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'capital':
        cmp = a.totals.totalCapitalAtRisk - b.totals.totalCapitalAtRisk
        break
      case 'admins':
        cmp = a.totals.adminCount - b.totals.adminCount
        break
      case 'dependencies':
        cmp = a.totals.dependencyCount - b.totals.dependencyCount
        break
    }
    return sortAsc ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortHeader({
    label,
    sortKeyValue,
    align = 'left',
  }: {
    label: string
    sortKeyValue: SortKey
    align?: 'left' | 'right'
  }) {
    const active = sortKey === sortKeyValue
    return (
      <th
        className={`px-4 py-3.5 font-medium text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors duration-150 text-xs uppercase tracking-wider ${
          align === 'right' ? 'text-right' : 'text-left'
        }`}
        onClick={() => toggleSort(sortKeyValue)}
      >
        {label}
        {active && (
          <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>
        )}
      </th>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <SortHeader label="Protocol" sortKeyValue="name" />
            <th className="text-left px-4 py-3.5 font-medium text-text-muted text-xs uppercase tracking-wider">
              Chain
            </th>
            <th className="text-left px-4 py-3.5 font-medium text-text-muted text-xs uppercase tracking-wider">
              Type
            </th>
            <SortHeader
              label="TVL"
              sortKeyValue="capital"
              align="right"
            />
            <SortHeader
              label="Admins"
              sortKeyValue="admins"
              align="right"
            />
            <SortHeader
              label="Deps"
              sortKeyValue="dependencies"
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.slug}
              className="border-b border-border/50 last:border-0 hover:bg-bg-muted/40 transition-colors duration-150"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/protocol/${p.slug}`}
                  className="font-semibold text-text-primary hover:text-brand-600 transition-colors duration-150"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge>{p.chain}</Badge>
              </td>
              <td className="px-4 py-3">
                <ProtocolTypeBadge type={p.projectType} />
              </td>
              <td className="px-4 py-3 text-right">
                <UsdValue value={p.totals.totalCapitalAtRisk} variant="capital" />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {p.totals.adminCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {p.totals.dependencyCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
