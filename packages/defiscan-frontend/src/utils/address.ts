/**
 * Case-insensitive comparison of two addresses.
 * Handles chain-prefixed addresses (e.g. "eth:0xAbC...").
 */
export function addressesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}
