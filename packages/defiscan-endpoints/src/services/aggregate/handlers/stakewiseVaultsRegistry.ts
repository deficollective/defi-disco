import type { EthereumAddress } from '@l2beat/shared-pure'
import type { AggregateResponse } from '../../../types/api'
import type { AggregateHandler } from './types'

const DEFILLAMA_PROTOCOL_SLUG = 'stakewise'

// Maps the internal chain id (eth: / gnosis: prefixes) to the chain name
// DeFiLlama uses in its `currentChainTvls` map.
const CHAIN_ID_TO_DEFILLAMA_NAME: Record<string, string> = {
  eth: 'Ethereum',
  gnosis: 'Gnosis',
}

interface DefiLlamaProtocolResponse {
  name?: string
  currentChainTvls?: Record<string, number>
}

/**
 * Aggregate handler for the StakeWise V3 VaultsRegistry.
 *
 * Data source: DeFiLlama protocol API (`/protocol/stakewise`).
 *
 * Why an aggregate handler? StakeWise V3 is factory-deployed: the VaultsRegistry
 * tracks every vault created by EthVaultFactory (and other factories). Real ETH
 * stake sits inside each individual vault, not on the registry itself, so
 * `fetchBalances` on the registry returns nothing. DeBank's `fetchPositions`
 * does not enumerate factory-deployed vaults either. The single representative
 * vault we picked up during discovery is tagged for balances but only captures
 * one of many vaults.
 *
 * DeFiLlama's StakeWise adapter sums staked ETH across all V3 vaults plus the
 * Gnosis deployment, matching the figure shown on the protocol's own dashboard.
 *
 * Note: DeFiLlama doesn't expose a vault count, so `contract_count` is 0.
 */
export class StakewiseVaultsRegistryHandler implements AggregateHandler {
  name = 'stakewise-vaults-registry'

  async fetch(
    contractAddress: EthereumAddress,
    chain: string,
  ): Promise<AggregateResponse> {
    const chainName = CHAIN_ID_TO_DEFILLAMA_NAME[chain]
    if (!chainName) {
      throw new Error(
        `StakewiseVaultsRegistryHandler: unsupported chain "${chain}". Add it to CHAIN_ID_TO_DEFILLAMA_NAME.`,
      )
    }

    const url = `https://api.llama.fi/protocol/${DEFILLAMA_PROTOCOL_SLUG}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `DeFiLlama API returned ${response.status}: ${await response.text()}`,
      )
    }

    const data = (await response.json()) as DefiLlamaProtocolResponse
    const tvl = data.currentChainTvls?.[chainName] ?? 0

    return {
      contract_address: contractAddress.toString(),
      total_usd_value: tvl,
      contract_count: 0,
      breakdown: [],
      timestamp: new Date().toISOString(),
      source: `defillama-${DEFILLAMA_PROTOCOL_SLUG}`,
    }
  }
}
