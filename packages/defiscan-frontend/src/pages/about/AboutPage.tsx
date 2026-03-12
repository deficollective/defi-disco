export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 animate-fade-in">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="font-display text-5xl text-text-primary leading-tight">About DeFiScan</h1>
        <p className="mt-4 text-lg text-text-secondary max-w-xl">
          Advancing transparency and accountability in decentralized finance.
        </p>
      </div>

      {/* Our Mission */}
      <section className="mt-16">
        <h2 className="font-display text-3xl text-text-primary">Our Mission</h2>
        <div className="mt-6 space-y-4 text-text-secondary leading-relaxed">
          <p>
            DeFiScan is dedicated to increasing transparency and trust in the decentralized finance ecosystem. We provide comprehensive analysis and ratings of DeFi protocols, helping users make informed decisions about their participation in various protocols.
          </p>
          <p>
            Our goal is to evaluate and track the decentralization progress of DeFi protocols across multiple dimensions, including governance, autonomy, accessibility, and operational decentralization. By providing clear, objective assessments, we aim to promote higher standards and better practices across the entire DeFi space.
          </p>
        </div>
      </section>

      {/* Open Source */}
      <section className="mt-16">
        <h2 className="font-display text-3xl text-text-primary">
          Open Source & Public Good
        </h2>
        <div className="mt-6 space-y-4 text-text-secondary leading-relaxed">
          <p>
            DeFiScan is a public good. All reviews are freely available, and the
            tooling is open source. Our analysis framework builds on{' '}
            <a
              href="https://l2beat.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 transition-colors duration-150 underline decoration-brand-200 underline-offset-2"
            >
              L2BEAT
            </a>
            &rsquo;s battle-tested contract discovery engine, extending it with
            DeFi-focused capabilities.
          </p>
          <p>
            Anyone can inspect our methodology, reproduce our findings, or
            contribute to the project. Transparency in our own process is just as
            important as the transparency we seek to bring to DeFi.
          </p>
        </div>
      </section>

      {/* The DeFi Collective */}
      <section className="mt-16">
        <h2 className="font-display text-3xl text-text-primary">
          The DeFi Collective
        </h2>
        <div className="mt-6 space-y-4 text-text-secondary leading-relaxed">
          <p>
            DeFiScan is an initiative by{' '}
            <a
              href="https://deficollective.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 transition-colors duration-150 underline decoration-brand-200 underline-offset-2"
            >
              The DeFi Collective
            </a>
            , a Zug-based non-profit association dedicated to fostering a
            transparent and resilient decentralized finance ecosystem. The
            Collective brings together researchers, developers, and DeFi
            practitioners who share a commitment to user protection and protocol
            accountability.
          </p>
          <p>
            DeFiScan is funded through grants from the Ethereum Foundation,
            community donations, and support from The DeFi Collective. This
            funding model ensures that our reviews remain independent and free
            from conflicts of interest.
          </p>
        </div>
      </section>

      {/* Support Us */}
      <section className="mt-16">
        <h2 className="font-display text-3xl text-text-primary">Support Us</h2>
        <div className="mt-6 space-y-4 text-text-secondary leading-relaxed">
          <p>
            DeFiScan is free for everyone. If you find our
            reviews useful, consider supporting our mission with a donation. Your
            contribution helps us cover infrastructure costs, fund our researchers, and
            expand our coverage to more protocols.
          </p>
          <p>
            You can donate directly to{' '}
            <a
              href="https://etherscan.io/address/0xDc6f869d2D34E4aee3E89A51f2Af6D54F0F7f690"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-brand-600 hover:text-brand-700 bg-bg-muted px-2 py-1 rounded-md transition-colors duration-150"
            >
              grantsfortheants.eth
            </a>
            . Every contribution, no matter the size, makes a difference.
          </p>
        </div>
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
    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  )
}
