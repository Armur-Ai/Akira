// Yen's K-shortest loopless paths.
// Per iteration: for each prefix of the previously-found path, find the
// best spur path that diverges at that point; the smallest spur completion
// becomes the next k-th path.

import type { AkiraGraph } from './build-graph.js';
import { type PathResult, dijkstra } from './shortest-paths.js';

export function yensKShortestPaths(
  graph: AkiraGraph,
  source: string,
  target: string,
  k: number,
): PathResult[] {
  if (k <= 0) return [];
  const first = dijkstra(graph, source, target);
  if (!first) return [];

  const accepted: PathResult[] = [first];
  const candidates: PathResult[] = [];

  for (let kk = 1; kk < k; kk++) {
    const previous = accepted[kk - 1]!;
    for (let i = 0; i < previous.nodes.length - 1; i++) {
      const spurNode = previous.nodes[i]!;
      const rootPathNodes = previous.nodes.slice(0, i + 1);
      const rootPathEdges = previous.edges.slice(0, i);

      const forbiddenEdges = new Set<string>();
      for (const p of accepted) {
        // If a previously accepted path shares this exact root, forbid the next edge
        // it took — so we explore a genuinely different continuation.
        if (
          p.nodes.length > i + 1 &&
          p.nodes.slice(0, i + 1).every((n, j) => n === rootPathNodes[j])
        ) {
          const e = p.edges[i];
          if (e !== undefined) forbiddenEdges.add(e);
        }
      }

      // Forbid revisiting interior root nodes (loopless).
      const forbiddenNodes = new Set<string>(rootPathNodes.slice(0, -1));

      const spur = dijkstra(graph, spurNode, target, { forbiddenEdges, forbiddenNodes });
      if (!spur) continue;

      const totalNodes = [...rootPathNodes.slice(0, -1), ...spur.nodes];
      const totalEdges = [...rootPathEdges, ...spur.edges];

      let rootWeight = 0;
      for (const e of rootPathEdges) {
        const w = graph.getEdgeAttribute(e, 'weight');
        rootWeight += w;
      }
      const totalWeight = rootWeight + spur.weight;

      const signature = `${totalNodes.join('>')}|${totalEdges.join(',')}`;
      const alreadyQueued = candidates.some(
        (c) => `${c.nodes.join('>')}|${c.edges.join(',')}` === signature,
      );
      const alreadyAccepted = accepted.some(
        (c) => `${c.nodes.join('>')}|${c.edges.join(',')}` === signature,
      );
      if (alreadyQueued || alreadyAccepted) continue;

      candidates.push({ nodes: totalNodes, edges: totalEdges, weight: totalWeight });
    }

    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.weight - b.weight);
    accepted.push(candidates.shift()!);
  }

  return accepted;
}
