import { useIndex } from '../../data/hooks'
import { StatsDashboard } from './StatsDashboard'
import { TopDependencies } from './TopDependencies'
import { ProtocolTable } from './ProtocolTable'

export function LandingPage() {
  const { data, isLoading, error } = useIndex()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-status-red">Failed to load data.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text-primary">
          DeFi Centralization Reviews
        </h1>
        <p className="mt-3 text-lg text-text-secondary max-w-2xl mx-auto">
          Independent reviews of DeFi protocols, analyzing admin
          permissions, dependencies, and fund safety.
        </p>
      </div>

      <StatsDashboard data={data} />

      {data.dependencies.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Top Dependencies
          </h2>
          <TopDependencies dependencies={data.dependencies} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          All Reviews
        </h2>
        <ProtocolTable protocols={data.protocols} />
      </section>
    </div>
  )
}
