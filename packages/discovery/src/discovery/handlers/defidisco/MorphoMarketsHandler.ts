import { ChainSpecificAddress } from '@l2beat/shared-pure'
import { utils } from 'ethers'
import { v } from '@l2beat/validate'

import type { ContractValue } from '../../output/types'
import type { IProvider } from '../../provider/IProvider'
import type { Handler, HandlerResult } from '../Handler'
import { generateReferenceInput, resolveReference } from '../reference'
import { toContractValue } from '../utils/toContractValue'

export type MorphoMarketsHandlerDefinition = v.infer<
  typeof MorphoMarketsHandlerDefinition
>
export const MorphoMarketsHandlerDefinition = v.strictObject({
  type: v.literal('morphoMarkets'),
  // Field name containing the Morpho Blue core contract address (e.g. "MORPHO")
  morphoAddressField: v.string().optional(),
  // Direct Morpho Blue address (chain-specific, e.g. "eth:0xBBBB...")
  morphoAddress: v.string().optional(),
  // Field name containing the supply queue market IDs array (default: "supplyQueue")
  queueField: v.string().optional(),
  // Extract only specific address fields from a previously computed marketParams result.
  // When set, reads from previousResults[sourceField] instead of making RPC calls.
  // Use this for a second config field that follows only certain addresses (e.g. "oracle").
  extractField: v.string().optional(),
  // The field name to read cached market data from (used with extractField, default: "marketParams")
  sourceField: v.string().optional(),
  ignoreRelative: v.boolean().optional(),
  // In fetch mode: also call expectedSupplyAssets(marketId) on the adapter (current
  // contract) and include it in each market object. Returns the USDC value currently
  // deployed in that market — reliable even after supplyShares bookkeeping is reset.
  fetchExpectedAssets: v.boolean().optional(),
  // In fetch mode: also call vault.absoluteCap(capId) per market and store the result.
  // capId = keccak256(abi.encode("this/marketParams", adapterAddress, marketParams)).
  // Requires vaultAddress or vaultAddressField to resolve the vault contract.
  fetchAbsoluteCap: v.boolean().optional(),
  // Direct vault address for fetchAbsoluteCap (chain-specific, e.g. "eth:0x...").
  vaultAddress: v.string().optional(),
  // Field name on the current contract whose value is the vault address (auto-discovered
  // fields like "parentVault" work here since system handlers run before custom ones).
  vaultAddressField: v.string().optional(),
  // In extract mode: skip markets whose `expectedAssets` field is below this threshold.
  // Requires that the sourceField data was fetched with fetchExpectedAssets: true.
  // Use a small positive value (e.g. 1000000 for $1 in USDC 6-decimal) to filter dust.
  minAssetsThreshold: v.number().optional(),
  // In extract mode: instead of returning an array of values, return a map keyed by this
  // field from each market entry (e.g. "oracle" → { "0x<oracle>": <extractField value> }).
  // Useful for building per-oracle or per-market lookup maps in discovered.json.
  keyByField: v.string().optional(),
})

const ID_TO_MARKET_PARAMS_ABI =
  'function idToMarketParams(bytes32) view returns (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)'

const EXPECTED_SUPPLY_ASSETS_ABI =
  'function expectedSupplyAssets(bytes32) view returns (uint256)'

const ABSOLUTE_CAP_ABI = 'function absoluteCap(bytes32) view returns (uint256)'

export class MorphoMarketsHandler implements Handler {
  readonly dependencies: string[] = []

  constructor(
    readonly field: string,
    private readonly definition: MorphoMarketsHandlerDefinition,
    _abi: string[],
  ) {
    if (definition.extractField) {
      // Extract mode: depend on the source field (where market data was already fetched)
      this.dependencies.push(definition.sourceField ?? 'marketParams')
    } else {
      // Fetch mode: depend on the queue field and morpho address field
      const queueField = definition.queueField ?? 'supplyQueue'
      this.dependencies.push(queueField)

      if (definition.morphoAddressField) {
        this.dependencies.push(definition.morphoAddressField)
      }
      if (definition.fetchAbsoluteCap && definition.vaultAddressField) {
        this.dependencies.push(definition.vaultAddressField)
      }
    }
  }

