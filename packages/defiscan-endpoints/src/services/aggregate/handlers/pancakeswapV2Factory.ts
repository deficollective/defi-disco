import type { EthereumAddress } from '@l2beat/shared-pure'
import type { AggregateResponse } from '../../../types/api'
import type { AggregateHandler } from './types'

const DEFILLAMA_SLUG = 'pancakeswap-amm'
const BSC_RPC = 'https://bsc-dataseed.binance.org/'

// allPairsLength() selector
const ALL_PAIRS_LENGTH_DATA = '0x574f2ba3'

async function getPairCount(factoryAddress: string): Promise<number> {
  try {
    const response = await fetch(BSC_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: factoryAddress, data: ALL_PAIRS_LENGTH_DATA }, 'latest'],
        id: 1,
      }),
    })
    if (!response.ok) return 0
    const result = (await response.json()) as { result?: string }
    return result.result ? parseInt(result.result, 16) : 0
  } catch {
    return 0
  }
}

export class PancakeswapV2FactoryHandler implements AggregateHandler {
  name = 'pancakeswap-v2-factory'

  async fetch(
    contractAddress: EthereumAddress,
    _chain: string,
  ): Promise<AggregateResponse> {
    const [tvlResponse, pairCount] = await Promise.all([
      fetch(`https://api.llama.fi/tvl/${DEFILLAMA_SLUG}`),
      getPairCount(contractAddress.toString()),
    ])

    if (!tvlResponse.ok) {
      throw new Error(
        `DefiLlama API returned ${tvlResponse.status}: ${await tvlResponse.text()}`,
      )
    }

    const tvl = parseFloat(await tvlResponse.text())

    if (isNaN(tvl)) {
      throw new Error(`DefiLlama returned invalid TVL for ${DEFILLAMA_SLUG}`)
    }

    return {
      contract_address: contractAddress.toString(),
      total_usd_value: tvl,
      contract_count: pairCount,
      breakdown: [],
      timestamp: new Date().toISOString(),
      source: `defillama-${DEFILLAMA_SLUG}`,
    }
  }
}
