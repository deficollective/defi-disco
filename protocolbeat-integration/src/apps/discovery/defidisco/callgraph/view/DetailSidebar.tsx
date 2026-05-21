// Right-side detail sidebar inside the CallGraph panel.
// Tabs: Node | Edges | Notes. Mirrors panels.jsx from the prototype.

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { useParams } from 'react-router-dom'
import type { CallEdge, CallNode } from '../model'
import { parseNodeId, shortAddr } from '../model'
import { useCallgraphOverridesStore } from '../overridesStore'

interface Props {
  selectedId: string | null
  startId: string | null
  nodes: Map<string, CallNode>
  allEdges: CallEdge[]
  visibleNodeIds: Set<string>
  onSelectNode: (id: string) => void
  onSetStart: (id: string) => void
  onToggleCollapse: (contract: string) => void
  collapsedContracts: Set<string>
  onOpenInCode?: (contractAddress: string, functionName: string) => void
}

type Tab = 'node' | 'edges' | 'notes'

export function DetailSidebar(props: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('node')

  return (
    <div className="flex h-full w-[340px] flex-col border-coffee-500 border-l bg-coffee-700">
      <div className="flex border-b border-coffee-500">
        <TabButton on={tab === 'node'} onClick={() => setTab('node')}>node</TabButton>
        <TabButton on={tab === 'edges'} onClick={() => setTab('edges')}>
          edges <span className="ml-1.5 rounded bg-coffee-600 px-1 text-[10px] text-coffee-400">{props.allEdges.length}</span>
        </TabButton>
        <TabButton on={tab === 'notes'} onClick={() => setTab('notes')}>notes</TabButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'node' && <NodeTab {...props} />}
        {tab === 'edges' && <EdgesTab {...props} />}
        {tab === 'notes' && <NotesTab {...props} />}
      </div>
    </div>
  )
}

function TabButton({
  on, onClick, children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 border-b-2 px-3 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors',
        on
          ? 'border-aux-pink text-coffee-200'
          : 'border-transparent text-coffee-400 hover:text-coffee-200',
      )}
    >
      {children}
    </button>
  )
}

// ───────────────────── Node tab ─────────────────────

function NodeTab({
  selectedId, startId, nodes, allEdges,
  onSelectNode, onSetStart, onToggleCollapse, collapsedContracts,
  onOpenInCode,
}: Props): JSX.Element {
  if (!selectedId) {
    return (
      <p className="italic text-coffee-400">
        Click a node in the graph to inspect its callers, callees, and metadata.
      </p>
    )
  }
  const { address, functionName } = parseNodeId(selectedId)
  const node = nodes.get(selectedId) ?? nodes.get(address)
  if (!node) return <p className="italic text-coffee-400">Unknown node.</p>

  const incoming = allEdges.filter((e) => e.to === selectedId)
  const outgoing = allEdges.filter((e) => e.from === selectedId)
  const isCollapsed = collapsedContracts.has(address)
  const contractNode = nodes.get(address)

  return (
    <>
      <div className="mb-1 break-all font-mono text-[13.5px] leading-snug">
        <span className="text-coffee-200">{node.contractName}</span>
        {functionName && (
          <>
            <span className="text-coffee-400">.</span>
            <span className="text-aux-pink">{functionName}</span>
          </>
        )}
      </div>

      <KvRow k="address" v={<span className="font-mono">{shortAddr(address)}</span>} />
      <KvRow k="type" v={node.contractType} />
      <KvRow k="kind" v={node.kind} />
      {functionName && <KvRow k="visibility" v={node.isView ? 'view' : 'write'} />}
      {node.isPermissioned && (
        <KvRow
          k="modifier"
          v={<span className="text-aux-orange">permissioned</span>}
        />
      )}

      <Section title={`Callers (${incoming.length})`}>
        {incoming.length === 0 ? (
          <p className="text-[11px] text-coffee-400">No incoming edges.</p>
        ) : (
          incoming.map((e) => (
            <EdgeItem key={e.id} edge={e} dir="in" onClick={() => onSelectNode(e.from)} />
          ))
        )}
      </Section>

      <Section title={`Callees (${outgoing.length})`}>
        {outgoing.length === 0 ? (
          <p className="text-[11px] text-coffee-400">No outgoing edges.</p>
        ) : (
          outgoing.map((e) => (
            <EdgeItem key={e.id} edge={e} dir="out" onClick={() => onSelectNode(e.to)} />
          ))
        )}
      </Section>

      <Section title="Actions">
        <div className="flex flex-wrap gap-1.5">
          {functionName && selectedId !== startId && (
            <ActionBtn onClick={() => onSetStart(selectedId)}>↟ use as start</ActionBtn>
          )}
          {contractNode && contractNode.kind !== 'eoa' && (
            <ActionBtn onClick={() => onToggleCollapse(address)}>
              {isCollapsed ? '＋ expand contract' : '− collapse contract'}
            </ActionBtn>
          )}
          {functionName && onOpenInCode && (
            <ActionBtn onClick={() => onOpenInCode(address, functionName)}>
              ↗ open in code
            </ActionBtn>
          )}
        </div>
      </Section>
    </>
  )
}

