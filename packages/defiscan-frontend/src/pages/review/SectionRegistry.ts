import type { CompiledReview } from '../../types'
import { AdminsSection } from './sections/AdminsSection'
import { DependenciesSection } from './sections/DependenciesSection'
import { FundsSection } from './sections/FundsSection'
import { CodeAndAuditsSection } from './sections/CodeAndAuditsSection'
import { AnnexeSection } from './sections/AnnexeSection'

export type SectionComponent = React.FC<{ review: CompiledReview }>

export interface SectionDefinition {
  id: string
  title: string
  component: SectionComponent
}

const ALL_SECTIONS: Record<string, SectionDefinition> = {
  admins: { id: 'admins', title: 'Admins', component: AdminsSection },
  dependencies: {
    id: 'dependencies',
    title: 'Dependencies',
    component: DependenciesSection,
  },
  funds: { id: 'funds', title: 'Funds Overview', component: FundsSection },
  codeAndAudits: {
    id: 'codeAndAudits',
    title: 'Code & Audits',
    component: CodeAndAuditsSection,
  },
  annexe: { id: 'annexe', title: 'Annexe', component: AnnexeSection },
}

const DEFAULT_ORDER = [
  'admins',
  'dependencies',
  'funds',
  'codeAndAudits',
  'annexe',
]

const SECTION_ORDERS: Record<string, string[]> = {
  default: DEFAULT_ORDER,
  // Future per-type overrides:
  // lending: ['funds', 'admins', 'dependencies', 'codeAndAudits', 'annexe'],
}

export function getSectionsForType(projectType: string): SectionDefinition[] {
  const order = SECTION_ORDERS[projectType] ?? DEFAULT_ORDER
  return order
    .map((id) => ALL_SECTIONS[id])
    .filter((s): s is SectionDefinition => s !== undefined)
}
