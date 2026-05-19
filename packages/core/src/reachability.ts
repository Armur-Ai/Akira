import type { AkiraGraph } from './build-graph.js';

export function reachableFrom(graph: AkiraGraph, entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const e of entries) {
    if (graph.hasNode(e) && !seen.has(e)) {
      seen.add(e);
      queue.push(e);
    }
  }
  while (queue.length > 0) {
    const u = queue.shift()!;
    graph.forEachOutboundEdge(u, (_edgeKey, attrs, _src, dst) => {
      if (attrs.probability <= 0) return;
      if (seen.has(dst)) return;
      seen.add(dst);
      queue.push(dst);
    });
  }
  return seen;
}
