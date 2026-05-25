import type { AttackPath, ObjectiveMetrics, RunResult } from '@akira/schema';
import { ArrowDown, ArrowUp, Download, Flame } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { downloadMarkdownReport } from '../../lib/report.js';
import { useRunStore } from '../../state/run-store.js';
import { useScenarioStore } from '../../state/scenario-store.js';

interface Props {
  scenarioId: string;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Delta({ from, to }: { from: number | null | undefined; to: number }) {
  if (from === null || from === undefined) return null;
  const delta = to - from;
  if (Math.abs(delta) < 0.0005) return null;
  const Icon = delta > 0 ? ArrowUp : ArrowDown;
  const colour = delta > 0 ? 'text-danger' : 'text-good';
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-[10px]', colour)}
      title="Change from previous run"
    >
      <Icon className="h-2.5 w-2.5" />
      {pct(Math.abs(delta))}
    </span>
  );
}

function ObjectiveRow({
  metric,
  prev,
  label,
}: {
  metric: ObjectiveMetrics;
  prev?: ObjectiveMetrics | undefined;
  label: string;
}) {
  return (
    <li className="text-sm flex items-center justify-between gap-2">
      <span className="truncate">{label}</span>
      {metric.reachable ? (
        <span className="flex items-center gap-1.5 text-xs">
          <span className="text-good">
            {pct(metric.reachProbability)} · {metric.pathCount} paths
          </span>
          <Delta from={prev?.reachProbability} to={metric.reachProbability} />
        </span>
      ) : (
        <span className="text-fg-muted text-xs">unreachable</span>
      )}
    </li>
  );
}

function bestPathForObjective(
  run: RunResult | undefined,
  objective: string,
): AttackPath | undefined {
  if (!run) return undefined;
  return run.paths.find((p) => p.objective === objective);
}

function PathCard({
  path,
  selected,
  onSelect,
  previousProbability,
  nodeLabelById,
}: {
  path: AttackPath;
  selected: boolean;
  onSelect: () => void;
  previousProbability: number | undefined;
  nodeLabelById: Map<string, string>;
}) {
  const entryLabel = nodeLabelById.get(path.entry) ?? path.entry;
  const objectiveLabel = nodeLabelById.get(path.objective) ?? path.objective;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2 rounded border transition',
        selected
          ? 'border-accent bg-accent/10'
          : 'border-border hover:border-fg-muted hover:bg-bg-elev',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium truncate">
          {entryLabel} → {objectiveLabel}
        </div>
        <div className="text-xs text-fg-muted shrink-0">{path.steps.length} steps</div>
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-fg-muted">
        <div className="flex items-center gap-1">
          <span className="text-fg">p</span> {pct(path.probability)}
          <Delta from={previousProbability} to={path.probability} />
        </div>
        <div>
          <span className="text-fg">det</span> {pct(path.detection)}
        </div>
        <div>
          <span className="text-fg">cost</span> {path.cost.toFixed(1)}
        </div>
      </div>
    </button>
  );
}

export function RunResults({ scenarioId }: Props) {
  const run = useRunStore((s) => s.runs[scenarioId]);
  const previousRun = useRunStore((s) => s.previousRuns[scenarioId]);
  const selectedPathId = useRunStore((s) => s.selectedPathByScenario[scenarioId] ?? null);
  const overlay = useRunStore((s) => s.overlayByScenario[scenarioId] ?? 'none');
  const setSelectedPath = useRunStore((s) => s.setSelectedPath);
  const setOverlay = useRunStore((s) => s.setOverlay);
  const clearRun = useRunStore((s) => s.clearRun);
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);

  if (!run) {
    return (
      <div className="p-4 text-sm text-fg-muted space-y-2">
        <p>No run yet.</p>
        <p className="text-xs">
          Mark an entry point and an objective, then click <span className="text-fg">Run</span>.
        </p>
      </div>
    );
  }

  const nodeLabelById = new Map(scenario?.nodes.map((n) => [n.id, n.label]) ?? []);
  const prevByObjective = new Map(
    previousRun?.metricsByObjective.map((m) => [m.objective, m]) ?? [],
  );

  return (
    <div className="p-4 space-y-5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Run · {run.mode === 'monte-carlo' ? `${run.iterations} iters` : 'deterministic'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOverlay(scenarioId, overlay === 'heatmap' ? 'none' : 'heatmap')}
            className={cn(
              'flex items-center gap-1 text-xs transition',
              overlay === 'heatmap' ? 'text-warning' : 'text-fg-muted hover:text-fg',
            )}
            title="Toggle chokepoint heatmap on canvas"
          >
            <Flame className="h-3 w-3" />
            Heatmap
          </button>
          <button
            type="button"
            onClick={() => scenario && downloadMarkdownReport(scenario, run)}
            disabled={!scenario}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition disabled:opacity-40"
            title="Download Markdown report"
          >
            <Download className="h-3 w-3" />
            Report
          </button>
          <button
            type="button"
            onClick={() => clearRun(scenarioId)}
            className="text-xs text-fg-muted hover:text-danger transition"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="text-[11px] text-fg-muted font-mono">
        seed {run.seed} · {run.wallTimeMs}ms{previousRun ? ' · diff vs prior run' : ''}
      </div>

      <section className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-fg-muted font-semibold">Objectives</h4>
        <ul className="space-y-1">
          {run.metricsByObjective.map((m) => (
            <ObjectiveRow
              key={m.objective}
              metric={m}
              prev={prevByObjective.get(m.objective)}
              label={nodeLabelById.get(m.objective) ?? m.objective}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-fg-muted font-semibold">
          Top paths · {run.paths.length}
        </h4>
        <div className="space-y-1.5">
          {run.paths.slice(0, 10).map((p) => (
            <PathCard
              key={p.id}
              path={p}
              selected={selectedPathId === p.id}
              onSelect={() => setSelectedPath(scenarioId, selectedPathId === p.id ? null : p.id)}
              previousProbability={bestPathForObjective(previousRun, p.objective)?.probability}
              nodeLabelById={nodeLabelById}
            />
          ))}
        </div>
      </section>

      {run.chokepoints.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-fg-muted font-semibold">
            Chokepoints
          </h4>
          <ul className="space-y-1 text-xs">
            {run.chokepoints.slice(0, 6).map((c) => (
              <li key={`${c.kind}:${c.id}`} className="flex items-center justify-between">
                <span className="truncate">
                  <span className="text-fg-muted">{c.kind}</span>{' '}
                  {c.kind === 'node' ? (nodeLabelById.get(c.id) ?? c.id) : c.id}
                </span>
                <span className="text-fg-muted">{pct(c.coverageRatio)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
