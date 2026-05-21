# Integrating the callgraph-walker view into protocolbeat

Drop-in package for `@l2beat/protocolbeat` that replaces the body of the existing
`CallGraphPanel` with a top-down visual call-graph tracer. Layout, data model,
overrides store, and view components are split into testable modules.

```
protocolbeat-integration/src/apps/discovery/defidisco/
├── CallGraphPanel.tsx               # REPLACES existing file
└── callgraph/
    ├── model.ts                     # Pure types + id helpers (no React)
    ├── layout.ts                    # Pure BFS layout (no React)
    ├── buildCallgraph.ts            # API → {nodes, edges} adapter (no React)
    ├── overridesStore.ts            # zustand store, persisted to localStorage
    └── view/
        ├── CallGraphView.tsx        # Main orchestrator (state + wiring)
        ├── Node.tsx                 # Node card (function / contract / EOA / external / unresolved)
        ├── EdgePath.tsx             # SVG edge + arrow defs
        ├── StartPicker.tsx          # Empty-state entrypoint chooser
        ├── DetailSidebar.tsx        # Right sidebar (node / edges / notes tabs)
        └── Controls.tsx             # Bottom strip (layout / depth / filters / breadcrumb)
```

## Where the data comes from

| Source                            | Path                                            |
| --------------------------------- | ----------------------------------------------- |
| `ApiCallGraphResponse`            | `getCallGraphData(project)` — already exists    |
| `ApiProjectResponse`              | `getProject(project)` — already exists          |
| User overrides (edges, notes, collapsed) | `useCallgraphOverridesStore` — new (localStorage) |

The `buildCallgraph` adapter walks every `ExternalCall` and emits one edge per
call. Unresolved calls get a placeholder destination keyed by `interfaceType:storageVariable`.

## Wiring already accounted for

- `usePanelStore.select(address)` — fired on every node selection so Code / Values / Config follow
- `useMultiViewStore.ensurePanel('code') + setActivePanel('code')` — for "open in code"
- `useCodeStore.showRange / setSourceIndex` — jumps to function source (helper copied from the legacy panel)
- All node IDs are chain-qualified addresses (`eth:0x...`) — no chain-mixing bugs

## What's intentionally left to wire up next

1. **Permissioned edges** — `buildCallgraph` accepts an optional `functions: ApiFunctionsResponse` and flags any edge whose caller is `isPermissioned`. The view doesn't fetch it yet. Add a `useQuery(['functions', project], () => getFunctions(project))` in `CallGraphView` and pass the result through.
2. **Server-side override persistence** — Currently overrides live in `localStorage`. To persist to the repo, wrap `overridesStore` actions in react-query mutations against a new `/api/call-graph-overrides/:project` endpoint that writes a `call-graph-overrides.json` file (model it on `functions.json`).
3. **Delegatecall detection** — Reserved as an `EdgeKind` but the generator doesn't emit it. When call-graph-data starts marking delegatecalls, set `kind: 'delegatecall'` in the adapter.
4. **Cross-chain start picker** — Currently lists every entrypoint flat; group by chain if your projects span multiple chains.

## Known caveats

- **CSS variables in `EdgePath.tsx`** — SVG strokes use `var(--aux-cyan, #1c92a8)` etc. with hex fallbacks. Tailwind doesn't emit those vars by default. Either: (a) leave it — the fallbacks render correctly; or (b) import `colors.json` and pass actual hex values to the SVG.
- **Drag-to-create-edge target detection** uses `document.elementFromPoint`. If you have other overlay layers in the panel, the target lookup may break — narrow the selector to `[data-node-id]` inside the canvas ref.
- **No fuzzysort yet** — the StartPicker uses simple substring matching. Wire `fuzzysort` (already a dep) once you have >50 entrypoints.

## Visual reference

A working HTML prototype with mock data is in `callgraph-walker.html` at the
project root of this integration package. Open it to see the intended look,
interactions, and edge-kind color treatment.

