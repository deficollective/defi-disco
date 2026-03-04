export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-text-primary">About DeFiScan</h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          DeFiScan is an independent initiative dedicated to increasing
          transparency and trust in decentralized finance. By providing
          comprehensive, data-driven security reviews of DeFi protocols, we help
          users understand the risks associated with the protocols they use.
        </p>
      </div>

      {/* Our Mission */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-text-primary">Our Mission</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          DeFi protocols manage billions of dollars in user funds, yet the level
          of decentralization, security, and transparency varies widely across
          the ecosystem. Many protocols present themselves as fully
          decentralized while retaining significant admin controls, relying on
          external dependencies, or lacking adequate security measures.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          DeFiScan exists to close this transparency gap. We systematically
          analyze each protocol's smart contract architecture, permission
          structure, and dependency chain to give users a clear, honest picture
          of how decentralized a protocol truly is.
        </p>
      </section>

      {/* How We Evaluate */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-text-primary">
          How We Evaluate Protocols
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Our reviews evaluate protocols across four key dimensions of
          decentralization and security:
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DimensionCard
            title="Governance"
            description="Who controls the protocol? We map every admin address, multisig, and governance contract to understand who can change the system and under what conditions."
          />
          <DimensionCard
            title="Autonomy"
            description="How dependent is the protocol on external systems? We identify all external dependencies such as oracles, bridges, and third-party contracts that the protocol relies on."
          />
          <DimensionCard
            title="Security"
            description="What safeguards are in place? We examine timelocks, upgrade delays, circuit breakers, and other mechanisms that protect users from sudden changes."
          />
          <DimensionCard
            title="Transparency"
            description="Is the code open source and audited? We review source code availability, audit history, and the overall verifiability of the protocol's smart contracts."
          />
        </div>
      </section>

      {/* Open Source */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-text-primary">
          Open Source & Public Good
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          DeFiScan is a public good. All reviews are freely available, and the
          tooling is open source. Our analysis framework builds on{' '}
          <a
            href="https://l2beat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 transition-colors"
          >
            L2BEAT
          </a>
          's battle-tested contract discovery engine, extending it with
          permission analysis, fund tracking, dependency mapping, and automated
          review generation.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Anyone can inspect our methodology, reproduce our findings, or
          contribute to the project. Transparency in our own process is just as
          important as the transparency we seek to bring to DeFi.
        </p>
      </section>

      {/* The DeFi Collective */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-text-primary">
          The DeFi Collective
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          DeFiScan is an initiative by{' '}
          <a
            href="https://deficollective.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 transition-colors"
          >
            The DeFi Collective
          </a>
          , a Zug-based non-profit association dedicated to fostering a
          transparent and resilient decentralized finance ecosystem. The
          Collective brings together researchers, developers, and DeFi
          practitioners who share a commitment to user protection and protocol
          accountability.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          DeFiScan is funded through grants from the Ethereum Foundation,
          community donations, and support from The DeFi Collective. This
          funding model ensures that our reviews remain independent and free
          from conflicts of interest.
        </p>
      </section>
    </div>
  )
}

function DimensionCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  )
}
