import { RunConfig } from '@akira/schema';
import { Plus, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { ControlImpact } from '../../lib/marginal-value.js';
import { useScenarioStore } from '../../state/scenario-store.js';
import { ControlCard } from './ControlCard.js';
import { controlTemplates } from './templates.js';

interface Props {
  scenarioId: string;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function ControlsTab({ scenarioId }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const addControl = useScenarioStore((s) => s.addControl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [impact, setImpact] = useState<{ baseline: number; impacts: ControlImpact[] } | null>(null);
  const [analysing, setAnalysing] = useState(false);

  if (!scenario) return null;

  function addFromTemplate(key: string) {
    const tpl = controlTemplates.find((t) => t.key === key);
    if (!tpl) return;
    addControl(scenarioId, { id: nanoid(8), ...tpl.build() });
    setPickerOpen(false);
    setImpact(null);
  }

  function addCustom() {
    addControl(scenarioId, {
      id: nanoid(8),
      name: 'New control',
      summary: '',
      target: { kind: 'edge' },
      effect: { probabilityMultiplier: 0.5, detectionDelta: 0, costDelta: 0 },
      enabled: true,
    });
    setPickerOpen(false);
    setImpact(null);
  }

  async function analyse() {
    if (!scenario) return;
    setAnalysing(true);
    try {
      // Lazy import so the engine isn't bundled into the main chunk for users
      // who never click Analyse.
      const { analyseControlImpact } = await import('../../lib/marginal-value.js');
      // Yield once so the busy state renders.
      await new Promise((r) => setTimeout(r, 0));
      const config = RunConfig.parse({ mode: 'deterministic' });
      const result = analyseControlImpact(scenario, config);
      setImpact(result);
    } finally {
      setAnalysing(false);
    }
  }

  const enabledCount = scenario.controls.filter((c) => c.enabled).length;
  const impactById = new Map(impact?.impacts.map((i) => [i.controlId, i]) ?? []);
  const topImpact = impact?.impacts[0];

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Controls · {scenario.controls.length}</h3>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="flex items-center gap-1 text-xs bg-accent text-accent-fg px-2 py-1 rounded hover:opacity-90 transition"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </header>

      {pickerOpen && (
        <div className="rounded border border-border bg-bg-elev p-2 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-fg-muted px-1 pb-1">
            Templates
          </div>
          {controlTemplates.map((tpl) => {
            const built = tpl.build();
            return (
              <button
                key={tpl.key}
                type="button"
                onClick={() => addFromTemplate(tpl.key)}
                className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-bg transition"
              >
                <div className="font-medium">{built.name}</div>
                <div className="text-fg-muted">{built.summary}</div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={addCustom}
            className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-bg transition text-fg-muted border-t border-border mt-1 pt-2"
          >
            Custom control…
          </button>
        </div>
      )}

      {enabledCount > 0 && (
        <section className="rounded border border-border bg-bg-elev p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-fg-muted font-semibold">
              Impact
            </div>
            <button
              type="button"
              onClick={analyse}
              disabled={analysing}
              className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition disabled:opacity-40"
            >
              <Sparkles className="h-3 w-3" />
              {analysing ? 'Analysing…' : impact ? 'Re-analyse' : 'Analyse'}
            </button>
          </div>
          {impact && topImpact ? (
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-fg-muted">Baseline top-path probability:</span>{' '}
                <span className="font-medium">{pct(impact.baseline)}</span>
              </div>
              {topImpact.delta > 0.0005 ? (
                <div>
                  <span className="text-good">Most valuable:</span>{' '}
                  <span className="font-medium">{topImpact.controlName}</span>{' '}
                  <span className="text-fg-muted">
                    — disabling it raises top probability to{' '}
                    {pct(topImpact.probabilityWithoutControl)}.
                  </span>
                </div>
              ) : (
                <div className="text-fg-muted">
                  No single control changes the top-path probability appreciably.
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-fg-muted">
              Disables each enabled control in turn and re-simulates to find the one whose absence
              would raise top-path probability the most.
            </p>
          )}
        </section>
      )}

      {scenario.controls.length === 0 && !pickerOpen && (
        <p className="text-xs text-fg-muted">
          No controls yet. Add one and re-run to see attack paths weaken.
        </p>
      )}

      <div className="space-y-2">
        {scenario.controls.map((c) => {
          const i = impactById.get(c.id);
          return (
            <div key={c.id} className="space-y-1">
              <ControlCard scenarioId={scenarioId} control={c} />
              {i && i.delta > 0.0005 && (
                <div className="text-[11px] text-fg-muted px-3">
                  Without this control, top probability becomes{' '}
                  <span className="text-warning">{pct(i.probabilityWithoutControl)}</span> (Δ +
                  {pct(i.delta)})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
