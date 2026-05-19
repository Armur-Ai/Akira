import type { AkiraGraph } from './build-graph.js';
import { MinHeap } from './heap.js';

export interface PathResult {
  nodes: string[];
  edges: string[];
  weight: number;
}

export interface DijkstraOptions {
  forbiddenEdges?: ReadonlySet<string>;
  forbiddenNodes?: ReadonlySet<string>;
}

export function dijkstra(
  graph: AkiraGraph,
  source: string,
  target: string,
  options: DijkstraOptions = {},
): PathResult | null {
  if (!graph.hasNode(source) || !graph.hasNode(target)) return null;
  const forbiddenEdges = options.forbiddenEdges ?? new Set<string>();
  const forbiddenNodes = options.forbiddenNodes ?? new Set<string>();
  if (forbiddenNodes.has(source) || forbiddenNodes.has(target)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: string }>();
  const visited = new Set<string>();

  dist.set(source, 0);
  const heap = new MinHeap<string>();
  heap.push(0, source);

  while (heap.size > 0) {
    const u = heap.pop();
    if (u === undefined) break;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === target) break;
    const du = dist.get(u) ?? Number.POSITIVE_INFINITY;

    graph.forEachOutboundEdge(u, (edgeKey, attrs, _src, dst) => {
      if (forbiddenEdges.has(edgeKey)) return;
      if (forbiddenNodes.has(dst)) return;
      const w = attrs.weight;
      if (!Number.isFinite(w)) return;
      const newDist = du + w;
      const prevDist = dist.get(dst) ?? Number.POSITIVE_INFINITY;
      if (newDist < prevDist) {
        dist.set(dst, newDist);
        prev.set(dst, { node: u, edge: edgeKey });
        heap.push(newDist, dst);
      }
    });
  }

  const finalDist = dist.get(target);
  if (finalDist === undefined || !Number.isFinite(finalDist)) return null;

  const nodes: string[] = [];
  const edges: string[] = [];
  let cur: string | undefined = target;
  while (cur !== undefined && cur !== source) {
    nodes.push(cur);
    const p = prev.get(cur);
    if (!p) return null;
    edges.push(p.edge);
    cur = p.node;
  }
  nodes.push(source);
  nodes.reverse();
  edges.reverse();
  return { nodes, edges, weight: finalDist };
}
