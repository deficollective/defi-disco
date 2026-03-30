import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { CompiledReview } from '../../../../types'
import { ShareButton } from '../../../../components/ShareButton'

interface HeroSectionProps {
  review: CompiledReview
  onExportPdf: () => void
}

const RADAR_AXES = ['CONTROL', 'DEPENDENCIES', 'ACCESS', 'VERIFIABILITY', 'ABILITY TO EXIT']

// Derive a rough trust posture shape from available data.
// These are visual approximations — not scored metrics.
function deriveRadarData(review: CompiledReview) {
  const { admins, dependencies, totals } = review

  const hasEOA = admins.some((a) => a.adminType === 'EOA' || a.adminType === 'EOAPermissioned')
  const hasMultisig = admins.some((a) => a.adminType === 'Multisig')
  const isImmutable = admins.length > 0 && admins.every((a) => a.adminType === 'Immutable' || a.adminType === 'Revoked')
  const depCount = dependencies.length

  const control = isImmutable ? 90 : hasEOA ? 25 : hasMultisig ? 55 : 70
  const deps = depCount === 0 ? 90 : depCount <= 2 ? 70 : depCount <= 5 ? 50 : 30
  const access = isImmutable ? 90 : hasEOA ? 20 : hasMultisig ? 60 : 75
  const verifiability = totals.contractCount > 0 ? 75 : 50
  const exit = 65

  return [
    { axis: 'CONTROL', value: control },
    { axis: 'DEPENDENCIES', value: deps },
    { axis: 'ACCESS', value: access },
    { axis: 'VERIFIABILITY', value: verifiability },
    { axis: 'ABILITY TO EXIT', value: exit },
  ]
}

export function HeroSection({ review, onExportPdf }: HeroSectionProps) {
  const { metadata, compiledAt } = review
  const radarData = deriveRadarData(review)

  const updateDate = compiledAt
    ? new Date(compiledAt).toLocaleDateString('en-CA').replace(/-/g, '.')
    : '—'

  return (
    <div className="grid grid-cols-12 gap-12 items-center min-h-[450px]">
      {/* Left: text + buttons */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center py-20">
        {/* Badge + date row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-capital text-white px-[10px] py-[2px] rounded-sm text-[10px] font-bold uppercase tracking-[0.5px]">
            Verified
          </span>
          <span className="font-mono text-xs text-text-muted uppercase">
            Updated: {updateDate}
          </span>
        </div>

        {/* Protocol name */}
        <h1 className="font-bold text-[48px] leading-[48px] tracking-[-1.2px] text-text-primary mb-4">
          {metadata.protocolName}
        </h1>

        {/* Description */}
        <p className="text-[18px] font-normal text-text-muted leading-[29px] max-w-[448px] mb-8">
          {metadata.description}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 bg-accent text-white px-6 py-[13px] rounded-sm font-semibold text-base hover:bg-accent-dark transition-colors"
            onClick={() => window.open(`https://defiscan.info/protocol/${metadata.protocolSlug}`, '_blank')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Subscribe
          </button>
          <ShareButton review={review} onExportPdf={onExportPdf} />
        </div>
      </div>

      {/* Right: radar chart */}
      <div className="col-span-12 lg:col-span-7 h-[450px] relative">
        <div className="absolute inset-0 rounded-lg border border-border bg-bg-card overflow-hidden">
          {/* Radial gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0) 70%)',
            }}
          />
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              cx="50%"
              cy="50%"
              outerRadius="62%"
            >
              <PolarGrid stroke="rgba(37,99,235,0.1)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600, letterSpacing: 1 }}
              />
              <Radar
                dataKey="value"
                stroke="#2563eb"
                strokeOpacity={0.8}
                fill="#2563eb"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Keep axes accessible for tests/storybook
export { RADAR_AXES }
