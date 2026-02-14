import type { ReviewConfig, ReviewProjectType } from '../../../api/types'

const STABLECOIN_TEMPLATE: ReviewConfig = {
  protocolSlug: '',
  protocolName: '',
  tokenName: '',
  chain: 'Ethereum',
  projectType: 'stablecoin',
  sections: {
    collaterals: {
      title: 'Collaterals',
      description: 'Analysis of the protocol\'s backing collateral',
      subsections: [
        {
          title: 'Collateral Breakdown',
          content: [
            { type: 'text', content: '' },
          ],
        },
      ],
    },
    dependencies: {
      title: 'Dependencies',
      description: 'External protocol dependencies and oracle usage',
      subsections: [
        {
          title: 'Oracle Dependencies',
          content: [
            { type: 'text', content: '' },
          ],
        },
      ],
    },
    actors: {
      title: 'Actors',
      description: 'Governance, liquidators, and key participants',
      subsections: [
        {
          title: 'Governance',
          content: [
            { type: 'text', content: '' },
          ],
        },
      ],
    },
    codeAndAudits: {
      title: 'Code & Audits',
      description: 'Smart contract analysis and audit history',
      subsections: [
        {
          title: 'Contracts',
          content: [
            {
              type: 'expandableTable',
              headers: ['Name', 'Address', 'Tags'],
              rows: [],
            },
          ],
        },
        {
          title: 'Audits',
          content: [
            { type: 'text', content: '' },
          ],
        },
      ],
    },
  },
  dataKeys: {},
}

const TEMPLATES: Record<ReviewProjectType, ReviewConfig> = {
  stablecoin: STABLECOIN_TEMPLATE,
}

export function getReviewTemplate(
  projectType: ReviewProjectType,
): ReviewConfig {
  return JSON.parse(JSON.stringify(TEMPLATES[projectType])) as ReviewConfig
}

export const AVAILABLE_PROJECT_TYPES: ReviewProjectType[] = ['stablecoin']
