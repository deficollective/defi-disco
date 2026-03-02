import { DependencyCard } from './DependencyCard'
import type { CompiledReview } from '../../../types'

interface DependenciesSectionProps {
  review: CompiledReview
}

export function DependenciesSection({ review }: DependenciesSectionProps) {
  const { dependencies } = review

  if (dependencies.length === 0) {
    return <p className="text-text-muted">No external dependencies found.</p>
  }

  // Group by entity
  const grouped = new Map<string | null, typeof dependencies>()
  for (const dep of dependencies) {
    const key = dep.entity
    const list = grouped.get(key) ?? []
    list.push(dep)
    grouped.set(key, list)
  }

  const entityGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return a.localeCompare(b)
  })

  return (
    <div>
      <p className="text-text-secondary mb-6">
        {dependencies.length} external dependenc
        {dependencies.length !== 1 ? 'ies' : 'y'}
      </p>
      <div className="space-y-6">
        {entityGroups.map(([entity, deps]) => (
          <div key={entity ?? '__none'}>
            {entity && (
              <h3 className="text-lg font-medium text-text-primary mb-3">
                {entity}
                <span className="ml-2 text-sm text-text-muted font-normal">
                  ({deps.length} contract{deps.length !== 1 ? 's' : ''})
                </span>
              </h3>
            )}
            <div className="space-y-3">
              {deps.map((dep) => (
                <DependencyCard key={dep.address} dependency={dep} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
