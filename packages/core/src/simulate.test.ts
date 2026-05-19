import { RunConfig, Scenario } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { simulate } from './simulate.js';

function ragLeak() {
  return Scenario.parse({
    id: 'rag-leak',
    name: 'RAG indirect prompt injection',
    nodes: [
      { id: 'web', type: 'service', label: 'web' },
      { id: 'rag', type: 'data', label: 'rag' },
      { id: 'llm', type: 'model', label: 'llm' },
      { id: 'pii', type: 'data', label: 'pii', criticality: 1 },
    ],
    edges: [
      { id: 'wr', from: 'web', to: 'rag', kind: 'data-flow', probability: 0.6, noise: 0.3 },
      { id: 'rl', from: 'rag', to: 'llm', kind: 'prompt-flow', probability: 0.7, noise: 0.5 },
      { id: 'lp', from: 'llm', to: 'pii', kind: 'data-flow', probability: 0.5, noise: 0.4 },
    ],
    entryPoints: ['web'],
    objectives: ['pii'],
  });
}

describe('simulate', () => {
  it('finds the expected attack path in deterministic mode', () => {
    const scenario = ragLeak();
    const result = simulate(scenario, RunConfig.parse({ mode: 'deterministic', topK: 5 }));
    expect(result.paths.length).toBe(1);
    const path = result.paths[0]!;
    expect(path.entry).toBe('web');
    expect(path.objective).toBe('pii');
    expect(path.steps.map((s) => s.edgeId)).toEqual(['wr', 'rl', 'lp']);
    expect(path.probability).toBeCloseTo(0.6 * 0.7 * 0.5);
    expect(result.metricsByObjective[0]!.reachable).toBe(true);
    expect(result.unreachable).toEqual([]);
  });

  it('reports unreachable when an edge is dead', () => {
    const scenario = ragLeak();
    scenario.edges[1]!.probability = 0;
    const result = simulate(scenario, RunConfig.parse({ mode: 'deterministic' }));
    expect(result.paths.length).toBe(0);
    expect(result.unreachable).toEqual(['pii']);
    expect(result.metricsByObjective[0]!.reachable).toBe(false);
  });

  it('is deterministic across Monte-Carlo runs with the same seed', () => {
    const scenario = ragLeak();
    const config = RunConfig.parse({ mode: 'monte-carlo', iterations: 500, seed: 12345 });
    const r1 = simulate(scenario, config);
    const r2 = simulate(scenario, config);
    expect(r1.metricsByObjective).toEqual(r2.metricsByObjective);
    expect(r1.unreachable).toEqual(r2.unreachable);
    expect(r1.paths.map((p) => p.score)).toEqual(r2.paths.map((p) => p.score));
  });

  it('Monte-Carlo reach probability approximates path probability for a single chain', () => {
    const scenario = ragLeak();
    const expected = 0.6 * 0.7 * 0.5;
    const config = RunConfig.parse({ mode: 'monte-carlo', iterations: 5000, seed: 1 });
    const result = simulate(scenario, config);
    const empirical = result.metricsByObjective[0]!.reachProbability;
    expect(empirical).toBeGreaterThan(expected - 0.04);
    expect(empirical).toBeLessThan(expected + 0.04);
  });

  it('a strong control collapses the attack path', () => {
    const scenario = ragLeak();
    scenario.controls = [
      {
        id: 'c-prompt-shield',
        name: 'Prompt shield',
        summary: '',
        target: { kind: 'edge', edgeKind: 'prompt-flow' },
        effect: { probabilityMultiplier: 0.01, detectionDelta: 0.5, costDelta: 5 },
        enabled: true,
      },
    ];
    const before = simulate(scenario, RunConfig.parse({ mode: 'deterministic' }));
    const beforeProb = before.paths[0]!.probability;

    const result = simulate(scenario, RunConfig.parse({ mode: 'deterministic' }));
    expect(result.paths[0]!.probability).toBeCloseTo(beforeProb);
    expect(result.paths[0]!.probability).toBeLessThan(0.01);
  });
});
