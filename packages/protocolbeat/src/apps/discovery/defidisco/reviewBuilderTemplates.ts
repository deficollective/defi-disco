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
            {
              type: 'dataTable',
              dataSource: 'funds.contractBalances',
              columns: [
                { field: 'contractName', header: 'Contract' },
                { field: 'address', header: 'Address', format: 'address' },
                { field: 'balancesTotal', header: 'Token Balance', format: 'usd' },
                { field: 'positionsTotal', header: 'DeFi Positions', format: 'usd' },
              ],
              filters: { excludeExternal: true, excludeTokens: true },
            },
          ],
        },
      ],
    },
    dependencies: {
      title: 'Dependencies',
      description: 'External protocol dependencies and oracle usage',
      subsections: [
        {
          title: 'Dependencies Overview',
          content: [
            {
              type: 'dataTable',
              dataSource: 'v2score.dependencies',
              columns: [
                { field: 'dependencyName', header: 'Name' },
                { field: 'dependencyAddress', header: 'Address', format: 'address' },
                { field: 'likelihood', header: 'Likelihood', format: 'badge' },
                { field: 'functionsCount', header: 'Functions Affected', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
    actors: {
      title: 'Actors',
      description: 'Governance, liquidators, and key participants',
      subsections: [
        {
          title: 'Protocol Actors',
          content: [
            {
              type: 'dataTable',
              dataSource: 'v2score.admins',
              columns: [
                { field: 'adminName', header: 'Name' },
                { field: 'adminAddress', header: 'Address', format: 'address' },
                { field: 'adminType', header: 'Type', format: 'badge' },
                { field: 'functionsCount', header: 'Functions', format: 'number' },
                { field: 'totalDirectCapital', header: 'Capital at Risk', format: 'usd' },
              ],
              filters: { excludeExternal: true, excludeImmutable: true },
            },
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
              type: 'dataTable',
              dataSource: 'project.contracts',
              columns: [
                { field: 'name', header: 'Name' },
                { field: 'address', header: 'Address', format: 'address' },
                { field: 'proxyType', header: 'Proxy Type', format: 'badge' },
              ],
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
