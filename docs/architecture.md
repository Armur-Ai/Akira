# Architecture

Akira is a pure-TypeScript monorepo. There is no backend: every byte runs in the browser, with the simulator pushed to a dedicated Web Worker. State persists locally in IndexedDB.

## Packages

```
akira/
├── packages/
│   ├── schema/        zod schemas + inferred types (Node, Edge, Control, Scenario, RunResult …)
│   ├── core/          simulation engine: graph build, Dijkstra, Yen's k-paths, BFS, Monte-Carlo
│   └── techniques/    catalogue of classical + AI-specific attack primitives
└── apps/
    └── web/           Vite + React 19 + React Flow + Tailwind v4 SPA
```

`schema` is depended on by everything. `core` and `techniques` are independent. `web` consumes all three from source — no build step for workspace deps in dev.

## Data flow

```
            ┌─────────────┐
   user ──▶ │  React UI   │ ──▶ Zustand store (scenarios + selection + run cache)
            └─────┬───────┘
                  │ scenario, config
                  ▼
            ┌─────────────┐                  ┌──────────────────┐
            │ run-client  │ ──── postMessage ─▶ Web Worker       │
            │ (Promise +  │ ◀───── result ──── │   @akira/core   │
            │  cancel)    │                  │   simulate()     │
            └─────┬───────┘                  └──────────────────┘
                  │ RunResult
                  ▼
            ┌─────────────┐
            │ run-store   │ ──▶ Run results pane, canvas overlay
            └─────────────┘
```

Every mutation to the scenario store fires a debounced write through `persistence/auto-save.ts` into IndexedDB. On boot, `persistence/db.ts` reads the dict back and validates every record against `Scenario` before hydration; malformed entries are dropped with a console warning rather than bricking the app.

## Why a worker

The engine is pure TS and intentionally avoids DOM/Node-only imports, so it sits cleanly behind a `?worker` import. Deterministic runs on a 5-node example return in <5 ms; Monte-Carlo runs with 10 k iterations on a 50-edge graph take ~100 ms. Worker offload keeps the canvas responsive on the upper end of that range and gives us a `cancel()` for free via `worker.terminate()`.

## Why zod-first

Every persisted artefact — scenarios, run results — is JSON. Defining the contract in zod means the same definition produces:

- A runtime parser that hydrates untrusted data (file import, IndexedDB load, future API responses).
- A TypeScript type via `z.infer<typeof X>` for the rest of the codebase.
- Default values that keep older serialised scenarios forward-compatible when we add fields.

The technique catalogue is `Technique.parse()`-validated at module load, so a malformed entry in the catalogue fails loudly on import rather than at first interaction.

## Where new features land

| Change | Lives in |
| --- | --- |
| New node/edge field | `packages/schema` + UI form |
| New attack technique | `packages/techniques` |
| New analysis (e.g., new metric) | `packages/core` |
| New visual treatment | `apps/web/src/components/canvas/` |
| New control template | `apps/web/src/components/controls/templates.ts` |
| New example scenario | `apps/web/src/examples/*.json` |
