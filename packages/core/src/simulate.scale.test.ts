import { RunConfig } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { simulate } from './simulate.js';
import { syntheticScenario } from './synthetic.js';

// Budgets are intentionally loose: enough to catch a 5–10× regression
// without flapping on slow CI runners. Local Apple-silicon machines run
// the 500-node deterministic case in ~100ms.
declare const process: { env: { CI?: string } };
const BUDGET_MULTIPLIER = process.env.CI ? 5 : 1;

describe('simulate · scale', () => {
  it('runs deterministic mode on a 100-node DAG well under budget', () => {
    const scenario = syntheticScenario({ nodes: 100, edgesPerNode: 3, seed: 1 });
    const start = Date.now();
    const result = simulate(scenario, RunConfig.parse({ mode: 'deterministic', topK: 5 }));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500 * BUDGET_MULTIPLIER);
    // We picked a layered DAG with the objective at the far end — should be
    // reachable.
    expect(result.metricsByObjective[0]?.reachable).toBe(true);
    expect(result.paths.length).toBeGreaterThan(0);
  });

  it('runs deterministic mode on a 500-node DAG within budget', () => {
    const scenario = syntheticScenario({ nodes: 500, edgesPerNode: 3, seed: 1 });
    const start = Date.now();
    const result = simulate(scenario, RunConfig.parse({ mode: 'deterministic', topK: 5 }));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000 * BUDGET_MULTIPLIER);
    expect(result.paths.length).toBeGreaterThan(0);
  });

  it('runs Monte-Carlo on a 100-node DAG with 500 iterations', () => {
    const scenario = syntheticScenario({ nodes: 100, edgesPerNode: 3, seed: 1 });
    const start = Date.now();
    const result = simulate(
      scenario,
      RunConfig.parse({ mode: 'monte-carlo', iterations: 500, seed: 7 }),
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1500 * BUDGET_MULTIPLIER);
    expect(result.metricsByObjective[0]?.reachProbability).toBeGreaterThanOrEqual(0);
  });

  it('Monte-Carlo with the same seed is bit-for-bit reproducible at scale', () => {
    const scenario = syntheticScenario({ nodes: 200, edgesPerNode: 2, seed: 42 });
    const cfg = RunConfig.parse({ mode: 'monte-carlo', iterations: 300, seed: 99 });
    const a = simulate(scenario, cfg);
    const b = simulate(scenario, cfg);
    expect(a.metricsByObjective).toEqual(b.metricsByObjective);
    expect(a.paths.map((p) => p.score)).toEqual(b.paths.map((p) => p.score));
  });
});
