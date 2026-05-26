import { simulate } from '@akira/core';
import type { RunConfig, RunResult, Scenario } from '@akira/schema';

export interface ControlImpact {
  controlId: string;
  controlName: string;
  /** Top-path probability across all objectives if this single control is turned off. */
  probabilityWithoutControl: number;
  /** Top-path probability with the current control set (baseline). */
  baseline: number;
  /** withoutControl - baseline. Positive means the control is keeping risk down. */
  delta: number;
}

function topProbability(run: RunResult): number {
  let best = 0;
  for (const p of run.paths) if (p.probability > best) best = p.probability;
  return best;
}

export function analyseControlImpact(
  scenario: Scenario,
  config: RunConfig,
): { baseline: number; impacts: ControlImpact[] } {
  const enabledControls = scenario.controls.filter((c) => c.enabled);
  const baselineRun = simulate(scenario, config);
  const baseline = topProbability(baselineRun);

  const impacts: ControlImpact[] = [];
  for (const c of enabledControls) {
    const withoutScenario: Scenario = {
      ...scenario,
      controls: scenario.controls.map((cc) => (cc.id === c.id ? { ...cc, enabled: false } : cc)),
    };
    let prob = 0;
    try {
      const run = simulate(withoutScenario, config);
      prob = topProbability(run);
    } catch {
      // If a scenario validation issue stops the sim, treat the control as
      // having no measurable effect rather than crashing the whole analysis.
      prob = baseline;
    }
    impacts.push({
      controlId: c.id,
      controlName: c.name,
      probabilityWithoutControl: prob,
      baseline,
      delta: prob - baseline,
    });
  }

  impacts.sort((a, b) => b.delta - a.delta);
  return { baseline, impacts };
}
