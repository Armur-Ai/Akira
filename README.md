# Akira

Akira is an attack-path simulator for the post-AI world. It models how adversaries — including AI-augmented ones — chain primitives across humans, services, models, agents, tools, and data to reach high-value assets, and visualises the result as an interactive graph.

## Why

Modern systems aren't just code-and-network. They're agents calling tools, models reading from RAG stores, MCP servers brokering trust, and prompts that quietly cross identity boundaries. Classical attack-graph tools don't model any of that. Akira does.

## What it does

- **Model** your environment as a graph of nodes (assets, identities, models, agents, services, MCP servers) and edges (trust, data flow, tool grants, network reachability). Drag from the palette to create; drag handle-to-handle to connect.
- **Annotate** edges with attack techniques — both classical (MITRE ATT&CK) and AI-specific (prompt injection, RAG poisoning, tool-call abuse, jailbreak chaining, MITRE ATLAS, OWASP LLM Top-10).
- **Simulate** in a Web Worker: top-K paths via Yen's k-shortest paths or seeded Monte-Carlo over edge sampling. Cancellable.
- **Mitigate** with defender controls (six pre-baked templates: MFA, prompt-injection filter, egress filter, tool allow-list, output sanitiser, crown-jewel hardening) and toggle them on/off to A/B without deleting.
- **Reason** about the result on the canvas: click a top path to highlight it; toggle the chokepoint heatmap; see Δ arrows comparing to the prior run; ask the marginal-value analyser which control is doing the most work.
- **Persist** to IndexedDB (auto-save) with named snapshot history per scenario. Undo/redo with drag/keystroke coalescing.
- **Share** via JSON export, gzipped URL share-link (everything fits in the fragment), or a Markdown / printable-PDF report.

## Status

`v0.2.0` tagged. The editor, simulator, controls, sharing, snapshots, heatmap, run-diff, marginal-value analysis, validation lint, undo/redo, elkjs auto-layout, Markdown + PDF reports, scale tests on 500-node DAGs, and Playwright E2E coverage all work in the browser. No backend yet — single-user, fully client-side.

## Stack

- TypeScript end-to-end, strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
- pnpm workspaces monorepo.
- Web app: Vite 6 + React 19 + React Flow + Tailwind v4 + Zustand.
- Core engine: pure-TS graph + simulation library (graphology under the hood). Pushed to a dedicated Web Worker via `?worker`.
- Validation: zod. Every persisted artefact is parsed before use.
- Tests: Vitest (unit + scale), Playwright (golden-path + control-efficacy E2E).
- v0 ships client-only as a static site. A backend slot is reserved for collaboration features later.

## Concepts

- **Scenario** — a saved graph + technique annotations + simulation parameters.
- **Node** — a thing an attacker can hold, traverse, or reach. Typed: `human`, `agent`, `model`, `tool`, `data`, `service`, `mcp-server`, `network`, …
- **Edge** — a directional possibility: "from N1, the attacker can act on N2 via technique T with probability p and cost c."
- **Technique** — a reusable primitive (e.g. `prompt-injection.indirect`) with default difficulty, detection likelihood, and required preconditions.
- **Path** — an ordered chain of edges from an entry-point to an objective.
- **Run** — a single (or Monte-Carlo) execution of the simulator over a scenario.

## Repository layout

```
akira/
├── apps/
│   └── web/                # Vite + React graph editor & simulator UI
├── packages/
│   ├── core/               # Graph + simulation engine (pure TS)
│   ├── schema/             # zod schemas, shared types
│   └── techniques/         # 21-entry catalogue of attack primitives
├── docs/                   # Architecture, data model, simulator math, technique authoring
├── CONTRIBUTING.md
└── pnpm-workspace.yaml
```

## What's next

The single-user core loop is feature-complete. The next big arc is a backend (`apps/api`) for collaboration: scenario sharing with ACLs, run history, live presence on a graph, and webhooks for run completion. Until that lands, scenarios live in IndexedDB and travel via JSON export or share-links.

## Getting started

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. Pick one of the seeded examples (e.g. *RAG indirect prompt injection*) and click **Run** — top attack paths appear in the right sidebar. Click a path to highlight it on the canvas. Switch to the **Controls** tab, drop in a *Prompt-injection filter* from the templates, and re-run to watch path probability drop. Hit the **Heatmap** toggle in the Run results header to recolour the canvas by chokepoint coverage. Click **Sparkles** in the Controls tab to ask which single control is doing the most work.

Scenarios auto-save to IndexedDB, so refresh-and-reload preserves your work. **Export** downloads JSON, **Share** copies a gzipped fragment-URL to the clipboard, **Snapshots** captures named restore points, and the Run tab's **Report** / **PDF** buttons emit Markdown and printable-HTML reports respectively.

### Other commands

```sh
pnpm typecheck          # strict TS across the workspace
pnpm lint               # Biome
pnpm test               # Vitest across packages (includes scale tests)
pnpm build              # tsc -b for libs, vite build for web
pnpm --filter @akira/web e2e   # Playwright (run `playwright install chromium` first)
```

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — packages, data flow, why a worker.
- [`docs/data-model.md`](./docs/data-model.md) — annotated reference for every schema.
- [`docs/simulator.md`](./docs/simulator.md) — the neg-log-prob trick, Yen's k-paths, Monte Carlo, scoring.
- [`docs/techniques.md`](./docs/techniques.md) — how to author a new attack technique.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev loop, code style, where things go.

## Licence

MIT. See [`LICENSE`](./LICENSE).
