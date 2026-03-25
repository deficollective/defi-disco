import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import { useIndex } from '../../data/hooks'
import { formatUsdValue } from '../../utils/format'

const trustPostureData = [
  { axis: 'CONTROL', value: 85 },
  { axis: 'DEPENDENCIES', value: 70 },
  { axis: 'EXIT PROTECTION', value: 60 },
  { axis: 'VERIFIABILITY', value: 90 },
  { axis: 'FRONTENDS', value: 75 },
]

const methodologyItems = [
  {
    icon: KeyIcon,
    title: 'Control',
    desc: 'Exhaustive mapping of upgradeability, administrative privileges, protections, and privilege ownership.',
  },
  {
    icon: LinkIcon,
    title: 'Dependencies',
    desc: 'Analysis of underlying protocols, oracles, and infrastructure dependencies.',
  },
  {
    icon: ShieldIcon,
    title: 'Exit Protection',
    desc: 'Verifying withdrawal guarantees in the happy and unhappy case.',
  },
  {
    icon: CodeIcon,
    title: 'Code Verifiability',
    desc: 'Analysis of source code accessibility, documentation, and verifiability.',
  },
  {
    icon: GlobeIcon,
    title: 'Frontends',
    desc: 'Verification of accessibility of the protocol in terms of diverse frontends.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: indexData } = useIndex()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/protocols?search=${encodeURIComponent(search.trim())}`)
    }
  }

  const protocols = indexData?.protocols ?? []
  const recentProtocols = protocols.slice(0, 3)

  return (
    <div className="bg-bg-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background blur orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[175px] left-[320px] size-[384px] rounded-xl bg-accent opacity-10 blur-[60px]" />
          <div className="absolute bottom-[175px] right-[320px] size-[384px] rounded-xl bg-[#8455ef] opacity-10 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-[896px] px-8 py-24 text-center flex flex-col items-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#dce2f3] px-3 py-1">
            <svg
              className="size-3 text-accent shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[1.5px]">
              Continuous Monitoring Active
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-black text-[96px] leading-[96px] tracking-[-4.8px] text-[#151c27]">
            Know what
            <br />
            <span className="text-accent-dark">you&apos;re trusting.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl font-normal text-text-secondary leading-normal max-w-[612px]">
            Continuous risk assessment for institutional liquidity. Verify the
            exposure to trusted code, admin keys and dependencies of any DeFi
            protocol with on-chain evidence.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-4 w-full max-w-[672px] bg-white p-2 rounded flex items-center shadow-[0px_20px_25px_-5px_rgba(226,232,240,0.5),0px_8px_10px_-6px_rgba(226,232,240,0.5)]"
          >
            <input
              type="text"
              placeholder="Search a protocol's technical surface (e.g. Uniswap or Compound)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm font-normal text-text-primary placeholder:text-[rgba(115,118,134,0.6)] focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3 rounded-md bg-accent-dark text-white text-sm font-bold tracking-[1px] hover:bg-blue-800 transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* The Trust Posture / Methodology Section */}
      <section className="bg-bg-muted">
        <div className="mx-auto max-w-7xl px-8 py-20">
          <p className="text-[10px] font-bold text-accent uppercase tracking-[1.5px] mb-4">
            The Methodology
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl font-bold text-text-primary tracking-heading-2">
                The Trust Posture
              </h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Protocol due diligence should not be static. Our dynamic Trust
                Posture maps multidimensional risk across five critical trust
                vectors in real-time without abstracting data into arbitrary
                scores.
              </p>

              <div className="mt-8 space-y-5">
                {methodologyItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="size-10 rounded bg-[#e7eefe] flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-accent-dark" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-md aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={trustPostureData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                  >
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#004ac6"
                      strokeOpacity={0.6}
                      fill="#004ac6"
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="mx-auto max-w-7xl px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[1.5px] mb-2">
              Institutional Intelligence
            </p>
            <h2 className="text-4xl font-bold text-text-primary tracking-heading-2">
              Recent Reports
            </h2>
          </div>
          <Link
            to="/protocols"
            className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
          >
            Browse Directory &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentProtocols.map((p) => {
            const tvl = p.totals.totalCapitalAtRisk
            const token =
              p.totals.totalTokenValue ?? p.totals.totalTokenValueAtRisk
            const tvs = tvl + token

            return (
              <Link
                key={p.slug}
                to={`/protocol/${p.slug}`}
                className="group rounded-lg border border-border bg-white p-8 hover:border-accent/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-[#e7eefe] flex items-center justify-center">
                      <img
                        src="/defiscan-mark-blue.svg"
                        alt=""
                        className="h-5 w-5"
                      />
                    </div>
                    <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {p.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                  {p.chain} &middot; {p.projectType}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>
                    TVS{' '}
                    <span className="font-semibold text-text-primary">
                      {formatUsdValue(tvs)}
                    </span>
                  </span>
                  <span>
                    Admins{' '}
                    <span className="font-semibold text-text-primary">
                      {p.totals.adminCount}
                    </span>
                  </span>
                  <span>
                    Deps{' '}
                    <span className="font-semibold text-text-primary">
                      {p.totals.dependencyCount}
                    </span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Onchain Evidence Section */}
      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Terminal */}
          <div className="rounded-lg bg-bg-dark p-8 font-mono text-[11px] leading-[16.5px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-status-green" />
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-white/40">
                Live On-Chain Trace
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="text-white/60">
                <span className="text-[#60a5fa]">verify_proxy_implementation</span>(
                <span className="text-[#60a5fa]">0x7a250...</span>)
              </div>
              <div className="text-white/60">
                &nbsp;&nbsp;{'>'} implementation_addr = 0xd99d1...{' '}
                <span className="text-[#85f8c4]">[MATCH]</span>
              </div>
              <div className="text-white/60">
                &nbsp;&nbsp;{'>'} storage_slot_integrity:{' '}
                <span className="text-[#85f8c4]">[MATCH]</span>
              </div>
              <div className="text-white/60">
                <span className="text-[#60a5fa]">check_timelock_status</span>(
                <span className="text-[#60a5fa]">0x1a9C8...</span>)
              </div>
              <div className="text-white/60">
                &nbsp;&nbsp;{'>'} delay:{' '}
                <span className="text-white">48_HOURS</span>
              </div>
              <div className="text-white/60">
                &nbsp;&nbsp;{'>'} admin: 0x5e4e65926BA27467555...
              </div>
              <div className="text-[#85f8c4] pt-2">
                {'>'} STATUS:{' '}
                <span className="font-bold">CONFIG_VALIDATED</span>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div>
            <h2 className="text-4xl font-bold text-text-primary tracking-heading-2">
              Untampered, Real-Time Onchain Evidence
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              We don&apos;t trust company statements. We trace the byte-code.
              Our monitoring agents crawl the chain 24/7 to ensure the
              &quot;Trust Posture&quot; hasn&apos;t shifted via a silent proxy
              upgrade.
            </p>

            <div className="mt-8 flex gap-12">
              <div>
                <div className="text-2xl font-bold text-accent-dark font-mono">
                  0.02s
                </div>
                <div className="text-[10px] text-text-muted uppercase tracking-[2px] mt-1">
                  Median Latency
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-dark font-mono">
                  100%
                </div>
                <div className="text-[10px] text-text-muted uppercase tracking-[2px] mt-1">
                  On-Chain Verifiable
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
      />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  )
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
      />
    </svg>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.732-3.558"
      />
    </svg>
  )
}
