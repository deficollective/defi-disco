// Frontend mirror of the backend rule engine (callGraphOverrides.ts). Applies
// EdgeOverrideRules to the walker's CallEdge[] so the rendered graph matches what
// capital/governance analysis sees. The backend applies the same rules file
// independently inside buildEnhancedGraph — this is the display-side twin.
//
// Adding a rule type: add the variant in api/types.ts, then a case here and a
// handler in the backend RULE_HANDLERS. Nothing else.

import type { EdgeOverrideRule } from '../../../../api/types'
import { addressesEqual } from '../addressUtils'
import {
  type BackendEdgeType,
  type CallEdge,
  edgeKey,
  parseNodeId,
} from './model'

/** Does node ref `ref` match the (address, fn) end of an edge? A contract-level
 *  ref (no `.function`) matches every function on that contract. */
function nodeMatches(
  ref: string,
  address: string,
  fn: string | undefined,
): boolean {
  const p = parseNodeId(ref)
  if (!addressesEqual(p.address, address)) return false
  if (p.functionName === undefined) return true
  return p.functionName === fn
}

function fromMatches(e: CallEdge, ref: string): boolean {
  const p = parseNodeId(e.from)
  return nodeMatches(ref, p.address, p.functionName)
}

function toMatches(e: CallEdge, ref: string): boolean {
  const p = parseNodeId(e.to)
  return nodeMatches(ref, p.address, p.functionName)
}

function kindForEdgeType(edgeType: BackendEdgeType): CallEdge['kind'] {
  return edgeType === 'permission'
    ? 'permission'
    : edgeType === 'dependency'
      ? 'dependency'
      : 'external'
}

/** Apply override rules to the walker edge set, in order. Pure. */
export function applyRulesToCallEdges(
  edges: CallEdge[],
  rules: EdgeOverrideRule[],
): CallEdge[] {
  let current = edges
  for (const rule of rules) {
    if (rule.enabled === false) continue
    switch (rule.type) {
      case 'addEdge':
        current = [
          ...current,
          {
            id: edgeKey(rule.from, rule.to, rule.edgeType),
            from: rule.from,
            to: rule.to,
            kind: kindForEdgeType(rule.edgeType),
            edgeType: rule.edgeType,
            user: true,
          },
        ]
        break
      case 'removeEdge':
        current = current.filter(
          (e) =>
            !(
              e.edgeType === rule.edgeType &&
              fromMatches(e, rule.from) &&
              toMatches(e, rule.to)
            ),
        )
        break
      case 'removeOutgoing':
        current = current.filter(
          (e) =>
            !(
              (rule.edgeType === undefined || e.edgeType === rule.edgeType) &&
              fromMatches(e, rule.node)
            ),
        )
        break
      case 'removeIncoming':
        current = current.filter(
          (e) =>
            !(
              (rule.edgeType === undefined || e.edgeType === rule.edgeType) &&
              toMatches(e, rule.node)
            ),
        )
        break
    }
  }
  return current
}

// ── Per-edge rule lookups (for the sidebar's toggle / restore actions) ──────

/** The exact `removeEdge` rule suppressing this edge, if any (1:1, restorable). */
export function findRemoveEdgeRule(
  rules: EdgeOverrideRule[],
  edge: CallEdge,
): EdgeOverrideRule | undefined {
  return rules.find(
    (r) =>
      r.enabled !== false &&
      r.type === 'removeEdge' &&
      r.edgeType === edge.edgeType &&
      fromMatches(edge, r.from) &&
      toMatches(edge, r.to),
  )
}

/** The `addEdge` rule that created this edge, if any. */
export function findAddEdgeRule(
  rules: EdgeOverrideRule[],
  edge: CallEdge,
): EdgeOverrideRule | undefined {
  return rules.find(
    (r) =>
      r.type === 'addEdge' &&
      r.from === edge.from &&
      r.to === edge.to &&
      r.edgeType === edge.edgeType,
  )
}

/** Bulk rules (removeOutgoing/removeIncoming) that suppress this edge. These
 *  can't be undone per-edge — the whole rule must be removed (in the Rules tab). */
export function findBulkSuppressors(
  rules: EdgeOverrideRule[],
  edge: CallEdge,
): EdgeOverrideRule[] {
  return rules.filter((r) => {
    if (r.enabled === false) return false
    if (r.type === 'removeOutgoing') {
      return (
        (r.edgeType === undefined || r.edgeType === edge.edgeType) &&
        fromMatches(edge, r.node)
      )
    }
    if (r.type === 'removeIncoming') {
      return (
        (r.edgeType === undefined || r.edgeType === edge.edgeType) &&
        toMatches(edge, r.node)
      )
    }
    return false
  })
}

/** Stable-ish unique id for a new rule. */
export function makeRuleId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Human-readable one-liner for a rule (used in the Rules list). */
export function describeRule(rule: EdgeOverrideRule): string {
  switch (rule.type) {
    case 'addEdge':
      return `add ${rule.edgeType}: ${shortRef(rule.from)} → ${shortRef(rule.to)}`
    case 'removeEdge':
      return `remove ${rule.edgeType}: ${shortRef(rule.from)} → ${shortRef(rule.to)}`
    case 'removeOutgoing':
      return `remove ${rule.edgeType ?? 'all'} outgoing from ${shortRef(rule.node)}`
    case 'removeIncoming':
      return `remove ${rule.edgeType ?? 'all'} incoming to ${shortRef(rule.node)}`
  }
}

function shortRef(ref: string): string {
  const { address, functionName } = parseNodeId(ref)
  const raw = address.includes(':')
    ? (address.split(':')[1] ?? address)
    : address
  const short = raw.length >= 10 ? `${raw.slice(0, 6)}…${raw.slice(-4)}` : raw
  return functionName ? `${short}.${functionName}` : short
}
