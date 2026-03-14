import type { Logger } from '@l2beat/backend-tools'
import type { EthereumAddress } from '@l2beat/shared-pure'
import type { AggregateResponse } from '../../types/api'
import type { Cache } from '../../utils/cache'
import type { AggregateHandler } from './handlers/types'

export interface AggregateResult {
  data: AggregateResponse
  cached: boolean
}

export class AggregateService {
  private readonly handlers: Map<string, AggregateHandler>

  constructor(
    handlers: AggregateHandler[],
    private readonly cache: Cache<AggregateResponse>,
    private readonly logger: Logger,
  ) {
    this.handlers = new Map(handlers.map((h) => [h.name, h]))
  }

  getHandlerNames(): string[] {
    return [...this.handlers.keys()]
  }

  async getAggregate(
    contractAddress: EthereumAddress,
    handler: string,
    chainId?: string,
    forceRefresh?: boolean,
  ): Promise<AggregateResult> {
    const chain = chainId ?? 'eth'
    const cacheKey = `aggregate:${contractAddress}:${chain}:${handler}`

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.logger.info('CACHE HIT - Returning cached aggregate', {
          contractAddress,
          chain,
          handler,
        })
        return { data: cached, cached: true }
      }
    }

    const aggregateHandler = this.handlers.get(handler)
    if (!aggregateHandler) {
      this.logger.warn('Unknown aggregate handler requested', { handler })
      const empty: AggregateResponse = {
        contract_address: contractAddress.toString(),
        total_usd_value: 0,
        contract_count: 0,
        breakdown: [],
        timestamp: new Date().toISOString(),
        source: handler,
      }
      return { data: empty, cached: false }
    }

    this.logger.info('FETCHING - Getting aggregate data', {
      contractAddress,
      chain,
      handler,
    })

    const data = await aggregateHandler.fetch(contractAddress, chain)

    this.cache.set(cacheKey, data)
    return { data, cached: false }
  }
}
