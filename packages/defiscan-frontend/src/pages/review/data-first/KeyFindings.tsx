import type { CompiledReview } from '../../../types'
import { formatUsdValue } from '../../../utils/format'

interface KeyFindingsProps {
  review: CompiledReview
}

export function KeyFindings({ review }: KeyFindingsProps) {
  const { totals, admins, dependencies } = review

  // Compute key metrics
  const hasEOA = admins.some(
    (a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned',
  )
  const multisigAdmins = admins.filter((a) => a.adminType === 'Multisig')
  const timelockAdmins = admins.filter((a) => a.adminType === 'Timelock')
  const revokedAdmins = admins.filter((a) => a.adminType === 'Revoked')
  const immutableAdmins = admins.filter(
    (a) =>
      a.adminType === 'Untemplatized' ||
      a.adminType === 'Contract' ||
      a.adminType === 'Diamond',
  )

  // Compute the highest capital-at-risk for a single admin
  const topAdmin =
    admins.length > 0
      ? admins.reduce((a, b) =>
          a.totalDirectCapital > b.totalDirectCapital ? a : b,
        )
      : null

  // Admin type breakdown
  const adminBreakdown = [
    { label: 'EOA', count: admins.filter((a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned').length, color: '#EF4444' },
    { label: 'Multisig', count: multisigAdmins.length, color: '#F59E0B' },
    { label: 'Timelock', count: timelockAdmins.length, color: '#10B981' },
    { label: 'Contract', count: immutableAdmins.length, color: '#3B82F6' },
    { label: 'Revoked', count: revokedAdmins.length, color: '#6B7280' },
  ].filter((b) => b.count > 0)

  const totalAdminCount = adminBreakdown.reduce((s, b) => s + b.count, 0)

  return (
    <div className="space-y-6">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricBox
          label="Total Capital"
          value={formatUsdValue(totals.totalCapitalAtRisk)}
          sublabel="at risk"
          color="text-capital"
        />
        {totals.totalTokenValueAtRisk > 0 && (
          <MetricBox
            label="Token Value"
            value={formatUsdValue(totals.totalTokenValueAtRisk)}
            sublabel="protocol token"
            color="text-token"
          />
        )}
        <MetricBox
          label="Contracts"
          value={String(totals.contractCount)}
          sublabel={`${totals.permissionedFunctionCount} permissioned fn`}
        />
        <MetricBox
          label="Admins"
          value={String(totals.adminCount)}
          sublabel={`${totals.dependencyCount} dependencies`}
        />
        <MetricBox
          label="Scored"
          value={`${totals.scoredFunctionCount}/${totals.permissionedFunctionCount}`}
          sublabel="functions scored"
        />
      </div>

      {/* Two-column: Admin type breakdown + Key risk indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Admin Type Breakdown Bar */}
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Admin Type Distribution
          </h3>
          {/* Horizontal stacked bar */}
          <div className="flex h-6 rounded overflow-hidden mb-3">
            {adminBreakdown.map((b) => (
              <div
                key={b.label}
                style={{
                  width: `${(b.count / totalAdminCount) * 100}%`,
                  backgroundColor: b.color,
                }}
                className="relative group"
                title={`${b.label}: ${b.count}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {adminBreakdown.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-text-secondary">{b.label}</span>
                <span className="font-semibold text-text-primary">
                  {b.count}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Risk indicators */}
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Key Risk Indicators
          </h3>
          <div className="space-y-2 text-sm">
            <RiskRow
              label="EOA admin keys"
              status={hasEOA ? 'high' : 'safe'}
              detail={
                hasEOA
                  ? `${admins.filter((a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned').length} EOA(s) with direct control`
                  : 'No EOA admins detected'
              }
            />
            <RiskRow
              label="Timelock protection"
              status={timelockAdmins.length > 0 ? 'safe' : 'medium'}
              detail={
                timelockAdmins.length > 0
                  ? `${timelockAdmins.length} timelocked admin(s)`
                  : 'No timelock protection found'
              }
            />
            <RiskRow
              label="External dependencies"
              status={
                dependencies.length === 0
                  ? 'safe'
                  : dependencies.length > 5
                    ? 'high'
                    : 'medium'
              }
              detail={`${dependencies.length} external contract${dependencies.length !== 1 ? 's' : ''}`}
            />
            {topAdmin && topAdmin.totalDirectCapital > 0 && (
              <RiskRow
                label="Max single-admin capital"
                status="info"
                detail={`${topAdmin.name}: ${formatUsdValue(topAdmin.totalDirectCapital)}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Concept diagram: What is "capital at risk"? */}
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          How Capital-at-Risk Is Measured
        </h3>
        <CapitalFlowDiagram />
      </div>
    </div>
  )
}

function MetricBox({
  label,
  value,
  sublabel,
  color,
}: {
  label: string
  value: string
  sublabel?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-xl font-bold tabular-nums mt-0.5 ${color ?? 'text-text-primary'}`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-text-muted mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}

function RiskRow({
  label,
  status,
  detail,
}: {
  label: string
  status: 'safe' | 'medium' | 'high' | 'info'
  detail: string
}) {
  const colors = {
    safe: 'bg-status-green/10 text-status-green',
    medium: 'bg-status-amber/10 text-status-amber',
    high: 'bg-status-red/10 text-status-red',
    info: 'bg-status-blue/10 text-status-blue',
  }
  const icons = {
    safe: 'M5 13l4 4L19 7',
    medium: 'M12 9v2m0 4h.01',
    high: 'M6 18L18 6M6 6l12 12',
    info: 'M13 16h-1v-4h-1m1-4h.01',
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${colors[status]}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icons[status]} />
          </svg>
        </span>
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      <span className="text-text-secondary text-xs">{detail}</span>
    </div>
  )
}

function CapitalFlowDiagram() {
  return (
    <svg viewBox="0 0 800 180" className="w-full" style={{ maxHeight: '180px' }}>
      {/* Background */}
      <rect x="0" y="0" width="800" height="180" fill="transparent" />

      {/* Admin box */}
      <rect x="20" y="60" width="130" height="60" rx="8" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="1.5" />
      <text x="85" y="85" textAnchor="middle" className="text-xs" fill="#6D28D9" fontWeight="600" fontSize="12">Admin</text>
      <text x="85" y="102" textAnchor="middle" className="text-xs" fill="#9CA3AF" fontSize="10">(EOA / Multisig)</text>

      {/* Arrow 1 */}
      <line x1="150" y1="90" x2="220" y2="90" stroke="#C4B5FD" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <text x="185" y="82" textAnchor="middle" fill="#9CA3AF" fontSize="9">calls</text>

      {/* Function box */}
      <rect x="220" y="60" width="160" height="60" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="300" y="85" textAnchor="middle" fill="#92400E" fontWeight="600" fontSize="12">Permissioned Function</text>
      <text x="300" y="102" textAnchor="middle" fill="#9CA3AF" fontSize="10">e.g. pause(), setFee()</text>

      {/* Arrow 2 */}
      <line x1="380" y1="90" x2="450" y2="90" stroke="#F59E0B" strokeWidth="1.5" markerEnd="url(#arrowhead2)" />
      <text x="415" y="82" textAnchor="middle" fill="#9CA3AF" fontSize="9">modifies</text>

      {/* Contract box */}
      <rect x="450" y="40" width="140" height="50" rx="8" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
      <text x="520" y="60" textAnchor="middle" fill="#1E40AF" fontWeight="600" fontSize="12">Direct Contract</text>
      <text x="520" y="77" textAnchor="middle" fill="#10B981" fontWeight="600" fontSize="11">$68.7M</text>

      {/* Arrow 3 to reachable */}
      <line x1="590" y1="65" x2="640" y2="65" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead3)" />

      {/* Reachable contract box */}
      <rect x="640" y="40" width="140" height="50" rx="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="710" y="60" textAnchor="middle" fill="#60A5FA" fontWeight="600" fontSize="12">Reachable Contract</text>
      <text x="710" y="77" textAnchor="middle" fill="#10B981" fontWeight="600" fontSize="11">$18.4M</text>

      {/* Arrow 2b to dependency */}
      <line x1="380" y1="105" x2="450" y2="140" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead2)" />
      <text x="395" y="128" fill="#9CA3AF" fontSize="9">depends on</text>

      {/* Dependency box */}
      <rect x="450" y="120" width="140" height="50" rx="8" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5" />
      <text x="520" y="141" textAnchor="middle" fill="#9A3412" fontWeight="600" fontSize="12">External Dependency</text>
      <text x="520" y="157" textAnchor="middle" fill="#9CA3AF" fontSize="10">e.g. Chainlink Oracle</text>

      {/* Legend */}
      <rect x="20" y="148" width="8" height="8" rx="2" fill="#10B981" />
      <text x="33" y="156" fill="#6B7280" fontSize="9">= Capital at risk (direct)</text>
      <rect x="170" y="148" width="8" height="8" rx="2" fill="#10B981" opacity="0.5" />
      <text x="183" y="156" fill="#6B7280" fontSize="9">= Capital at risk (reachable via call graph)</text>
      <line x1="380" y1="152" x2="405" y2="152" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="410" y="156" fill="#6B7280" fontSize="9">= Indirect path</text>

      {/* Arrowhead markers */}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#C4B5FD" />
        </marker>
        <marker id="arrowhead2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#F59E0B" />
        </marker>
        <marker id="arrowhead3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
        </marker>
      </defs>
    </svg>
  )
}
