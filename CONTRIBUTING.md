# Contributing

## Dev loop

```sh
pnpm install
pnpm dev          # all workspace packages' dev scripts (Vite for web)
pnpm typecheck    # strict TS across the workspace
pnpm lint         # Biome check
pnpm test         # Vitest across packages
pnpm build        # tsc -b for libs, vite build for web
```

For Playwright E2E:

```sh
pnpm --filter @akira/web exec playwright install chromium
pnpm --filter @akira/web e2e        # headless
pnpm --filter @akira/web e2e:ui     # interactive
```

CI runs every gate plus E2E on Node 22 and 24.

## Layout

```
packages/
  schema/         zod schemas + inferred types
  core/           graph + simulation engine
  techniques/     attack-technique catalogue
apps/
  web/            Vite + React 19 SPA
docs/             markdown reference (architecture, data model, simulator, techniques)
```

See `docs/architecture.md` for what lives where.

## Code style

- Biome enforces formatting and a curated rule set. `pnpm lint:fix` autofixes most things.
- Strict TypeScript: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (off in `apps/web` only — React props use the `?:` convention which conflicts), `verbatimModuleSyntax`. Use `import type` for type-only imports.
- No comment unless the why is non-obvious. Code should read for itself.
- New files import from `'./foo.js'` (TS-with-`.js`-extension), not `'./foo'`. The bundler and the type-checker both handle it.

## Where things go

- New runtime contract → `packages/schema`. Add a zod schema + inferred type, default any new fields so older saved scenarios stay loadable.
- New analysis or graph primitive → `packages/core`. Pure TS, no DOM/Node imports, no React. Add Vitest unit tests next to the implementation.
- New attack technique → `packages/techniques` (see `docs/techniques.md`).
- New visual treatment, sidebar tab, or canvas behaviour → `apps/web`.
- New control template → `apps/web/src/components/controls/templates.ts`.
- New example scenario → `apps/web/src/examples/*.json` plus the entry in `examples/index.ts`.

## Commits

- Use imperative subject lines: `feat(web): wire run button to simulator`.
- The body should answer "why" rather than restate "what" — the diff already tells you what.
- Add the Co-Authored-By trailer if a model contributed.
