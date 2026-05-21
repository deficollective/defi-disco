// Main canvas: starting-function picker → tree of fan-out edges & nodes.
//
// State ownership:
//   - startId / depth / selected / hoveredEdge / drag             → useState (local)
//   - layoutMode / filters / editMode                              → useState (local)
//   - userEdges / removedEdgeIds / collapsedContracts / notes      → zustand (persisted per project)
//
// Cross-panel wiring: clicking a node fires usePanelStore.select(address) so the
// Code / Values / Config panels follow along; double-click + the "open in code"
// action also flip the Code panel active and call useCodeStore.showRange via
// findAllFunctionOccurrences (same helper already used by the legacy list view).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getCallGraphData, getCode, getProject } from '../../../../../api/api'
import { useCodeStore } from '../../../../../components/editor/store'
import { useMultiViewStore } from '../../../multi-view/store'
import { usePanelStore } from '../../../store/panel-store'

import { buildCallgraph } from '../buildCallgraph'
import { computeLayout, findPathToNode, type LayoutMode, nodeHeight } from '../layout'
import { type CallEdge, parseNodeId } from '../model'
import { useCallgraphOverridesStore } from '../overridesStore'

import { ArrowDefs, EdgePath } from './EdgePath'
import { Controls } from './Controls'
import { DetailSidebar } from './DetailSidebar'
import { Node } from './Node'
import { StartPicker } from './StartPicker'

// ── source-location helper: copied verbatim from the legacy CallGraphPanel ─
// (extract into a shared util in a follow-up if you keep both views around)
function findAllFunctionOccurrences(
  sources: Array<{ name: string; code: string }>,
  functionName: string,
): Array<{ startOffset: number; length: number; sourceIndex: number }> {
  const occurrences: Array<{ startOffset: number; length: number; sourceIndex: number }> = []
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]
    if (!src) continue
    const patterns = [
      new RegExp(`function\\s+${functionName}\\s*\\(`, 'gi'),
      new RegExp(
        `\\b${functionName}\\s*\\(.*?\\)\\s*(?:public|external|internal|private)?(?:\\s+\\w+)*\\s*(?:returns\\s*\\([^)]*\\))?\\s*\\{`,
        'gi',
      ),
    ]
    for (const re of patterns) {
      let m: RegExpExecArray | null
      while ((m = re.exec(src.code)) !== null) {
        const rest = src.code.slice(m.index)
        const end = rest.match(/[\{;]/)
        const length = end ? end.index! + 1 : functionName.length + 10
        occurrences.push({ startOffset: m.index, length, sourceIndex: i })
      }
    }
  }
  return occurrences
}