function KvRow({ k, v }: { k: string; v: React.ReactNode }): JSX.Element {
  return (
    <div className="flex justify-between gap-2 border-b border-dashed border-coffee-600 py-1.5 font-mono text-[11.5px]">
      <span className="text-coffee-400">{k}</span>
      <span className="break-all text-right text-coffee-200">{v}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="mt-4">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-coffee-400">
        {title}
      </div>
      {children}
    </div>
  )
}

function ActionBtn({
  onClick, children,
}: {
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded border border-coffee-600 bg-coffee-800 px-2.5 font-mono text-[11px] text-coffee-200 hover:border-coffee-400"
    >
      {children}
    </button>
  )
}

function EdgeItem({
  edge, dir, onClick,
}: {
  edge: CallEdge
  dir: 'in' | 'out'
  onClick: () => void
}): JSX.Element {
  const target = dir === 'in' ? edge.from : edge.to
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-1 flex w-full items-center gap-2 rounded border border-coffee-600 bg-coffee-800 px-2 py-1.5 font-mono text-[11px] text-left hover:border-coffee-400"
    >
      <span className="text-coffee-400">{dir === 'in' ? '←' : '→'}</span>
      <span className="flex-1 truncate text-coffee-200">{target}</span>
      <EdgeKindBadge kind={edge.kind} />
    </button>
  )
}

function EdgeKindBadge({ kind }: { kind: CallEdge['kind'] }): JSX.Element {
  const tone =
    kind === 'external' ? 'text-aux-green bg-aux-green/10'
      : kind === 'optimistic' ? 'text-aux-purple bg-aux-purple/10'
        : kind === 'permissioned' ? 'text-aux-orange bg-aux-orange/10'
          : kind === 'delegatecall' ? 'text-aux-purple bg-aux-purple/10'
            : kind === 'unresolved' ? 'text-aux-yellow bg-aux-yellow/10'
              : 'text-coffee-400 bg-coffee-900'
  return (
    <span className={clsx('rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider', tone)}>
      {kind}
    </span>
  )
}

// ───────────────────── Edges tab ─────────────────────

