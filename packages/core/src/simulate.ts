import type {
  AttackPath,
  ObjectiveMetrics,
  PathStep,
  RunConfig,
  RunResult,
  Scenario,
} from '@akira/schema';
import { assertScenarioValid } from './assert.js';
import type { AkiraGraph, EdgeAttrs } from './build-graph.js';
import { buildGraph } from './build-graph.js';
import { computeChokepoints } from './chokepoints.js';
import { applyControls } from './controls.js';
import { yensKShortestPaths } from './k-shortest-paths.js';
import { mulberry32 } from './prng.js';
import { reachableFrom } from './reachability.js';

function pathStepsFromEdges(graph: AkiraGraph, edges: readonly string[]): PathStep[] {
  return edges.map((edgeId) => {
    const attrs = graph.getEdgeAttributes(edgeId) as EdgeAttrs;
    const [from, to] = graph.extremities(edgeId);
    return {
      edgeId,
      from,
      to,
      techniqueIds: attrs.techniqueIds,
      probability: attrs.probability,
      cost: attrs.cost,
    };
  });
}

function pathProbability(steps: readonly PathStep[]): number {
  return steps.reduce((p, s) => p * s.probability, 1);
}

function pathCost(steps: readonly PathStep[]): number {
  return steps.reduce((c, s) => c + s.cost, 0);
}

function pathDetection(graph: AkiraGraph, edges: readonly string[]): number {
  // P(not detected) = prod(1 - per-edge detection). Total detection = 1 - that.
  let undetected = 1;
  for (const e of edges) {
    const attrs = graph.getEdgeAttributes(e) as EdgeAttrs;
    undetected *= 1 - attrs.detection;
  }
  return 1 - undetected;
}

function scorePath(probability: number, detection: number, cost: number): number {
  // Higher = scarier. Successful, stealthy, cheap attacks score highest.
  // cost normalisation: avoid div-by-zero; subtract a log penalty.
  return probability * (1 - detection) - 0.01 * Math.log1p(cost);
}

function simulateDeterministic(
  scenario: Scenario,
  config: RunConfig,
  graph: AkiraGraph,
): { paths: AttackPath[]; metrics: ObjectiveMetrics[]; unreachable: string[] } {
  const paths: AttackPath[] = [];
  const metrics: ObjectiveMetrics[] = [];
  const reachable = reachableFrom(graph, scenario.entryPoints);
  const unreachable: string[] = [];

  for (const objective of scenario.objectives) {
    let bestScore: number | null = null;
    let pathCount = 0;
    let reachProbability = 0;
    const objectiveReachable = reachable.has(objective);

    if (!objectiveReachable) {
      unreachable.push(objective);
    } else {
      // Find top-K paths from every entry; merge & rank.
      const objectivePaths: AttackPath[] = [];
      for (const entry of scenario.entryPoints) {
        const found = yensKShortestPaths(graph, entry, objective, config.topK);
        for (const p of found) {
          const steps = pathStepsFromEdges(graph, p.edges);
          if (steps.length === 0) continue;
          const probability = pathProbability(steps);
          if (probability <= 0) continue;
          const cost = pathCost(steps);
          const detection = pathDetection(graph, p.edges);
          const score = scorePath(probability, detection, cost);
          objectivePaths.push({
            id: `${entry}->${objective}#${objectivePaths.length}`,
            entry,
            objective,
            steps,
            probability,
            cost,
            detection,
            score,
          });
        }
      }
      objectivePaths.sort((a, b) => b.score - a.score);
      const top = objectivePaths.slice(0, config.topK);
      paths.push(...top);
      pathCount = top.length;
      if (top.length > 0) {
        bestScore = top[0]!.score;
        // Crude reachProbability for deterministic mode: max single-path probability.
        reachProbability = Math.max(...top.map((p) => p.probability));
      }
    }

    metrics.push({
      objective,
      reachable: objectiveReachable && pathCount > 0,
      reachProbability,
      bestPathScore: bestScore,
      pathCount,
    });
  }

  return { paths, metrics, unreachable };
}

