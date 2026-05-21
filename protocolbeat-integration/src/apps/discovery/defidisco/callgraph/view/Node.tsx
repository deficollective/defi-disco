// One node in the callgraph canvas. Renders contract / function / external /
// EOA / unknown variants. All sizing constants come from layout.ts so the
// SVG edges stay aligned without DOM measurement.

import { useCallback } from 'react'
import { clsx } from 'clsx'
import type { CallNode } from '../model'
import { type LayoutMode, nodeHeight, nodeWidth } from '../layout'
import { shortAddr } from '../model'

interface Props {
  node: CallNode
  x: number
  y: number
  mode: LayoutMode
  isStart: boolean
  isSelected: boolean
  isOnPath: boolean
  isDimmed: boolean
  isCollapsed: boolean
  onSelect: (id: string) => void
  onToggleCollapse: (contractAddress: string) => void
  onHandleMouseDown: (id: string, e: React.MouseEvent) => void
  onOpenInCode?: (contractAddress: string, functionName: string) => void
}

export function Node(props: Props): JSX.Element {
  const {
    node, x, y, mode,
    isStart, isSelected, isOnPath, isDimmed, isCollapsed,
    onSelect, onToggleCollapse, onHandleMouseDown, onOpenInCode,
  } = props

  const isFn = node.functionName !== undefined
  const isExternal = node.kind === 'external'
  const isEoa = node.kind === 'eoa'
  const isUnknown = node.kind === 'unknown'

  const w = nodeWidth(mode)
  const h = nodeHeight(node, mode)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect(node.id)
    },
    [node.id, onSelect],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isFn && onOpenInCode) {
        onOpenInCode(node.contractAddress, node.functionName!)
      }
    },
    [node, isFn, onOpenInCode],
  )

  const headBg =
    node.kind === 'project'
      ? 'bg-aux-pink text-coffee-900'
      : isUnknown
        ? 'bg-coffee-600 text-aux-yellow'
        : 'bg-coffee-700 text-coffee-200'

  return (
    <div
      data-node-id={node.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={clsx(
        'absolute rounded border bg-coffee-800 select-none transition-shadow',
        'font-mono text-[11.5px]',
        isStart
          ? 'border-aux-cyan shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-aux-cyan'
          : isSelected
            ? 'border-aux-cyan shadow-[0_6px_24px_rgba(28,146,168,0.25)]'
            : isOnPath
              ? 'border-aux-cyan'
              : 'border-coffee-600 hover:border-coffee-400',
        isDimmed && 'opacity-40',
      )}
      style={{ left: x, top: y, width: w, minHeight: h }}
    >
      {/* Header */}
      <div className={clsx('flex items-center gap-2 rounded-t px-2.5 py-1.5', headBg)}>
        <span className="text-[11px] leading-none">
          {isEoa ? '⊙' : isUnknown ? '?' : isExternal ? '⊟' : '▣'}
        </span>
        <span className="flex-1 truncate font-medium">{node.contractName}</span>
        {isExternal && (
          <span className="rounded bg-black/20 px-1 text-[9px] uppercase tracking-wider">ext</span>
        )}
        {isEoa && (
          <span className="rounded bg-black/20 px-1 text-[9px] uppercase tracking-wider">eoa</span>
        )}
        {isUnknown && (
          <span className="rounded bg-black/20 px-1 text-[9px] uppercase tracking-wider">unresolved</span>
        )}
        {!isExternal && !isEoa && !isUnknown && (
          <span className="h-1.5 w-1.5 rounded-full bg-aux-green" />
        )}
      </div>

      {/* Body */}
      <div className="px-2.5 py-2">
        {isFn ? (
          <>
            <div className="break-all leading-tight text-coffee-200">
              <span className="text-aux-pink">{node.functionName}</span>
              <span className="text-coffee-400">()</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-coffee-400">
              <span className="uppercase tracking-wider text-coffee-200">
                {node.isView ? 'view' : 'write'}
              </span>
              {node.isPermissioned && (
                <span className="rounded border border-aux-orange/60 px-1 text-aux-orange">
                  permissioned
                </span>
              )}
            </div>
          </>
        ) : isEoa ? (
          <div className="text-[10.5px] text-coffee-400">
            <div className="text-coffee-200">{shortAddr(node.contractAddress)}</div>
            <div className="mt-0.5">externally-owned</div>
          </div>
        ) : (
          <div className="text-[10.5px] text-coffee-400">
            <div className="text-coffee-200">{shortAddr(node.contractAddress)}</div>
            {isCollapsed && <div className="mt-0.5">collapsed</div>}
          </div>
        )}
      </div>

      {/* Collapse / expand badge */}
      {!isEoa && (
        <button
          type="button"
          title={isCollapsed ? 'Expand contract into functions' : 'Collapse contract'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(node.contractAddress)
          }}
          className={clsx(
            'absolute -top-1.5 -right-1.5 grid h-4 w-4 place-items-center',
            'rounded-full border border-coffee-600 bg-coffee-800 text-[10px] text-coffee-400',
            'opacity-0 transition-opacity group-hover:opacity-100 hover:border-aux-pink hover:text-aux-pink',
          )}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}

      {/* Drag-to-create-edge handle */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation()
          onHandleMouseDown(node.id, e)
        }}
        className={clsx(
          'absolute left-1/2 -bottom-[6px] z-10 -translate-x-1/2',
          'grid h-3 w-3 place-items-center rounded-full',
          'border border-coffee-600 bg-coffee-800 text-[9px] text-coffee-400',
          'opacity-0 transition-opacity hover:border-aux-cyan hover:text-aux-cyan',
          'group-hover:opacity-100',
        )}
        title="Drag to another node to add an edge"
      >
        +
      </button>
    </div>
  )
}
