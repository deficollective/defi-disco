import { clsx } from 'clsx'

interface MetricCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: 'purple' | 'green' | 'amber' | 'red' | 'blue' | 'default'
  className?: string
}

const accentStyles: Record<string, string> = {
  purple: 'border-l-purple-500',
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
        'rounded-xl border border-border bg-white p-5 shadow-sm border-l-4',
        accentStyles[accent],
        className,
      )}
    >
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {sublabel && (
        <p className="mt-1 text-sm text-text-muted">{sublabel}</p>
      )}
    </div>
  )
}
