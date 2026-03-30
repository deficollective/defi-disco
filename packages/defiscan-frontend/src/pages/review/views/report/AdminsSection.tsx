import type { CompiledReview, CompiledAdmin } from '../../../../types'
import { formatUsdValue, etherscanUrl, stripChainPrefix } from '../../../../utils/format'
import { MitigationBadge } from '../../../../components/MitigationBadge'
import { deduplicateMitigations } from '../explorer/shared'
import { SectionHeader, ShowMoreButton } from './_shared'

interface AdminsSectionProps {
  review: CompiledReview
  onShowMore: () => void
}

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  EOA: { label: 'EOA', bg: 'bg-accent/10', text: 'text-accent' },
  EOAPermissioned: { label: 'EOA', bg: 'bg-accent/10', text: 'text-accent' },
  Multisig: { label: 'Multisig', bg: 'bg-amber-100', text: 'text-amber-700' },
  Timelock: { label: 'Timelock', bg: 'bg-text-primary/5', text: 'text-text-muted' },
  Contract: { label: 'Contract', bg: 'bg-text-primary/5', text: 'text-text-muted' },
  Immutable: { label: 'Immutable', bg: 'bg-green-100', text: 'text-green-700' },
  Upgradeable: { label: 'Upgradeable', bg: 'bg-purple-100', text: 'text-purple-700' },
  Revoked: { label: 'Revoked', bg: 'bg-text-primary/5', text: 'text-text-muted' },
}

function AdminTypeBadge({ type }: { type: string }) {
  const cfg = TYPE_BADGE[type] ?? { label: type, bg: 'bg-text-primary/5', text: 'text-text-muted' }
  return (
    <span className={`inline-flex items-center px-[8px] py-[2px] rounded-sm text-[9px] font-bold uppercase tracking-[0.225px] ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function isHumanType(a: CompiledAdmin): boolean {
  return (
    a.adminType === 'EOA' ||
    a.adminType === 'EOAPermissioned' ||
    a.adminType === 'Multisig' ||
    a.adminType === 'Timelock'
  )
}

const RISK_ORDER: Record<string, number> = {
  EOA: 0,
  EOAPermissioned: 1,
  Multisig: 2,
  Timelock: 3,
  Upgradeable: 4,
  Diamond: 4,
  Contract: 5,
  Immutable: 5,
  Untemplatized: 6,
  Revoked: 7,
}

function sortByRisk(admins: CompiledAdmin[]): CompiledAdmin[] {
  return [...admins].sort((a, b) => {
    const diff = b.totalReachableCapital - a.totalReachableCapital
    if (diff !== 0) return diff
    return (RISK_ORDER[a.adminType] ?? 5) - (RISK_ORDER[b.adminType] ?? 5)
  })
}

export function AdminsSection({ review, onShowMore }: AdminsSectionProps) {
  const { admins, totals } = review
  const totalTvs = totals.totalCapitalAtRisk + (totals.totalTokenValue ?? 0)

  const humanControlled = sortByRisk(
    admins.filter((a) => isHumanType(a) && !a.isGovernance),
  )
  const governance = sortByRisk(admins.filter((a) => a.isGovernance))
  const activeAdmins = [...humanControlled, ...governance]

  const noHumanControl = activeAdmins.length === 0

  // If no admins at all, or no human/governance control — show immutable banner
  if (admins.length === 0 || noHumanControl) {
    return (
      <div className="border border-capital/30 bg-capital/5 rounded-lg p-[33px]">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-full bg-capital/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="size-5 text-capital" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[18px] text-capital mb-2">
              Immutable Protocol
            </p>
            <p className="text-[14px] text-text-muted leading-[22px]">
              All admin controls resolve to immutable contracts or revoked
              addresses. No permissioned functions can be exercised by any
              person or entity to affect user funds.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const maxCapital = Math.max(...activeAdmins.map((a) => a.totalReachableCapital), 0)
  const impactedCapital = activeAdmins.reduce((s, a) => s + a.totalReachableCapital, 0)
  const impactedPct = totalTvs > 0 ? Math.round((impactedCapital / totalTvs) * 100) : 0

  return (
    <div className="flex gap-[30px] items-start">
      {/* Left: bar chart */}
      <div className="flex-1 min-w-0 bg-white border border-border rounded-lg p-[33px] flex flex-col gap-6">
        <SectionHeader
          icon={
            <svg className="size-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          }
          label="Active Admins"
          action={<ShowMoreButton onClick={onShowMore} />}
        />

        {/* Admin rows */}
        <div className="flex flex-col gap-[32px]">
          {activeAdmins.map((admin) => {
            const barWidth = maxCapital > 0 ? (admin.totalReachableCapital / maxCapital) * 100 : 0
            const rawAddress = stripChainPrefix(admin.address)
            const mitigations = deduplicateMitigations(
              admin.functions?.flatMap((f) => f.mitigations ?? []) ?? [],
            )
            return (
              <div key={admin.address} className="flex flex-col gap-[16px]">
                {/* Name + badges + capital */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-text-primary">{admin.name}</span>
                    <a
                      href={etherscanUrl(admin.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-accent"
                      title={rawAddress}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                    <AdminTypeBadge type={admin.adminType} />
                    {admin.isGovernance && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.5px] bg-blue-100 text-blue-700">
                        Governance
                      </span>
                    )}
                    {mitigations.map((m, i) => (
                      <MitigationBadge key={i} mitigation={m} />
                    ))}
                  </div>
                  <span className="font-mono font-bold text-sm text-text-primary shrink-0 ml-2">
                    {admin.totalReachableCapital > 0
                      ? formatUsdValue(admin.totalReachableCapital)
                      : '—'}
                  </span>
                </div>
                {/* Capital bar */}
                <div className="h-[12px] bg-bg-card border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.max(barWidth, barWidth > 0 ? 1 : 0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-[312px] shrink-0 bg-bg-card border border-border rounded-lg p-[33px] flex flex-col gap-[24px]">
        <div className="flex items-center gap-2">
          <svg className="size-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="font-bold text-[12px] uppercase text-text-muted tracking-[1.2px]">
            Admin Stats
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Impacted TVS
          </p>
          <p className="font-mono font-bold text-[36px] leading-[36px] text-text-primary">
            {impactedPct}%
          </p>
          <p className="text-xs text-text-muted mt-1">
            Proportion of TVS subject to admin control.
          </p>
        </div>

        <div className="border-t border-border pt-6 flex flex-col gap-1">
          <p className="font-bold text-[10px] uppercase text-text-muted tracking-[0.5px]">
            Admins Detected
          </p>
          <p className="font-mono font-bold text-[36px] leading-[36px] text-text-primary">
            {activeAdmins.length}
          </p>
        </div>
      </div>
    </div>
  )
}
