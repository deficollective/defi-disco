// Adapter: ApiCallGraphResponse + ApiProjectResponse (+ optional ApiFunctionsResponse)
//          ────────────────────────────────────────────────────────────────────────►
//          { nodes: Map<id, CallNode>, edges: CallEdge[] } for the callgraph view.
//
// This is the only place that knows the API shape. Everything downstream operates
// on the normalized {CallNode, CallEdge} model in ./model.ts.

import type {
  ApiCallGraphResponse,
  ApiFunctionsResponse,
  ApiProjectResponse,
  ContractCallGraph,
  ExternalCall,
  FunctionEntry,
} from '../../../../api/types'
import { type CallEdge, type CallNode, type EdgeKind, nodeId } from './model'

interface BuildArgs {
  callGraph: ApiCallGraphResponse
  project: ApiProjectResponse
  /** Optional. When provided we mark caller functions as `permissioned`. */
  functions?: ApiFunctionsResponse
  /** Edges added by the user (from the overrides store). */
  userEdges?: CallEdge[]
  /** IDs of edges removed by the user. */
  removedEdgeIds?: Set<string>
}

interface BuildResult {
  nodes: Map<string, CallNode>
  edges: CallEdge[]
  /** Entrypoint functions, useful for the StartPicker. */
  entrypoints: { id: string; node: CallNode }[]
}

