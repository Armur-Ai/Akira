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

// -------------------- HTML / print variant --------------------

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });

function pathBlockHtml(path: AttackPath, idx: number, labelOf: (id: string) => string): string {
  const rows = path.steps
    .map((step, i) => {
      const techniques = step.techniqueIds.length
        ? step.techniqueIds.map((id) => escapeHtml(describeTechnique(id))).join('; ')
        : '<span class="muted">(none)</span>';
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(labelOf(step.from))} → ${escapeHtml(labelOf(step.to))}</td>
        <td>${techniques}</td>
        <td>${pct(step.probability)}</td>
        <td>${step.cost.toFixed(1)}</td>
      </tr>`;
    })
    .join('');
  return `<h3>Path ${idx + 1} · ${escapeHtml(labelOf(path.entry))} → ${escapeHtml(labelOf(path.objective))}</h3>
  <p>Score <strong>${path.score.toFixed(3)}</strong> · probability <strong>${pct(path.probability)}</strong> ·
  detection ${pct(path.detection)} · cost ${path.cost.toFixed(1)} · ${path.steps.length} steps.</p>
  <table>
    <thead><tr><th>#</th><th>From → To</th><th>Techniques</th><th>p</th><th>cost</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function buildHtmlReport(scenario: Scenario, run: RunResult): string {
  const labelOf = nodeLabelLookup(scenario);
  const now = new Date().toISOString();

  const objectiveRows = run.metricsByObjective
    .map(
      (m) => `<tr>
      <td>${escapeHtml(labelOf(m.objective))}</td>
      <td>${m.reachable ? '✓' : '—'}</td>
      <td>${pct(m.reachProbability)}</td>
      <td>${m.pathCount}</td>
      <td>${m.bestPathScore === null ? '—' : m.bestPathScore.toFixed(3)}</td>
    </tr>`,
    )
    .join('');

  const pathsHtml =
    run.paths.length > 0
      ? run.paths
          .slice(0, 10)
          .map((p, i) => pathBlockHtml(p, i, labelOf))
          .join('')
      : '<p><em>No reachable paths were found for any objective.</em></p>';

  const chokepointsHtml =
    run.chokepoints.length > 0
      ? `<h2>Chokepoints</h2>
        <p>Entities on the largest share of top paths.</p>
        <table>
          <thead><tr><th>Kind</th><th>Entity</th><th>Coverage</th><th>Paths</th></tr></thead>
          <tbody>${run.chokepoints
            .slice(0, 10)
            .map((c) => {
              const label = c.kind === 'node' ? labelOf(c.id) : c.id;
              return `<tr>
                <td>${c.kind}</td>
                <td>${escapeHtml(label)}</td>
                <td>${pct(c.coverageRatio)}</td>
                <td>${c.pathsCovered}</td>
              </tr>`;
            })
            .join('')}</tbody>
        </table>`
      : '';

  const activeControls = scenario.controls.filter((c) => c.enabled);
  const controlsHtml =
    activeControls.length > 0
      ? `<h2>Active controls</h2>
        <ul>${activeControls
          .map(
            (c) =>
              `<li><strong>${escapeHtml(c.name)}</strong> — probability × ${c.effect.probabilityMultiplier.toFixed(2)},
              detection ${c.effect.detectionDelta >= 0 ? '+' : ''}${c.effect.detectionDelta.toFixed(2)},
              cost +${c.effect.costDelta.toFixed(1)}${
                c.summary ? `<br><span class="muted">${escapeHtml(c.summary)}</span>` : ''
              }</li>`,
          )
          .join('')}</ul>`
      : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(scenario.name)} — Akira report</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 880px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.55; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    h2 { margin-top: 32px; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { margin-top: 24px; font-size: 15px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 20px; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; }
    p { margin: 8px 0 12px; }
    ul { margin: 4px 0 16px; padding-left: 22px; }
    .meta { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; color: #666; margin: 6px 0 24px; }
    .muted { color: #666; }
    em { color: #555; }
    @media print {
      body { margin: 0; padding: 16px 22px; font-size: 12px; }
      h1 { font-size: 22px; }
      h2 { font-size: 16px; margin-top: 22px; }
      h3 { font-size: 14px; margin-top: 16px; page-break-after: avoid; }
      table { font-size: 11px; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(scenario.name)}</h1>
  <p class="muted"><em>Akira attack-path simulation report</em></p>
  ${scenario.description ? `<p>${escapeHtml(scenario.description)}</p>` : ''}
  <p class="meta">Generated ${now} · scenario v${scenario.version} · wall time ${run.wallTimeMs}ms · mode <code>${run.mode}</code> · seed ${run.seed} · iterations ${run.iterations}</p>

  <h2>Scenario shape</h2>
  <ul>
    <li>${scenario.nodes.length} nodes, ${scenario.edges.length} edges</li>
    <li>${scenario.entryPoints.length} entry point(s), ${scenario.objectives.length} objective(s)</li>
    <li>${activeControls.length} active control(s)</li>
  </ul>

  ${controlsHtml}

  <h2>Per-objective results</h2>
  <table>
    <thead><tr><th>Objective</th><th>Reachable</th><th>Reach probability</th><th>Paths</th><th>Best score</th></tr></thead>
    <tbody>${objectiveRows}</tbody>
  </table>

  <h2>Top attack paths</h2>
  ${pathsHtml}

  ${chokepointsHtml}

  ${
    run.unreachable.length > 0
      ? `<h2>Unreachable objectives</h2><ul>${run.unreachable
          .map((id) => `<li>${escapeHtml(labelOf(id))}</li>`)
          .join('')}</ul>`
      : ''
  }

  <hr style="margin-top: 40px; border: 0; border-top: 1px solid #ddd;">
  <p class="muted">Akira · attack-path simulator for the post-AI world.</p>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 200);
    });
  </script>
</body>
</html>`;
}

export function openPrintableReport(scenario: Scenario, run: RunResult): void {
  const html = buildHtmlReport(scenario, run);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Pop-up blocked — fall back to download.
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.id}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  // Release after the new window has had time to load.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