export function CallGraphView(): JSX.Element {
  const { project } = useParams()
  if (!project) throw new Error('CallGraphView requires a project route param')

  const callGraphQ = useQuery({
    queryKey: ['call-graph', project],
    queryFn: () => getCallGraphData(project),
  })
  const projectQ = useQuery({
    queryKey: ['projects', project],
    queryFn: () => getProject(project),
  })

  const userEdges = useCallgraphOverridesStore((s) => s.userEdges[project] ?? [])
  const removedIds = useCallgraphOverridesStore((s) => s.removedEdgeIds[project] ?? [])
  const collapsedList = useCallgraphOverridesStore((s) => s.collapsedContracts[project] ?? [])
  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList])
  const addEdge = useCallgraphOverridesStore((s) => s.addEdge)
  const toggleCollapsed = useCallgraphOverridesStore((s) => s.toggleCollapsed)
  const resetProject = useCallgraphOverridesStore((s) => s.resetProject)

  const { nodes, edges, entrypoints } = useMemo(() => {
    if (!callGraphQ.data || !projectQ.data) {
      return { nodes: new Map(), edges: [] as CallEdge[], entrypoints: [] }
    }
    return buildCallgraph({
      callGraph: callGraphQ.data,
      project: projectQ.data,
      userEdges,
      removedEdgeIds: new Set(removedIds),
    })
  }, [callGraphQ.data, projectQ.data, userEdges, removedIds])

  // Local UI state
  const [startId, setStartId] = useState<string | null>(null)
  const [depth, setDepth] = useState(4)
  const [selected, setSelected] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<CallEdge | null>(null)
  const [editMode, setEditMode] = useState(true)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tree')
  const [filters, setFilters] = useState({
    hideInternal: false, hideExternal: false, hideOptimistic: false,
    hidePermissioned: false, hideDelegatecall: false, hideUnresolved: true,
  })

  // If start's contract is collapsed, force-expand it.
  useEffect(() => {
    if (!startId) return
    const { address } = parseNodeId(startId)
    if (collapsed.has(address)) toggleCollapsed(project, address)
  }, [startId, collapsed, project, toggleCollapsed])

  const layout = useMemo(() => {
    if (!startId || !nodes.size) return null
    return computeLayout({
      startId,
      nodes,
      edges,
      depth,
      collapsedContracts: collapsed,
      mode: layoutMode,
      filters,
    })
  }, [startId, nodes, edges, depth, collapsed, layoutMode, filters])

  // Selected → path-from-start (cyan highlight + breadcrumb)
  const pathFromStart = useMemo(() => {
    if (!selected || !startId || !layout) return null
    return findPathToNode(selected, startId, layout.visibleEdges)
  }, [selected, startId, layout])

  // ── Drag-to-create-edge ────────────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ fromId: string; x: number; y: number; target: string | null } | null>(null)

  const onHandleMouseDown = useCallback((fromId: string, e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDrag({ fromId, x: e.clientX - rect.left, y: e.clientY - rect.top, target: null })
  }, [])

  useEffect(() => {
    if (!drag) return
    const move = (ev: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      const targetEl = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest<HTMLElement>('[data-node-id]')
      const target = targetEl?.getAttribute('data-node-id') ?? null
      setDrag((d) =>
        d ? { ...d, x, y, target: target && target !== d.fromId ? target : null } : null,
      )
    }
    const up = () => {
      setDrag((d) => {
        if (d?.target) {
          addEdge(project, {
            id: `u:${d.fromId}->${d.target}#${Date.now()}`,
            from: d.fromId,
            to: d.target,
            kind: 'internal',
            user: true,
          })
        }
        return null
      })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [drag, addEdge, project])

  // ── Cross-panel wiring ────────────────────────────────────────────────
  const selectGlobal = usePanelStore((s) => s.select)
  const ensurePanel = useMultiViewStore((s) => s.ensurePanel)
  const setActivePanel = useMultiViewStore((s) => s.setActivePanel)
  const { showRange, setSourceIndex } = useCodeStore()

  const handleSelectNode = useCallback(
    (id: string) => {
      setSelected(id)
      const { address } = parseNodeId(id)
      selectGlobal(address)
    },
    [selectGlobal],
  )

  const handleOpenInCode = useCallback(
    async (contractAddress: string, functionName: string) => {
      try {
        selectGlobal(contractAddress)
        ensurePanel('code')
        setActivePanel('code')
        const codeResp = await getCode(project, contractAddress)
        const occs = findAllFunctionOccurrences(codeResp.sources, functionName)
        if (occs.length === 0) {
          console.warn(`Function "${functionName}" not found in source`)
          return
        }
        const first = occs[0]
        if (first) {
          setSourceIndex(contractAddress, first.sourceIndex)
          showRange(contractAddress, { startOffset: first.startOffset, length: first.length })
        }
      } catch (err) {
        console.error('Failed to navigate to function:', err)
      }
    },
    [project, selectGlobal, ensurePanel, setActivePanel, setSourceIndex, showRange],
  )

  // ── Render guards ─────────────────────────────────────────────────────
  if (callGraphQ.isLoading || projectQ.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-coffee-400">Loading…</div>
    )
  }
  if (callGraphQ.error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-aux-red">
        Error loading call graph data
      </div>
    )
  }
  if (!callGraphQ.data || Object.keys(callGraphQ.data.contracts).length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-coffee-400">
        <div>No call graph data available</div>
        <div className="text-sm">
          Run “Generate Call Graph” in the Terminal panel first.
        </div>
      </div>
    )
  }

  const visibleNodeIds = new Set(layout ? Object.keys(layout.positions) : [])
  const PAD_X = 40
  const PAD_Y = 36

  return (
    <div className="flex h-full w-full bg-coffee-800 text-sm">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(150,130,200,0.10) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          onClick={() => setSelected(null)}
        >
          {!startId ? (
            <StartPicker entrypoints={entrypoints} onPick={setStartId} />
          ) : (
            <div
              ref={canvasRef}
              className="relative group"
              style={{
                width: Math.max((layout?.canvasWidth ?? 0) + PAD_X * 2, 600),
                height: (layout?.canvasHeight ?? 0) + PAD_Y * 3,
                padding: `${PAD_Y}px ${PAD_X}px`,
              }}
            >
              {/* Edges SVG (behind nodes) */}
              <svg
                className="pointer-events-none absolute"
                style={{
                  left: PAD_X,
                  top: PAD_Y,
                  width: layout?.canvasWidth,
                  height: layout?.canvasHeight,
                  overflow: 'visible',
                }}
              >
                <ArrowDefs />
                {layout?.visibleEdges.map((e) => {
                  const fp = layout.positions[e.from]
                  const tp = layout.positions[e.to]
                  if (!fp || !tp) return null
                  const fromNode = nodes.get(parseNodeId(e.from).address)
                  const fromH = nodeHeight(fromNode, layoutMode)
                  const onPath = !!(
                    pathFromStart &&
                    pathFromStart.includes(e.from) &&
                    pathFromStart.includes(e.to) &&
                    pathFromStart.indexOf(e.to) === pathFromStart.indexOf(e.from) + 1
                  )
                  const dimmed = !!pathFromStart && !onPath
                  const isHovered = hoveredEdge?.id === e.id
                  return (
                    <g key={e.id} style={{ pointerEvents: 'auto' }}>
                      <EdgePath
                        edge={e}
                        fromX={fp.x + layout.nodeWidth / 2}
                        fromY={fp.y + fromH}
                        toX={tp.x + layout.nodeWidth / 2}
                        toY={tp.y}
                        hovered={isHovered}
                        onPath={onPath}
                        dimmed={dimmed}
                        showLabel={isHovered || onPath}
                        onHover={setHoveredEdge}
                        onClick={(ed) => setSelected(ed.to)}
                      />
                    </g>
                  )
                })}
                {/* Drag-ghost edge */}
                {drag && (
                  <path
                    d={(() => {
                      const fp = layout?.positions[drag.fromId]
                      if (!fp || !layout) return ''
                      const fromNode = nodes.get(parseNodeId(drag.fromId).address)
                      const fromH = nodeHeight(fromNode, layoutMode)
                      const x1 = fp.x + layout.nodeWidth / 2
                      const y1 = fp.y + fromH
                      const x2 = drag.x - PAD_X
                      const y2 = drag.y - PAD_Y
                      return `M ${x1} ${y1} C ${x1} ${y1 + 80}, ${x2} ${y2 - 80}, ${x2} ${y2}`
                    })()}
                    stroke={drag.target ? 'var(--aux-cyan, #1c92a8)' : 'var(--aux-pink, #e27991)'}
                    strokeWidth={1.6}
                    strokeDasharray="4 3"
                    fill="none"
                  />
                )}
              </svg>

              {/* Nodes */}
              <div className="absolute" style={{ left: PAD_X, top: PAD_Y }}>
                {layout &&
                  Object.entries(layout.positions).map(([id, pos]) => {
                    const { address } = parseNodeId(id)
                    const node = nodes.get(id) ?? nodes.get(address)
                    if (!node) return null
                    const onPath = !!(pathFromStart && pathFromStart.includes(id))
                    const dimmed = !!pathFromStart && !onPath
                    return (
                      <Node
                        key={id}
                        node={node}
                        x={pos.x}
                        y={pos.y}
                        mode={layoutMode}
                        isStart={id === startId}
                        isSelected={selected === id}
                        isOnPath={onPath}
                        isDimmed={dimmed}
                        isCollapsed={collapsed.has(node.contractAddress)}
                        onSelect={handleSelectNode}
                        onToggleCollapse={(addr) => toggleCollapsed(project, addr)}
                        onHandleMouseDown={onHandleMouseDown}
                        onOpenInCode={handleOpenInCode}
                      />
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        <Controls
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          depth={depth}
          setDepth={setDepth}
          filters={filters}
          setFilters={setFilters}
          editMode={editMode}
          setEditMode={setEditMode}
          onClearStart={() => {
            setStartId(null)
            setSelected(null)
          }}
          onReset={() => resetProject(project)}
          trail={pathFromStart}
          nodes={nodes}
          onSelectNode={handleSelectNode}
        />
      </div>

      {startId && (
        <DetailSidebar
          selectedId={selected}
          startId={startId}
          nodes={nodes}
          allEdges={edges}
          visibleNodeIds={visibleNodeIds}
          onSelectNode={handleSelectNode}
          onSetStart={setStartId}
          onToggleCollapse={(c) => toggleCollapsed(project, c)}
          collapsedContracts={collapsed}
          onOpenInCode={handleOpenInCode}
        />
      )}
    </div>
  )
}
