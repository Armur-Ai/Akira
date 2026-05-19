# Akira

Akira is an attack-path simulator for the post-AI world. It models how adversaries — including AI-augmented ones — chain primitives across humans, services, models, agents, tools, and data to reach high-value assets, and visualises the result as an interactive graph.

## Why

Modern systems aren't just code-and-network. They're agents calling tools, models reading from RAG stores, MCP servers brokering trust, and prompts that quietly cross identity boundaries. Classical attack-graph tools don't model any of that. Akira does.

## What it does

- **Model** your environment as a graph of nodes (assets, identities, models, agents, services, MCP servers) and edges (trust, data flow, tool grants, network reachability).
- **Annotate** edges with attack techniques — both classical (MITRE ATT&CK) and AI-specific (prompt injection, RAG poisoning, tool-call abuse, jailbreak chaining, MITRE ATLAS).
- **Simulate** an adversary's reachability over the graph, with probability-weighted paths and Monte-Carlo runs.
- **Mitigate** by placing controls and watching the attack surface contract.
- **Report** the top paths, choke-points, and residual risk to each crown-jewel.

## Status

Pre-alpha but functional. The graph editor, simulator, defender controls, persistence, Markdown reporting, and five seeded example scenarios all work in the browser. There is no backend yet.

## Stack

- TypeScript end-to-end.
- pnpm workspaces monorepo.
- Web app: Vite + React + React Flow + Tailwind + shadcn/ui + Zustand.
- Core engine: pure-TS graph + simulation library (graphology under the hood).
- Validation: zod.
- Tests: Vitest, Playwright.
- v0 ships client-only as a static site. A backend slot is reserved for collaboration features later.

## Concepts

- **Scenario** — a saved graph + technique annotations + simulation parameters.
- **Node** — a thing an attacker can hold, traverse, or reach. Typed: `human`, `agent`, `model`, `tool`, `data`, `service`, `mcp-server`, `network`, …
- **Edge** — a directional possibility: "from N1, the attacker can act on N2 via technique T with probability p and cost c."
- **Technique** — a reusable primitive (e.g. `prompt-injection.indirect`) with default difficulty, detection likelihood, and required preconditions.
- **Path** — an ordered chain of edges from an entry-point to an objective.
- **Run** — a single (or Monte-Carlo) execution of the simulator over a scenario.

## Repository layout (target)

```
akira/
├── apps/
│   └── web/                # Vite + React graph editor & simulator UI
├── packages/
│   ├── core/               # Graph + simulation engine (pure TS)
│   ├── schema/             # zod schemas, shared types
│   └── techniques/         # Catalogue of attack techniques
├── README.md
└── pnpm-workspace.yaml
```

## Roadmap

Major milestones:

1. Graph data model + core engine (deterministic shortest-path attacks).
2. Interactive graph editor (web).
3. AI-specific technique library v1.
4. Monte-Carlo & probabilistic paths.
5. Defender modelling (controls, detection).
6. Scenario import/export, sharing.
7. Reporting.

## Getting started

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. Pick one of the seeded examples (e.g. *RAG indirect prompt injection*) and click **Run** — top attack paths appear in the right sidebar. Click a path to highlight it on the canvas. Switch to the **Controls** tab, drop in a *Prompt-injection filter* from the templates, and re-run to watch path probability drop.

Scenarios auto-save to IndexedDB, so refresh-and-reload preserves your work. Use **Export** to download a scenario as JSON, **Import JSON** on the landing page to bring one back.

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — packages, data flow, why a worker.
- [`docs/data-model.md`](./docs/data-model.md) — annotated reference for every schema.
- [`docs/simulator.md`](./docs/simulator.md) — the neg-log-prob trick, Yen's k-paths, Monte Carlo, scoring.
- [`docs/techniques.md`](./docs/techniques.md) — how to author a new attack technique.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev loop, code style, where things go.

## Licence

MIT. See [`LICENSE`](./LICENSE).