  getMethod(): string {
    return 'morphoMarkets'
  }

  async execute(
    provider: IProvider,
    address: ChainSpecificAddress,
    previousResults: Record<string, HandlerResult | undefined>,
  ): Promise<HandlerResult> {
    // Extract mode: read from previously computed market data
    if (this.definition.extractField) {
      return this.executeExtract(previousResults)
    }

    // Fetch mode: make RPC calls to get market params
    return this.executeFetch(provider, address, previousResults)
  }

  private executeExtract(
    previousResults: Record<string, HandlerResult | undefined>,
  ): HandlerResult {
    const sourceField = this.definition.sourceField ?? 'marketParams'
    const extractField = this.definition.extractField!
    const sourceResult = previousResults[sourceField]

    if (!sourceResult || !Array.isArray(sourceResult.value)) {
      return {
        field: this.field,
        error: `Cannot read market data from "${sourceField}"`,
      }
    }

    // keyByField mode: output a map keyed by a field from each market entry instead of
    // an array. Useful for building per-oracle lookup maps (e.g. absoluteCapByOracle).
    if (this.definition.keyByField) {
      const keyField = this.definition.keyByField
      const map: Record<string, ContractValue> = {}
      for (const market of sourceResult.value) {
        if (
          typeof market === 'object' &&
          market !== null &&
          !Array.isArray(market)
        ) {
          const m = market as Record<string, ContractValue>
          if (
            this.definition.minAssetsThreshold !== undefined &&
            Number(m['expectedAssets'] ?? 0) <
              this.definition.minAssetsThreshold
          ) {
            continue
          }
          const key = m[keyField]
          const val = m[extractField]
          if (typeof key === 'string' && val !== undefined) {
            map[key] = val
          }
        }
      }
      return {
        field: this.field,
        value: map,
        ignoreRelative: this.definition.ignoreRelative,
      }
    }

    // Default: extract the specified field from each market entry as an array
    const addresses: ContractValue[] = []
    for (const market of sourceResult.value) {
      if (
        typeof market === 'object' &&
        market !== null &&
        !Array.isArray(market)
      ) {
        const m = market as Record<string, ContractValue>
        // Skip markets below the minimum assets threshold
        if (
          this.definition.minAssetsThreshold !== undefined &&
          Number(m['expectedAssets'] ?? 0) < this.definition.minAssetsThreshold
        ) {
          continue
        }
        const addr = m[extractField]
        if (typeof addr === 'string') {
          addresses.push(addr)
        }
      }
    }

    return {
      field: this.field,
      value: addresses,
      ignoreRelative: this.definition.ignoreRelative,
    }
  }

