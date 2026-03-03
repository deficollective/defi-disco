import type { CompiledReview } from '../../types'
import { KeyFindings } from './sections/KeyFindings'
import { NarrativeAdmins } from './sections/NarrativeAdmins'
import { NarrativeDependencies } from './sections/NarrativeDependencies'
import { NarrativeFunds } from './sections/NarrativeFunds'
import { NarrativeCodeAndAudits } from './sections/NarrativeCodeAndAudits'
import { NarrativeAnnexe } from './sections/NarrativeAnnexe'

export type SectionComponent = React.FC<{ review: CompiledReview }>

export interface SectionDefinition {
  id: string
  title: string
  component: SectionComponent
}

const ALL_SECTIONS: Record<string, SectionDefinition> = {
  keyFindings: {
    id: 'keyFindings',
    title: 'Key Findings',
    component: KeyFindings,
  },
  admins: {
    id: 'admins',
    title: 'Who Controls It?',
    component: NarrativeAdmins,
  },
  funds: {
    id: 'funds',
    title: 'How Much Is at Stake?',
    component: NarrativeFunds,
  },
  dependencies: {
    id: 'dependencies',
    title: 'What Does It Depend On?',
    component: NarrativeDependencies,
  },
  codeAndAudits: {
    id: 'codeAndAudits',
    title: 'Code & Contracts',
    component: NarrativeCodeAndAudits,
  },
  annexe: {
    id: 'annexe',
    title: 'Full Technical Reference',
    component: NarrativeAnnexe,
  },
}

const DEFAULT_ORDER = [
  'keyFindings',
  'admins',
  'funds',
  'dependencies',
  'codeAndAudits',
  'annexe',
]

const SECTION_ORDERS: Record<string, string[]> = {
  default: DEFAULT_ORDER,
}

export function getSectionsForType(projectType: string): SectionDefinition[] {
  const order = SECTION_ORDERS[projectType] ?? DEFAULT_ORDER
  return order
    .map((id) => ALL_SECTIONS[id])
    .filter((s): s is SectionDefinition => s !== undefined)
}
