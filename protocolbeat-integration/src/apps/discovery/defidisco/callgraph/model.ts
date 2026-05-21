// Pure types + helpers for the callgraph view.
// No React, no fetch — safe to import from anywhere.

import type {
  ApiCallGraphResponse,
  ApiAddressType,
  ContractCallGraph,
  ExternalCall,
} from '../../../../api/types'

/** Edge kinds rendered with distinct colors / dash patterns. */
export type EdgeKind =
  | 'internal'     // not currently emitted by the call-graph generator; reserved for user-added edges
  | 'external'     // ExternalCall with resolutionType === 'deterministic'
  | 'optimistic'   // ExternalCall with resolutionType === 'optimistic'
  | 'permissioned' // edge whose caller function is flagged isPermissioned in functions.json
  | 'delegatecall' // not currently emitted; reserved for future analysis
  | 'unresolved'   // ExternalCall without resolvedAddress

/** Visibility used for filtering and styling. */
export type FunctionVisibility =
  | 'external'
  | 'public'
  | 'internal'
  | 'private'

/** A node in the callgraph. id is either `${address}` (contract) or `${address}.${functionName}`. */
export interface CallNode {
  id: string
  contractAddress: string // chain-qualified, e.g. "eth:0x..."
  contractName: string
  contractType: ApiAddressType
  /** Discovery kind, derived from contract tags. */
  kind: 'project' | 'external' | 'eoa' | 'unknown'
  /** Function name, undefined when this is a contract-level node. */
  functionName?: string
  /** True for view/pure functions. */
  isView?: boolean
  /** True for permissioned functions (from functions.json). */
  isPermissioned?: boolean
}

/** An edge between two `CallNode.id`s. */
export interface CallEdge {
  id: string
  from: string
  to: string
  kind: EdgeKind
  /** True when this edge was added by the user (vs derived from the API). */
  user?: boolean
  /** Optional human label override. Defaults to the target function name. */
  label?: string
  /** True for state-changing calls that move value (best-effort). */
  carriesValue?: boolean
  /** Free-form note (e.g. resolution heuristic). */
  meta?: string
}

// ─────────────────── id helpers ───────────────────

export function nodeId(address: string, functionName?: string): string {
  return functionName ? `${address}.${functionName}` : address
}

export function parseNodeId(id: string): {
  address: string
  functionName?: string
} {
  // address can contain "eth:0x..." — split on the LAST "." so the chain prefix survives.
  const lastDot = id.lastIndexOf('.')
  if (lastDot === -1) return { address: id }
  const maybeFn = id.slice(lastDot + 1)
  const maybeAddr = id.slice(0, lastDot)
  // If the part after "." looks like an address suffix (hex), treat the whole thing as an address.
  if (/^[0-9a-fA-F]+$/.test(maybeFn) && maybeFn.length > 8) {
    return { address: id }
  }
  return { address: maybeAddr, functionName: maybeFn }
}

export function nodeContract(node: CallNode): string {
  return node.contractAddress
}

export function shortAddr(address: string): string {
  // "eth:0xabcd…1234" → "0xabcd…1234"; "0xabcd1234..." → "0xabcd…1234"
  const raw = address.includes(':') ? address.split(':')[1] : address
  if (!raw || raw.length < 12) return raw ?? address
  return `${raw.slice(0, 6)}…${raw.slice(-4)}`
}