export function buildCallgraph(args: BuildArgs): BuildResult {
  const { callGraph, project, functions, userEdges = [], removedEdgeIds } = args

  // ── 1. Build the node map from the discovery payload ─────────────────────
  const nodes = new Map<string, CallNode>()

  for (const chain of project.entries) {
    const allContracts = [...chain.initialContracts, ...chain.discoveredContracts]
    for (const c of allContracts) {
      nodes.set(c.address, {
        id: c.address,
        contractAddress: c.address,
        contractName: c.name ?? shortLabel(c.address),
        contractType: c.type,
        // initialContracts are the project's own; discoveredContracts include externals.
        // Without contract-tags we treat all discovered as 'project' unless the type
        // says otherwise (EOA / Unknown / Token can hint).
        kind: c.type === 'EOA' || c.type === 'EOAPermissioned'
          ? 'eoa'
          : chain.initialContracts.includes(c) ? 'project' : 'external',
      })
    }
    for (const eoa of chain.eoas) {
      nodes.set(eoa.address, {
        id: eoa.address,
        contractAddress: eoa.address,
        contractName: eoa.name ?? shortLabel(eoa.address),
        contractType: eoa.type,
        kind: 'eoa',
      })
    }
  }

  // Pull function metadata (visibility, permissioned) from functions.json if present.
  const permissionedSet = new Set<string>()
  if (functions) {
    for (const [addr, c] of Object.entries(functions.contracts)) {
      for (const fn of c.functions) {
        if (fn.isPermissioned) permissionedSet.add(nodeId(addr, fn.functionName))
      }
    }
  }

  // ── 2. Walk every ExternalCall and emit edges + function-level nodes ─────
  const edges: CallEdge[] = []

  for (const c of Object.values(callGraph.contracts)) {
    // Ensure the caller contract has a node (it should, from the project payload).
    if (!nodes.has(c.address)) {
      nodes.set(c.address, {
        id: c.address,
        contractAddress: c.address,
        contractName: c.name ?? shortLabel(c.address),
        contractType: 'Contract',
        kind: 'project',
      })
    }
    if (c.skipped || c.error) continue

    for (let i = 0; i < c.externalCalls.length; i++) {
      const call = c.externalCalls[i]
      const callerNodeId = ensureFunctionNode(nodes, c.address, call.callerFunction, {
        isView: call.callerIsView,
        isPermissioned: permissionedSet.has(nodeId(c.address, call.callerFunction)),
      })

      // Unresolved: synthesise a placeholder destination keyed by interface + variable.
      if (!call.resolvedAddress) {
        const placeholderAddr = `unresolved:${call.interfaceType}:${call.storageVariable}`
        if (!nodes.has(placeholderAddr)) {
          nodes.set(placeholderAddr, {
            id: placeholderAddr,
            contractAddress: placeholderAddr,
            contractName: call.interfaceType,
            contractType: 'Unknown',
            kind: 'unknown',
          })
        }
        const calleeNodeId = ensureFunctionNode(
          nodes,
          placeholderAddr,
          call.calledFunction,
          { isView: call.isViewCall },
        )
        edges.push({
          id: `e:${c.address}.${call.callerFunction}->${placeholderAddr}.${call.calledFunction}#${i}`,
          from: callerNodeId,
          to: calleeNodeId,
          kind: 'unresolved',
          meta: call.storageVariable,
        })
        continue
      }

      // Ensure the resolved contract is in the node map (the discovery payload
      // doesn't always cover it — e.g. external integrations).
      if (!nodes.has(call.resolvedAddress)) {
        nodes.set(call.resolvedAddress, {
          id: call.resolvedAddress,
          contractAddress: call.resolvedAddress,
          contractName: call.resolvedContractName ?? call.interfaceType,
          contractType: 'Contract',
          kind: 'external',
        })
      }
      const calleeNodeId = ensureFunctionNode(
        nodes,
        call.resolvedAddress,
        call.calledFunction,
        { isView: call.isViewCall },
      )

      const kind: EdgeKind = permissionedSet.has(callerNodeId)
        ? 'permissioned'
        : call.resolutionType === 'optimistic'
          ? 'optimistic'
          : 'external'

      edges.push({
        id: `e:${c.address}.${call.callerFunction}->${call.resolvedAddress}.${call.calledFunction}#${i}`,
        from: callerNodeId,
        to: calleeNodeId,
        kind,
        carriesValue: call.isViewCall === false,
        meta: call.resolutionHeuristic,
      })
    }
  }

  // ── 3. Layer in user overrides ───────────────────────────────────────────
  const finalEdges = edges
    .filter((e) => !removedEdgeIds?.has(e.id))
    .concat(userEdges.map((e) => ({ ...e, user: true })))

  // ── 4. Build entrypoints list (non-EOA function nodes) ───────────────────
  const entrypoints: BuildResult['entrypoints'] = []
  for (const n of nodes.values()) {
    if (!n.functionName) continue
    if (n.kind === 'eoa') continue
    entrypoints.push({ id: n.id, node: n })
  }
  entrypoints.sort((a, b) => {
    if (a.node.kind !== b.node.kind) return a.node.kind === 'project' ? -1 : 1
    return a.id.localeCompare(b.id)
  })

  return { nodes, edges: finalEdges, entrypoints }
}

function ensureFunctionNode(
  nodes: Map<string, CallNode>,
  address: string,
  functionName: string,
  extra: { isView?: boolean; isPermissioned?: boolean } = {},
): string {
  const id = nodeId(address, functionName)
  if (nodes.has(id)) {
    // Merge any newly-available flags.
    const existing = nodes.get(id)!
    if (extra.isView !== undefined) existing.isView = existing.isView ?? extra.isView
    if (extra.isPermissioned) existing.isPermissioned = true
    return id
  }
  const parent = nodes.get(address)
  if (!parent) {
    // Should not happen — caller always seeds the contract node first.
    return id
  }
  nodes.set(id, {
    id,
    contractAddress: address,
    contractName: parent.contractName,
    contractType: parent.contractType,
    kind: parent.kind,
    functionName,
    isView: extra.isView,
    isPermissioned: extra.isPermissioned,
  })
  return id
}

function shortLabel(addr: string): string {
  const raw = addr.includes(':') ? addr.split(':')[1] : addr
  return raw && raw.length >= 8 ? `${raw.slice(0, 6)}…${raw.slice(-4)}` : addr
}
