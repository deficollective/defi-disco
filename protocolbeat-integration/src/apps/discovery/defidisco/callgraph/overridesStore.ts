// Client-side overrides for the callgraph view: user-added/removed edges and
// per-node researcher notes. Persisted to localStorage so a researcher's working
// state survives page reloads.
//
// This is a stopgap until the backend grows a `call-graph-overrides.json` writer.
// Move the persistence target to the API by swapping the `persist` middleware
// for a react-query mutation that reads/writes the override file.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CallEdge } from './model'

interface OverridesState {
  /** Project slug → user-added edges. */
  userEdges: Record<string, CallEdge[]>
  /** Project slug → set of edge ids removed by the user. Stored as array for JSON. */
  removedEdgeIds: Record<string, string[]>
  /** Project slug → node id → free-form note. */
  notes: Record<string, Record<string, string>>
  /** Project slug → contract addresses collapsed into a single node. */
  collapsedContracts: Record<string, string[]>

  addEdge: (project: string, edge: CallEdge) => void
  removeEdge: (project: string, edgeId: string) => void
  setNote: (project: string, nodeId: string, text: string) => void
  toggleCollapsed: (project: string, contract: string) => void
  setCollapsed: (project: string, contracts: string[]) => void
  resetProject: (project: string) => void
}

export const useCallgraphOverridesStore = create<OverridesState>()(
  persist(
    (set) => ({
      userEdges: {},
      removedEdgeIds: {},
      notes: {},
      collapsedContracts: {},

      addEdge: (project, edge) =>
        set((s) => ({
          userEdges: {
            ...s.userEdges,
            [project]: [...(s.userEdges[project] ?? []), edge],
          },
        })),

      removeEdge: (project, edgeId) =>
        set((s) => {
          const userList = s.userEdges[project] ?? []
          const stillUser = userList.filter((e) => e.id !== edgeId)
          // If it was a user edge, just drop it. If it was an API-derived edge,
          // record the removal in removedEdgeIds so the adapter knows to omit it.
          if (stillUser.length !== userList.length) {
            return {
              userEdges: { ...s.userEdges, [project]: stillUser },
            }
          }
          const removed = new Set(s.removedEdgeIds[project] ?? [])
          removed.add(edgeId)
          return {
            removedEdgeIds: {
              ...s.removedEdgeIds,
              [project]: Array.from(removed),
            },
          }
        }),

      setNote: (project, nodeId, text) =>
        set((s) => ({
          notes: {
            ...s.notes,
            [project]: { ...(s.notes[project] ?? {}), [nodeId]: text },
          },
        })),

      toggleCollapsed: (project, contract) =>
        set((s) => {
          const cur = new Set(s.collapsedContracts[project] ?? [])
          if (cur.has(contract)) cur.delete(contract)
          else cur.add(contract)
          return {
            collapsedContracts: {
              ...s.collapsedContracts,
              [project]: Array.from(cur),
            },
          }
        }),

      setCollapsed: (project, contracts) =>
        set((s) => ({
          collapsedContracts: { ...s.collapsedContracts, [project]: contracts },
        })),

      resetProject: (project) =>
        set((s) => ({
          userEdges: { ...s.userEdges, [project]: [] },
          removedEdgeIds: { ...s.removedEdgeIds, [project]: [] },
          notes: { ...s.notes, [project]: {} },
          collapsedContracts: { ...s.collapsedContracts, [project]: [] },
        })),
    }),
    { name: 'callgraph-overrides' },
  ),
)
