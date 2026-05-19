import type { Scenario } from '@akira/schema';
import { MultiDirectedGraph } from 'graphology';
import type { EffectiveEdge } from './controls.js';

export interface EdgeAttrs {
  edgeId: string;
  kind: EffectiveEdge['kind'];
  techniqueIds: string[];
  probability: number;
  cost: number;
  detection: number;
  weight: number;
  controlsApplied: string[];
}

export interface NodeAttrs {
  type: string;
  label: string;
  criticality: number;
  tags: string[];
}

export type AkiraGraph = MultiDirectedGraph<NodeAttrs, EdgeAttrs>;

// Map probability to a Dijkstra-friendly additive weight.
// path probability = prod(p_i)  ⇒  log = sum(log p_i)  ⇒  -log = sum(-log p_i)
// minimising sum(-log p) maximises product(p).
// p=0 is a dead edge → +Infinity; p=1 is free → 0.
export function probabilityToWeight(p: number): number {
  if (p <= 0) return Number.POSITIVE_INFINITY;
  if (p >= 1) return 0;
  return -Math.log(p);
}

export function buildGraph(scenario: Scenario, effective: EffectiveEdge[]): AkiraGraph {
  const graph: AkiraGraph = new MultiDirectedGraph();
  for (const node of scenario.nodes) {
    graph.addNode(node.id, {
      type: node.type,
      label: node.label,
      criticality: node.criticality,
      tags: node.tags,
    });
  }
  for (const edge of effective) {
    graph.addEdgeWithKey(edge.id, edge.from, edge.to, {
      edgeId: edge.id,
      kind: edge.kind,
      techniqueIds: edge.techniqueIds,
      probability: edge.probability,
      cost: edge.cost,
      detection: edge.detection,
      weight: probabilityToWeight(edge.probability),
      controlsApplied: edge.controlsApplied,
    });
  }
  return graph;
}
