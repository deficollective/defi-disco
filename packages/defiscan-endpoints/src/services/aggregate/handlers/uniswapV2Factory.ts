import type { EthereumAddress } from '@l2beat/shared-pure'
import type { AggregateResponse } from '../../../types/api'
import type { AggregateHandler } from './types'

/**
 * Stub handler for Uniswap V2 factory contracts.
 * Returns hardcoded data for now — will be replaced with real
 * on-chain aggregation once the handler logic is implemented.
 */
export class UniswapV2FactoryHandler implements AggregateHandler {
  name = 'uniswap-v2-factory'

  async fetch(
    contractAddress: EthereumAddress,
    chain: string,
  ): Promise<AggregateResponse> {
    return {
      contract_address: contractAddress.toString(),
      total_usd_value: 1,
      contract_count: 2,
      breakdown: [
        {
          address: '0x0000000000000000000000000000000000000001',
          name: 'Stub Pair A',
          usd_value: 0.6,
        },
        {
          address: '0x0000000000000000000000000000000000000002',
          name: 'Stub Pair B',
          usd_value: 0.4,
        },
      ],
      timestamp: new Date().toISOString(),
      source: 'uniswap-v2-factory',
    }
  }
}
