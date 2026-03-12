import { clsx } from 'clsx'

interface MetricCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: 'purple' | 'green' | 'amber' | 'red' | 'blue' | 'default'
  className?: string
}

const accentStyles: Record<string, string> = {
  purple: 'border-l-brand-500',
  green: 'border-l-capital',
  amber: 'border-l-token',
  red: 'border-l-status-red',
  blue: 'border-l-status-blue',
  default: 'border-l-border',
}

export function MetricCard({ label, value, sublabel, accent = 'default', className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border/60 bg-white px-5 py-4 shadow-card border-l-[3px]',
        accentStyles[accent],
        className,
      )}
    >
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-text-primary tabular-nums">{value}</p>
      {sublabel && (
        <p className="mt-1 text-sm text-text-secondary">{sublabel}</p>
      )}
    </div>
  )
}
