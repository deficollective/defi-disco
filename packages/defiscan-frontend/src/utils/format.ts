export function formatUsdValue(value: number): string {
  if (value === 0) return '$0'
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Strip the chain prefix from an address.
 * Works with any chain prefix (eth:, arb1:, base:, etc.).
 */
export function stripChainPrefix(address: string): string {
  const colonIdx = address.indexOf(':')
  if (colonIdx !== -1 && !address.startsWith('0x')) {
    return address.slice(colonIdx + 1)
  }
  return address
}

/**
 * Normalize an address for use as a lookup key (lowercase).
 */
export function normalizeForLookup(address: string): string {
  return address.toLowerCase()
}

export function truncateAddress(address: string): string {
  const raw = stripChainPrefix(address)
  if (raw.length <= 10) return raw
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`
}

/**
 * Map our internal chain prefix → block explorer base URL.
 * Extend as we add chain support.
 */
const EXPLORER_BASE_URL: Record<string, string> = {
  eth: 'https://etherscan.io',
  bnb: 'https://bscscan.com',
  arb1: 'https://arbiscan.io',
  base: 'https://basescan.org',
  op: 'https://optimistic.etherscan.io',
  matic: 'https://polygonscan.com',
  avax: 'https://snowtrace.io',
}

function getExplorerBase(value: string): string {
  const colonIdx = value.indexOf(':')
  if (colonIdx !== -1 && !value.startsWith('0x')) {
    const prefix = value.slice(0, colonIdx)
    return EXPLORER_BASE_URL[prefix] ?? EXPLORER_BASE_URL.eth
  }
  return EXPLORER_BASE_URL.eth
}

export function etherscanUrl(address: string): string {
  const raw = stripChainPrefix(address)
  return `${getExplorerBase(address)}/address/${raw}`
}

/**
 * Tx hashes from `$pastUpgrades` are stored without a chain prefix, so the
 * caller should pass a chain-prefixed `chainContext` (typically the contract
 * address the event belongs to) to pick the right explorer.
 */
export function etherscanTxUrl(txHash: string, chainContext?: string): string {
  const raw = stripChainPrefix(txHash)
  const base = getExplorerBase(chainContext ?? txHash)
  return `${base}/tx/${raw}`
}
