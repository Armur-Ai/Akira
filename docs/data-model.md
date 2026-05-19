# Data model

Defined in `packages/schema`, single source of truth at runtime and compile time. Every field below is a zod schema with the inferred TS type re-exported under the same name.

## Node

```ts
{
  id: string,
  type: 'human' | 'agent' | 'model' | 'tool' | 'data' | 'service'
      | 'mcp-server' | 'network' | 'credential' | 'secret',
  label: string,
  meta: Record<string, unknown>,
  tags: string[],
  criticality: number,        // 0…1 — drives crown-jewel highlighting
  position?: { x: number, y: number },  // canvas-only
}
```

The type taxonomy is deliberately small. Each value maps to an icon in `apps/web/src/lib/icons.ts` so a new type means picking a Lucide icon too.

## Edge

A directed relationship the attacker can traverse.

```ts
{
  id: string,
  from: string, to: string,
  kind: 'trust' | 'data-flow' | 'tool-grant' | 'network-reach'
      | 'identity-assumes' | 'model-invokes' | 'prompt-flow' | 'physical',
  techniqueIds: string[],     // references @akira/techniques ids
  probability: number,        // 0…1 — single-step success
  cost: number,               // ≥ 0 — attacker time/effort
  noise: number,              // 0…1 — chance defenders notice this step
  requires: string[],         // technique preconditions
  label?: string,
  meta: Record<string, unknown>,
}
```

`probability`, `cost`, and `noise` are the three knobs the simulator reads.

## Technique

Reusable primitive attached to one or more edges.

```ts
{
  id: string,                 // kebab/dot, e.g. 'prompt-injection.indirect'
  name: string,
  family: '…' | 'ai-prompt' | 'ai-rag' | 'ai-tool' | 'ai-agent'
        | 'ai-model' | 'ai-mcp' | 'ai-output' | 'ai-training' | …,
  summary: string,
  references: Array<{ url, title? }>,
  defaultProbability: number,
  defaultDifficulty: number,
  defaultDetection: number,
  requires: string[],
  tags: string[],
  taxonomy: { mitreAttack: string[], mitreAtlas: string[], owaspLlm: string[] },
}
```

## Control

A defender mitigation. Selects what it targets, then describes its effect.

```ts
{
  id: string,
  name: string,
  summary: string,
  target:
    | { kind: 'edge', edgeKind?: EdgeKind, edgeId?: string, techniqueId?: string, tag?: string }
    | { kind: 'node', nodeType?: NodeType, nodeId?: string, tag?: string },
  effect: {
    probabilityMultiplier: number,  // 0…1, applied to matched edges' probability
    detectionDelta: number,         // -1…1, added to noise (clamped to [0,1])
    costDelta: number,              // ≥ 0, added to cost
  },
  enabled: boolean,
}
```

Disabled controls are inert — toggling re-runs the sim against the same scenario for A/B comparison.

## Scenario

A complete authored model: graph, controls, plus the metadata needed to drive a run.

```ts
{
  id, name, version, description,
  nodes, edges, controls,
  entryPoints: string[],   // node ids the attacker starts from
  objectives: string[],    // crown-jewel node ids to reach
  notes, createdAt?, updatedAt?,
}
```

## Run

`RunConfig` is what the user picks before clicking Run; `RunResult` is what the engine emits.

```ts
RunConfig {
  seed: number,
  iterations: number,
  mode: 'deterministic' | 'monte-carlo',
  maxDepth: number,
  topK: number,
}

RunResult {
  scenarioId, scenarioVersion, seed, mode, iterations, wallTimeMs,
  paths: AttackPath[],
  metricsByObjective: ObjectiveMetrics[],
  chokepoints: Chokepoint[],
  unreachable: string[],
}
```

An `AttackPath` carries its steps, aggregate probability, detection, cost, and composite score; a `Chokepoint` is a node or edge with a `coverageRatio` over the top paths.

## Migration

Because schemas use `.default()` for every nullable-feeling field, adding optional new fields is a non-breaking change for already-saved scenarios — old records load fine and pick up the new defaults. Renaming or changing the meaning of an existing field is breaking; bump the `KEY` constant in `apps/web/src/persistence/db.ts` to start a fresh IndexedDB namespace if you ever need to.
