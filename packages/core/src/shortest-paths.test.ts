import { Scenario } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { buildGraph } from './build-graph.js';
import { applyControls } from './controls.js';
import { yensKShortestPaths } from './k-shortest-paths.js';
import { dijkstra } from './shortest-paths.js';

// Diamond: A -> B -> D and A -> C -> D, where A-B-D is higher probability
// (= lower neg-log-prob weight) than A-C-D.
function diamond() {
  const scenario = Scenario.parse({
    id: 'd',
    name: 'diamond',
    nodes: [
      { id: 'A', type: 'service', label: 'A' },
      { id: 'B', type: 'service', label: 'B' },
      { id: 'C', type: 'service', label: 'C' },
      { id: 'D', type: 'data', label: 'D' },
    ],
    edges: [
      { id: 'ab', from: 'A', to: 'B', kind: 'network-reach', probability: 0.9 },
      { id: 'bd', from: 'B', to: 'D', kind: 'data-flow', probability: 0.9 },
      { id: 'ac', from: 'A', to: 'C', kind: 'network-reach', probability: 0.3 },
      { id: 'cd', from: 'C', to: 'D', kind: 'data-flow', probability: 0.3 },
    ],
    entryPoints: ['A'],
    objectives: ['D'],
  });
  return buildGraph(scenario, applyControls(scenario));
}

describe('dijkstra', () => {
  it('finds the highest-probability path in a diamond', () => {
    const graph = diamond();
    const path = dijkstra(graph, 'A', 'D');
    expect(path).not.toBeNull();
    expect(path!.nodes).toEqual(['A', 'B', 'D']);
    expect(path!.edges).toEqual(['ab', 'bd']);
  });

  it('returns null when target is unreachable', () => {
    const graph = diamond();
    graph.dropEdge('ab');
    graph.dropEdge('ac');
    const path = dijkstra(graph, 'A', 'D');
    expect(path).toBeNull();
  });

  it('skips edges with probability 0', () => {
    const scenario = Scenario.parse({
      id: 'p0',
      name: 'p0',
      nodes: [
        { id: 'A', type: 'service', label: 'A' },
        { id: 'B', type: 'service', label: 'B' },
      ],
      edges: [{ id: 'e', from: 'A', to: 'B', kind: 'trust', probability: 0 }],
    });
    const graph = buildGraph(scenario, applyControls(scenario));
    expect(dijkstra(graph, 'A', 'B')).toBeNull();
  });

  it('forbidden edges are ignored', () => {
    const graph = diamond();
    const detour = dijkstra(graph, 'A', 'D', { forbiddenEdges: new Set(['ab']) });
    expect(detour!.nodes).toEqual(['A', 'C', 'D']);
  });
});

describe('yensKShortestPaths', () => {
  it('returns paths in order of decreasing total probability', () => {
    const graph = diamond();
    const paths = yensKShortestPaths(graph, 'A', 'D', 5);
    expect(paths.length).toBe(2);
    expect(paths[0]!.nodes).toEqual(['A', 'B', 'D']);
    expect(paths[1]!.nodes).toEqual(['A', 'C', 'D']);
    expect(paths[0]!.weight).toBeLessThan(paths[1]!.weight);
  });

  it('returns empty when no path exists', () => {
    const graph = diamond();
    graph.dropEdge('ab');
    graph.dropEdge('ac');
    expect(yensKShortestPaths(graph, 'A', 'D', 5)).toEqual([]);
  });
});