function EdgesTab({ allEdges, visibleNodeIds, onSelectNode }: Props): JSX.Element {
  const { project } = useParams()
  const removeEdge = useCallgraphOverridesStore((s) => s.removeEdge)

  const [q, setQ] = useState('')
  const [scope, setScope] = useState<'all' | 'visible'>('all')
  const [kindFilters, setKindFilters] = useState({
    internal: true, external: true, optimistic: true,
    permissioned: true, delegatecall: true, unresolved: true,
  })

  const filtered = useMemo(() => {
    return allEdges.filter((e) => {
      if (!kindFilters[e.kind as keyof typeof kindFilters]) return false
      if (scope === 'visible' && (!visibleNodeIds.has(e.from) || !visibleNodeIds.has(e.to))) return false
      if (q) {
        const text = `${e.from} ${e.to} ${e.kind}`.toLowerCase()
        if (!text.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [allEdges, kindFilters, scope, visibleNodeIds, q])

  return (
    <div className="font-mono text-[11px]">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="filter by name / kind…"
        className="mb-2 w-full rounded border border-coffee-600 bg-coffee-800 px-2.5 py-1.5 outline-none placeholder:text-coffee-400 focus:border-coffee-400"
      />
      <div className="mb-2 flex flex-wrap gap-1">
        <Chip on={scope === 'all'} onClick={() => setScope('all')}>all</Chip>
        <Chip on={scope === 'visible'} onClick={() => setScope('visible')}>visible only</Chip>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {Object.keys(kindFilters).map((k) => (
          <Chip
            key={k}
            on={kindFilters[k as keyof typeof kindFilters]}
            onClick={() =>
              setKindFilters({ ...kindFilters, [k]: !kindFilters[k as keyof typeof kindFilters] })
            }
          >
            {k}
          </Chip>
        ))}
      </div>
      <p className="mb-2 text-[10px] text-coffee-400">
        {filtered.length} edge{filtered.length === 1 ? '' : 's'}
      </p>
      {filtered.map((e) => (
        <div
          key={e.id}
          className={clsx(
            'mb-1 grid grid-cols-[1fr_14px_1fr_18px] items-center gap-1.5 rounded border bg-coffee-800 px-2 py-1.5',
            edgeBorderLeftClass(e.kind),
            'border-coffee-600 hover:border-coffee-400',
          )}
        >
          <button
            type="button"
            onClick={() => onSelectNode(e.from)}
            className="truncate text-left text-[10.5px] hover:text-aux-cyan"
          >
            <span className="text-coffee-400">{parseNodeId(e.from).address.split(':').pop()?.slice(0, 8)}</span>
            {parseNodeId(e.from).functionName && (
              <>
                .<span className="text-coffee-200">{parseNodeId(e.from).functionName}</span>
              </>
            )}
          </button>
          <span className="text-center text-coffee-400">→</span>
          <button
            type="button"
            onClick={() => onSelectNode(e.to)}
            className="truncate text-left text-[10.5px] hover:text-aux-cyan"
          >
            <span className="text-coffee-400">{parseNodeId(e.to).address.split(':').pop()?.slice(0, 8)}</span>
            {parseNodeId(e.to).functionName && (
              <>
                .<span className="text-coffee-200">{parseNodeId(e.to).functionName}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => project && removeEdge(project, e.id)}
            title="Remove edge"
            className="grid h-4 w-4 place-items-center rounded text-coffee-400 hover:bg-coffee-600 hover:text-aux-red"
          >
            ×
          </button>
        </div>
      ))}
      <div className="mt-2 rounded border border-dashed border-coffee-600 p-2.5 text-[10.5px] text-coffee-400">
        ＋ add edge — drag from any node’s bottom <span className="rounded border border-coffee-600 bg-coffee-900 px-1 text-[10px] text-coffee-200">+</span> handle in the graph.
      </div>
    </div>
  )
}

function edgeBorderLeftClass(kind: CallEdge['kind']): string {
  switch (kind) {
    case 'external': return 'border-l-2 border-l-aux-green'
    case 'optimistic': return 'border-l-2 border-l-aux-purple'
    case 'permissioned': return 'border-l-2 border-l-aux-orange'
    case 'delegatecall': return 'border-l-2 border-l-aux-purple'
    case 'unresolved': return 'border-l-2 border-l-aux-yellow'
    default: return 'border-l-2 border-l-coffee-400'
  }
}

function Chip({
  on, onClick, children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-2 py-0.5 text-[10px]',
        on
          ? 'border-coffee-400 bg-coffee-600 text-coffee-200'
          : 'border-coffee-600 bg-coffee-800 text-coffee-400 hover:text-coffee-200',
      )}
    >
      {children}
    </button>
  )
}

// ───────────────────── Notes tab ─────────────────────

function NotesTab({ selectedId }: Props): JSX.Element {
  const { project } = useParams()
  const notes = useCallgraphOverridesStore((s) =>
    project ? s.notes[project] ?? {} : {},
  )
  const setNote = useCallgraphOverridesStore((s) => s.setNote)

  if (!selectedId) {
    return (
      <p className="italic text-coffee-400">
        Select a node to attach research notes. Stored locally per project + node.
      </p>
    )
  }
  const value = notes[selectedId] ?? ''
  return (
    <>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-coffee-400">notes for</div>
      <div className="mb-2 break-all font-mono text-[12.5px] text-coffee-200">{selectedId}</div>
      <textarea
        value={value}
        onChange={(e) => project && setNote(project, selectedId, e.target.value)}
        placeholder="e.g. unguarded — anyone can call. Verify Oracle.getPrice has staleness check…"
        className="min-h-24 w-full resize-y rounded border border-coffee-600 bg-coffee-900 px-2.5 py-2 font-mono text-[11.5px] text-coffee-200 outline-none focus:border-coffee-400"
      />
      <p className="mt-1.5 text-[10px] text-coffee-400">{value.length} char · saved automatically</p>
    </>
  )
}
