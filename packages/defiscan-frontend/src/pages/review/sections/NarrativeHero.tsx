import { Badge } from '../../../components/Badge'
import { ProtocolTypeBadge } from '../../../components/ProtocolTypeBadge'
import { GlossaryTooltip } from '../../../components/GlossaryTooltip'
import { formatUsdValue } from '../../../utils/format'
import { assessRisk } from '../../../utils/narrative'
import type { CompiledReview } from '../../../types'
import { clsx } from 'clsx'

interface NarrativeHeroProps {
  review: CompiledReview
}

export function NarrativeHero({ review }: NarrativeHeroProps) {
  const { metadata, totals } = review
  const risk = assessRisk(review)

  return (
    <div>
      {/* Protocol identity */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">
          {metadata.protocolName}
        </h1>
        <ProtocolTypeBadge type={metadata.projectType} />
        <Badge>{metadata.chain}</Badge>
        {metadata.tokenName && (
          <Badge variant="purple">{metadata.tokenName}</Badge>
        )}
      </div>

      {/* Protocol description */}
      {metadata.description && (
        <p className="mt-4 text-lg text-text-secondary leading-relaxed max-w-3xl">
          {metadata.description}
        </p>
      )}

      {/* Risk verdict banner */}
      <div
        className={clsx(
          'mt-8 rounded-2xl border-2 p-6',
          risk.bgColor,
          risk.borderColor,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            <RiskIndicator level={risk.level} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className={clsx('text-xl font-bold', risk.color)}>
                {risk.label}
              </h2>
            </div>
            <p className="mt-2 text-text-primary leading-relaxed">
              {risk.summary}
            </p>
          </div>
        </div>
      </div>

      {/* At-a-glance metrics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Contracts"
          value={String(totals.contractCount)}
          sublabel="analyzed"
        />
        <MetricCard
          label="Admins"
          value={String(totals.adminCount)}
          sublabel="with control"
        />
        <MetricCard
          label={
            <GlossaryTooltip term="Capital at Risk">
              Capital at Risk
            </GlossaryTooltip>
          }
          value={formatUsdValue(totals.totalCapitalAtRisk)}
          sublabel="in protocol"
          valueColor="text-capital"
        />
        <MetricCard
          label="Dependencies"
          value={String(totals.dependencyCount)}
          sublabel="external"
        />
      </div>
    </div>
  )
}

function RiskIndicator({ level }: { level: string }) {
  const colors: Record<string, { ring: string; fill: string }> = {
    low: { ring: 'text-status-green', fill: 'text-status-green' },
    medium: { ring: 'text-status-amber', fill: 'text-status-amber' },
    high: { ring: 'text-status-amber', fill: 'text-status-amber' },
    critical: { ring: 'text-status-red', fill: 'text-status-red' },
  }
  const fallback = { ring: 'text-status-amber', fill: 'text-status-amber' }
  const c = colors[level] ?? fallback

  return (
    <svg
      className={clsx('h-10 w-10', c.ring)}
      viewBox="0 0 40 40"
      fill="none"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.3"
      />
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={`${level === 'low' ? 113 : level === 'medium' ? 56 : level === 'high' ? 85 : 113} 113`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <circle
        cx="20"
        cy="20"
        r="6"
        className={c.fill}
        fill="currentColor"
      />
    </svg>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  valueColor,
}: {
  label: React.ReactNode
  value: string
  sublabel?: string
  valueColor?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p
        className={clsx(
          'mt-1 text-2xl font-bold',
          valueColor ?? 'text-text-primary',
        )}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-text-muted">{sublabel}</p>
      )}
    </div>
  )
}