function simulateMonteCarlo(
  scenario: Scenario,
  config: RunConfig,
  graph: AkiraGraph,
): { paths: AttackPath[]; metrics: ObjectiveMetrics[]; unreachable: string[] } {
  const rng = mulberry32(config.seed);
  const objectives = scenario.objectives;
  const entries = scenario.entryPoints;
  const hitsPerObjective = new Map<string, number>(objectives.map((o) => [o, 0]));
  // Track best (highest-prob) realised path per (entry, objective).
  const bestPath = new Map<string, AttackPath>();

  for (let i = 0; i < config.iterations; i++) {
    const liveEdges = new Set<string>();
    graph.forEachEdge((edgeKey, attrs) => {
      if (rng.bool(attrs.probability)) liveEdges.add(edgeKey);
    });

    // BFS per entry over live edges, recording parent edges.
    for (const entry of entries) {
      if (!graph.hasNode(entry)) continue;
      const parent = new Map<string, { node: string; edge: string }>();
      const seen = new Set<string>([entry]);
      const queue: string[] = [entry];
      while (queue.length > 0) {
        const u = queue.shift()!;
        graph.forEachOutboundEdge(u, (edgeKey, _attrs, _src, dst) => {
          if (!liveEdges.has(edgeKey)) return;
          if (seen.has(dst)) return;
          seen.add(dst);
          parent.set(dst, { node: u, edge: edgeKey });
          queue.push(dst);
        });
      }
      for (const objective of objectives) {
        if (!seen.has(objective)) continue;
        hitsPerObjective.set(objective, (hitsPerObjective.get(objective) ?? 0) + 1);
        // Reconstruct.
        const edges: string[] = [];
        let cur: string | undefined = objective;
        while (cur !== undefined && cur !== entry) {
          const p = parent.get(cur);
          if (!p) break;
          edges.push(p.edge);
          cur = p.node;
        }
        edges.reverse();
        const steps = pathStepsFromEdges(graph, edges);
        const probability = pathProbability(steps);
        const cost = pathCost(steps);
        const detection = pathDetection(graph, edges);
        const score = scorePath(probability, detection, cost);
        const key = `${entry}->${objective}`;
        const existing = bestPath.get(key);
        if (!existing || score > existing.score) {
          bestPath.set(key, {
            id: key,
            entry,
            objective,
            steps,
            probability,
            cost,
            detection,
            score,
          });
        }
      }
    }
  }

  const metrics: ObjectiveMetrics[] = objectives.map((objective) => {
    const hits = hitsPerObjective.get(objective) ?? 0;
    const reachProbability = hits / (config.iterations * Math.max(entries.length, 1));
    const candidatePaths = [...bestPath.values()].filter((p) => p.objective === objective);
    const bestScore =
      candidatePaths.length > 0 ? Math.max(...candidatePaths.map((p) => p.score)) : null;
    return {
      objective,
      reachable: hits > 0,
      reachProbability,
      bestPathScore: bestScore,
      pathCount: candidatePaths.length,
    };
  });

  const unreachable = objectives.filter((o) => (hitsPerObjective.get(o) ?? 0) === 0);
  const paths = [...bestPath.values()].sort((a, b) => b.score - a.score);
  return { paths, metrics, unreachable };
}

export function simulate(scenario: Scenario, config: RunConfig): RunResult {
  assertScenarioValid(scenario);
  const start = Date.now();
  const effective = applyControls(scenario);
  const graph = buildGraph(scenario, effective);

  const { paths, metrics, unreachable } =
    config.mode === 'deterministic'
      ? simulateDeterministic(scenario, config, graph)
      : simulateMonteCarlo(scenario, config, graph);

  const chokepoints = computeChokepoints(paths);

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed: config.seed,
    mode: config.mode,
    iterations: config.iterations,
    paths,
    metricsByObjective: metrics,
    chokepoints,
    unreachable,
    wallTimeMs: Date.now() - start,
  };
}