---

# Prompt for Claude Code

Copy-paste the block below into Claude Code at the root of `defiscan-v2`:

> I want to replace the body of `packages/protocolbeat/src/apps/discovery/defidisco/CallGraphPanel.tsx` with a new visual top-down call-graph tracer. I have a pre-built integration package — please apply it.
>
> **Source:** All files are under `protocolbeat-integration/src/apps/discovery/defidisco/` in the attached package. They map 1:1 to `packages/protocolbeat/src/apps/discovery/defidisco/` in the repo.
>
> **Steps:**
>
> 1. Create the directory `packages/protocolbeat/src/apps/discovery/defidisco/callgraph/` and copy in: `model.ts`, `layout.ts`, `buildCallgraph.ts`, `overridesStore.ts`, plus the `view/` subfolder with `CallGraphView.tsx`, `Node.tsx`, `EdgePath.tsx`, `StartPicker.tsx`, `DetailSidebar.tsx`, `Controls.tsx`.
> 2. Replace `packages/protocolbeat/src/apps/discovery/defidisco/CallGraphPanel.tsx` with the version from the package (it now just re-exports the new view).
> 3. Verify the existing `PanelId = 'callgraph'` registration in `apps/discovery/multi-view/store.ts` and the wiring in `ProjectPage.tsx` are unchanged — they should already point at `CallGraphPanel`.
> 4. Run `pnpm --filter @l2beat/protocolbeat typecheck`. Fix any path issues — all imports use repo-relative paths assuming the files live at the location in step 1.
> 5. Run `pnpm --filter @l2beat/protocolbeat lint` and `pnpm --filter @l2beat/protocolbeat format:fix`.
> 6. Boot the app (`pnpm --filter @l2beat/protocolbeat start`), open a project that has call-graph data, switch to the CallGraph panel, and confirm:
>    - The start-picker shows function entrypoints
>    - Picking a function renders a vertical tree of calls
>    - Clicking a node selects it across panels (`usePanelStore.select` fires)
>    - Double-click on a function node jumps to the Code panel at that function
>    - Depth slider, layout-mode buttons, and edge-kind filters in the bottom bar all work
>    - Drag from a node's bottom "+" handle to another node creates a user-added edge
>    - The right sidebar shows callers / callees / notes
>
> **Conventions to preserve:**
>
> - Don't introduce new dependencies — everything uses libraries already in `protocolbeat/package.json` (`react`, `react-query`, `react-router-dom`, `zustand`, `clsx`).
> - Use Tailwind classes with the existing `coffee-*` and `aux-*` color tokens from `tailwind.config.js`.
> - Keep all pure logic (`model.ts`, `layout.ts`, `buildCallgraph.ts`) free of React imports — they should be unit-testable with mocha.
> - The old list-style `CallGraphPanel` content can be deleted entirely — the visual graph replaces it.
>
> **Follow-ups to add as TODO comments in `CallGraphView.tsx`** (don't implement yet):
>
> - Fetch `getFunctions(project)` and pass it to `buildCallgraph` as the `functions` arg so edges whose caller is `isPermissioned` render in orange.
> - Replace `localStorage` persistence in `overridesStore` with react-query mutations against a new server endpoint when one exists.
> - Add unit tests under `packages/protocolbeat/src/apps/discovery/defidisco/callgraph/__tests__/` for `layout.ts` (BFS depth limits, collapse behaviour) and `buildCallgraph.ts` (unresolved-call handling, permissioned propagation).
>
> If any import paths fail typecheck, the most likely fix is adjusting the relative `../`-counts at the top of `CallGraphView.tsx` and `buildCallgraph.ts` to match where the files actually land.

---

That's it. The new view should boot the moment the files are in place — no
router edits, no store edits, no panel-registry edits. The `'callgraph'` slot
in `PanelId` already routes to `CallGraphPanel`, which now renders the new view.
