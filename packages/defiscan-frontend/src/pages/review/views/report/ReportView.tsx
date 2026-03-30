import { useNavigate, useSearchParams } from 'react-router-dom'
import type { CompiledReview } from '../../../../types'
import { HeroSection } from './HeroSection'
import { KeyFindingsCarousel } from './KeyFindingsCarousel'
import { TVSSection } from './TVSSection'
import { CodeQualitySection } from './CodeQualitySection'
import { AdminsSection } from './AdminsSection'
import { GovernanceSection } from './GovernanceSection'
import { DependenciesSection } from './DependenciesSection'
import { FrontendsSection } from './FrontendsSection'
import { ActivitySection } from './ActivitySection'

interface ReportViewProps {
  review: CompiledReview
  onExportPdf: () => void
}

export function ReportView({ review, onExportPdf }: ReportViewProps) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()

  function goToExplorerTab(tab: string) {
    setSearchParams({ view: 'explorer', tab }, { replace: true })
  }

  function goToActivity() {
    setSearchParams({ view: 'activity' }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-[80px] pb-24">
      {/* Hero */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <HeroSection review={review} onExportPdf={onExportPdf} />
      </section>

      {/* Key Findings */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <KeyFindingsCarousel review={review} />
      </section>

      {/* TVS */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <TVSSection review={review} onShowMore={() => goToExplorerTab('funds')} />
      </section>

      {/* Code Quality */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <CodeQualitySection review={review} />
      </section>

      {/* Active Admins */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <AdminsSection review={review} onShowMore={() => goToExplorerTab('admins')} />
      </section>

      {/* Governance */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <GovernanceSection review={review} onShowMore={() => goToExplorerTab('governance')} />
      </section>

      {/* Dependencies */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <DependenciesSection review={review} onShowMore={() => goToExplorerTab('dependencies')} />
      </section>

      {/* Frontends */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <FrontendsSection review={review} />
      </section>

      {/* Protocol Activity */}
      <section className="mx-auto w-full max-w-[1280px] px-8">
        <ActivitySection review={review} onShowMore={goToActivity} />
      </section>
    </div>
  )
}
