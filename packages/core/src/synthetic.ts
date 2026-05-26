import { Scenario } from '@akira/schema';
import type { Edge, Node, Scenario as ScenarioType } from '@akira/schema';
import { mulberry32 } from './prng.js';

export interface SyntheticConfig {
  nodes: number;
  /** Average out-degree per node (capped by remaining nodes). */
  edgesPerNode: number;
  seed: number;
}

// Builds a layered DAG of `nodes` nodes laid out left-to-right. Each node has
// up to `edgesPerNode` forward edges to a random later node, with random
// probability/noise. Useful for scale-testing the simulator without bespoke
// scenario authoring.
export function syntheticScenario(config: SyntheticConfig): ScenarioType {
  const { nodes: nNodes, edgesPerNode, seed } = config;
  const rng = mulberry32(seed);
  const ids = Array.from({ length: nNodes }, (_, i) => `n${i}`);

  const nodes: Node[] = ids.map((id, i) => ({
    id,
    type: 'service' as const,
    label: id,
    meta: {},
    tags: [],
    criticality: 0,
    position: { x: (i % 40) * 80, y: Math.floor(i / 40) * 80 },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nNodes - 1; i++) {
    const remaining = nNodes - i - 1;
    const fanout = Math.min(edgesPerNode, remaining);
    const targetsSeen = new Set<number>();
    for (let k = 0; k < fanout; k++) {
      let target: number;
      let attempts = 0;
      do {
        target = i + 1 + rng.int(remaining);
        attempts++;
      } while (targetsSeen.has(target) && attempts < 8);
      targetsSeen.add(target);
      edges.push({
        id: `e${i}-${k}`,
        from: ids[i]!,
        to: ids[target]!,
        kind: 'data-flow',
        techniqueIds: [],
        probability: 0.3 + rng.next() * 0.6,
        cost: 1,
        noise: rng.next(),
        requires: [],
        meta: {},
      });
    }
  }

  return Scenario.parse({
    id: `synth-${nNodes}`,
    name: `synthetic ${nNodes} nodes`,
    nodes,
    edges,
    entryPoints: [ids[0]!],
    objectives: [ids[nNodes - 1]!],
  });
}
