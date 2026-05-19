import type { AttackPath } from '@akira/schema';
import { Download } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { downloadMarkdownReport } from '../../lib/report.js';
import { useRunStore } from '../../state/run-store.js';
import { useScenarioStore } from '../../state/scenario-store.js';

interface Props {
  scenarioId: string;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function PathCard({
  path,
  selected,
  onSelect,
  nodeLabelById,
}: {
  path: AttackPath;
  selected: boolean;
  onSelect: () => void;
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
        <div>
          <span className="text-fg">p</span> {pct(path.probability)}
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
  const selectedPathId = useRunStore((s) => s.selectedPathByScenario[scenarioId] ?? null);
  const setSelectedPath = useRunStore((s) => s.setSelectedPath);
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

  return (
    <div className="p-4 space-y-5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Run · {run.mode === 'monte-carlo' ? `${run.iterations} iters` : 'deterministic'}
        </h3>
        <div className="flex items-center gap-2">
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
        seed {run.seed} · {run.wallTimeMs}ms
      </div>

      <section className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-fg-muted font-semibold">Objectives</h4>
        <ul className="space-y-1">
          {run.metricsByObjective.map((m) => (
            <li key={m.objective} className="text-sm flex items-center justify-between">
              <span className="truncate">{nodeLabelById.get(m.objective) ?? m.objective}</span>
              {m.reachable ? (
                <span className="text-good text-xs">
                  {pct(m.reachProbability)} · {m.pathCount} paths
                </span>
              ) : (
                <span className="text-fg-muted text-xs">unreachable</span>
              )}
            </li>
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
