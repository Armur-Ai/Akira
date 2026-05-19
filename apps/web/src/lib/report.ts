import type { AttackPath, RunResult, Scenario } from '@akira/schema';
import { getTechnique } from '@akira/techniques';

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function nodeLabelLookup(scenario: Scenario) {
  const map = new Map(scenario.nodes.map((n) => [n.id, n.label]));
  return (id: string) => map.get(id) ?? id;
}

function describeTechnique(id: string): string {
  const t = getTechnique(id);
  if (!t) return id;
  const taxonomy = [
    ...t.taxonomy.mitreAttack.map((x) => `ATT&CK ${x}`),
    ...t.taxonomy.mitreAtlas.map((x) => `ATLAS ${x}`),
    ...t.taxonomy.owaspLlm.map((x) => `OWASP ${x}`),
  ].join(', ');
  return taxonomy ? `${t.name} (${taxonomy})` : t.name;
}

function pathBlock(path: AttackPath, idx: number, labelOf: (id: string) => string): string[] {
  const lines: string[] = [];
  lines.push(`### Path ${idx + 1} · ${labelOf(path.entry)} → ${labelOf(path.objective)}`);
  lines.push('');
  lines.push(
    `Score **${path.score.toFixed(3)}** · probability **${pct(path.probability)}** · detection ${pct(path.detection)} · cost ${path.cost.toFixed(1)} · ${path.steps.length} steps.`,
  );
  lines.push('');
  lines.push('| # | From → To | Techniques | p | det | cost |');
  lines.push('|---|-----------|-----------|---|-----|------|');
  for (const [i, step] of path.steps.entries()) {
    const techniques = step.techniqueIds.length
      ? step.techniqueIds.map(describeTechnique).join('; ')
      : '_(none)_';
    lines.push(
      `| ${i + 1} | ${labelOf(step.from)} → ${labelOf(step.to)} | ${techniques} | ${pct(step.probability)} | — | ${step.cost.toFixed(1)} |`,
    );
  }
  lines.push('');
  return lines;
}

export function buildMarkdownReport(scenario: Scenario, run: RunResult): string {
  const lines: string[] = [];
  const labelOf = nodeLabelLookup(scenario);
  const now = new Date().toISOString();

  lines.push(`# ${scenario.name}`);
  lines.push('');
  lines.push('_Akira attack-path simulation report_');
  lines.push('');
  if (scenario.description) {
    lines.push(scenario.description);
    lines.push('');
  }
  lines.push(
    `Generated ${now}. Scenario version ${scenario.version}. Wall time ${run.wallTimeMs}ms.`,
  );
  lines.push('');

  // Run config
  lines.push('## Run');
  lines.push('');
  lines.push(`- Mode: \`${run.mode}\``);
  lines.push(`- Iterations: ${run.iterations}`);
  lines.push(`- Seed: ${run.seed}`);
  lines.push(`- Scenario id: \`${run.scenarioId}\``);
  lines.push('');

  // Scenario shape
  lines.push('## Scenario shape');
  lines.push('');
  lines.push(`- ${scenario.nodes.length} nodes, ${scenario.edges.length} edges`);
  lines.push(
    `- ${scenario.entryPoints.length} entry point(s), ${scenario.objectives.length} objective(s)`,
  );
  lines.push(`- ${scenario.controls.filter((c) => c.enabled).length} active control(s)`);
  lines.push('');

  // Entry / objectives
  lines.push('### Entry points');
  lines.push('');
  for (const id of scenario.entryPoints) lines.push(`- ${labelOf(id)}`);
  if (scenario.entryPoints.length === 0) lines.push('_(none)_');
  lines.push('');
  lines.push('### Objectives');
  lines.push('');
  for (const id of scenario.objectives) lines.push(`- ${labelOf(id)}`);
  if (scenario.objectives.length === 0) lines.push('_(none)_');
  lines.push('');

  // Active controls
  const active = scenario.controls.filter((c) => c.enabled);
  if (active.length > 0) {
    lines.push('## Active controls');
    lines.push('');
    for (const c of active) {
      lines.push(
        `- **${c.name}** — probability × ${c.effect.probabilityMultiplier.toFixed(2)}, detection ${c.effect.detectionDelta >= 0 ? '+' : ''}${c.effect.detectionDelta.toFixed(2)}, cost +${c.effect.costDelta.toFixed(1)}`,
      );
      if (c.summary) lines.push(`  ${c.summary}`);
    }
    lines.push('');
  }

  // Objective metrics
  lines.push('## Per-objective results');
  lines.push('');
  lines.push('| Objective | Reachable | Reach probability | Paths | Best score |');
  lines.push('|-----------|-----------|-------------------|-------|------------|');
  for (const m of run.metricsByObjective) {
    lines.push(
      `| ${labelOf(m.objective)} | ${m.reachable ? '✓' : '—'} | ${pct(m.reachProbability)} | ${m.pathCount} | ${m.bestPathScore === null ? '—' : m.bestPathScore.toFixed(3)} |`,
    );
  }
  lines.push('');

  // Top paths
  if (run.paths.length > 0) {
    lines.push('## Top attack paths');
    lines.push('');
    for (const [i, p] of run.paths.slice(0, 10).entries()) {
      lines.push(...pathBlock(p, i, labelOf));
    }
  } else {
    lines.push('## Top attack paths');
    lines.push('');
    lines.push('_No reachable paths were found for any objective._');
    lines.push('');
  }

  // Chokepoints
  if (run.chokepoints.length > 0) {
    lines.push('## Chokepoints');
    lines.push('');
    lines.push(
      'Entities that appear on the largest share of top paths. Defending these is highest leverage.',
    );
    lines.push('');
    lines.push('| Kind | Entity | Coverage | Paths |');
    lines.push('|------|--------|----------|-------|');
    for (const c of run.chokepoints.slice(0, 10)) {
      const label = c.kind === 'node' ? labelOf(c.id) : c.id;
      lines.push(`| ${c.kind} | ${label} | ${pct(c.coverageRatio)} | ${c.pathsCovered} |`);
    }
    lines.push('');
  }

  // Unreachable
  if (run.unreachable.length > 0) {
    lines.push('## Unreachable objectives');
    lines.push('');
    for (const id of run.unreachable) lines.push(`- ${labelOf(id)}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('Akira · attack-path simulator for the post-AI world.');

  return lines.join('\n');
}

export function downloadMarkdownReport(scenario: Scenario, run: RunResult): void {
  const md = buildMarkdownReport(scenario, run);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.id}-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