  private async executeFetch(
    provider: IProvider,
    address: ChainSpecificAddress,
    previousResults: Record<string, HandlerResult | undefined>,
  ): Promise<HandlerResult> {
    const referenceInput = generateReferenceInput(
      previousResults,
      provider,
      address,
    )

    // Resolve the Morpho Blue address
    let morphoAddress: ChainSpecificAddress
    if (this.definition.morphoAddress) {
      morphoAddress = ChainSpecificAddress(this.definition.morphoAddress)
    } else {
      const fieldName = this.definition.morphoAddressField ?? 'MORPHO'
      const rawAddress = resolveReference(`{{ ${fieldName} }}`, referenceInput)
      if (typeof rawAddress !== 'string') {
        return {
          field: this.field,
          error: `Cannot resolve Morpho address from field "${fieldName}"`,
        }
      }
      // The raw value from handler results is just "0x..." without chain prefix
      // We need to add the chain prefix from the current contract
      const chain = ChainSpecificAddress.chain(address)
      morphoAddress = ChainSpecificAddress(`${chain}:${rawAddress}`)
    }

    // Resolve vault address for absoluteCap lookup (optional)
    let vaultAddr: ChainSpecificAddress | undefined
    if (this.definition.fetchAbsoluteCap) {
      if (this.definition.vaultAddress) {
        vaultAddr = ChainSpecificAddress(this.definition.vaultAddress)
      } else if (this.definition.vaultAddressField) {
        const fieldName = this.definition.vaultAddressField
        const rawVault = resolveReference(`{{ ${fieldName} }}`, referenceInput)
        if (typeof rawVault === 'string') {
          const chain = ChainSpecificAddress.chain(address)
          // Raw value may already include chain prefix (auto-discovered fields sometimes do)
          vaultAddr = rawVault.includes(':')
            ? ChainSpecificAddress(rawVault)
            : ChainSpecificAddress(`${chain}:${rawVault}`)
        }
      }
    }

    // Resolve the supply queue
    const queueField = this.definition.queueField ?? 'supplyQueue'
    const queueResult = previousResults[queueField]
    if (!queueResult || queueResult.error) {
      return {
        field: this.field,
        error: `Cannot resolve supply queue from field "${queueField}": ${queueResult?.error ?? 'missing'}`,
      }
    }

    const queue = queueResult.value
    if (!Array.isArray(queue)) {
      return {
        field: this.field,
        error: `Expected array for "${queueField}", got ${typeof queue}`,
      }
    }

    const rawAdapterAddress = ChainSpecificAddress.address(address)

    // For each market ID, call idToMarketParams on the Morpho contract
    const markets: ContractValue[] = []
    for (const marketId of queue) {
      if (typeof marketId !== 'string') {
        markets.push({ error: `Invalid market ID: ${marketId}` })
        continue
      }

      try {
        const fetchCalls: [
          Promise<unknown[] | undefined>,
          Promise<unknown | undefined>?,
        ] = [
          provider.callMethod<unknown[]>(
            morphoAddress,
            ID_TO_MARKET_PARAMS_ABI,
            [marketId],
          ),
        ]
        // Optionally fetch expectedSupplyAssets(marketId) from the adapter (current contract)
        if (this.definition.fetchExpectedAssets) {
          fetchCalls.push(
            provider.callMethod<unknown>(address, EXPECTED_SUPPLY_ASSETS_ABI, [
              marketId,
            ]),
          )
        }
        const [paramsResult, sharesResult] = await Promise.all(fetchCalls)

        if (paramsResult === undefined) {
          markets.push({ marketId, error: 'Execution reverted' })
          continue
        }

        const value = toContractValue(paramsResult)
        if (Array.isArray(value) && value.length === 5) {
          const entry: Record<string, ContractValue> = {
            marketId: marketId as ContractValue,
            loanToken: value[0]!,
            collateralToken: value[1]!,
            oracle: value[2]!,
            irm: value[3]!,
            lltv: value[4]!,
          }
          if (sharesResult !== undefined) {
            const assetsValue = toContractValue(sharesResult)
            entry['expectedAssets'] =
              typeof assetsValue === 'number' || typeof assetsValue === 'bigint'
                ? Number(assetsValue)
                : 0
          }

          // Optionally fetch vault.absoluteCap(capId) where
          // capId = keccak256(abi.encode("this/marketParams", adapterAddress, marketParams))
          if (vaultAddr && paramsResult.length === 5) {
            try {
              const capId = utils.keccak256(
                utils.defaultAbiCoder.encode(
                  [
                    'string',
                    'address',
                    'tuple(address,address,address,address,uint256)',
                  ],
                  [
                    'this/marketParams',
                    rawAdapterAddress,
                    [
                      paramsResult[0],
                      paramsResult[1],
                      paramsResult[2],
                      paramsResult[3],
                      paramsResult[4],
                    ],
                  ],
                ),
              )
              const capResult = await provider.callMethod<unknown>(
                vaultAddr,
                ABSOLUTE_CAP_ABI,
                [capId],
              )
              if (capResult !== undefined) {
                const capValue = toContractValue(capResult)
                entry['absoluteCap'] =
                  typeof capValue === 'number'
                    ? capValue
                    : capValue !== undefined
                      ? Number(String(capValue))
                      : 0
              }
            } catch {
              // Non-fatal: absoluteCap fetch failure doesn't break the whole result
            }
          }

          markets.push(entry)
        } else {
          markets.push({ marketId, raw: value })
        }
      } catch (e) {
        markets.push({
          marketId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return {
      field: this.field,
      value: markets,
      ignoreRelative: this.definition.ignoreRelative,
    }
  }
}
