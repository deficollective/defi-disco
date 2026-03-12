interface StatCardProps {
  label: string
  value: string
  sublabel?: string
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-card">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary tabular-nums">{value}</p>
      {sublabel && (
        <p className="mt-1.5 text-sm text-text-secondary">{sublabel}</p>
      )}
    </div>
  )
}
