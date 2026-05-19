import { simulate } from '@akira/core';
import { RunConfig } from '@akira/schema';
import { Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRunStore } from '../../state/run-store.js';
import { useScenarioStore } from '../../state/scenario-store.js';
import { Field } from '../ui/Field.js';

interface Props {
  scenarioId: string;
}

const inputClass =
  'w-full rounded bg-bg border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40';

export function RunPanel({ scenarioId }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'deterministic' | 'monte-carlo'>('deterministic');
  const [iterations, setIterations] = useState(500);
  const [seed, setSeed] = useState(42);
  const [topK, setTopK] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const setRun = useRunStore((s) => s.setRun);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  async function run() {
    if (!scenario) return;
    setBusy(true);
    setError(null);
    try {
      // Yield to the browser so the button's busy state can paint before the
      // (synchronous) simulation kicks off.
      await new Promise((r) => setTimeout(r, 0));
      const config = RunConfig.parse({ mode, iterations, seed, topK });
      const result = simulate(scenario, config);
      setRun(scenarioId, result);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const canRun = (scenario?.entryPoints.length ?? 0) > 0 && (scenario?.objectives.length ?? 0) > 0;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-accent text-accent-fg px-3 py-1.5 rounded text-sm font-medium hover:opacity-90 transition"
      >
        <Play className="h-3.5 w-3.5" />
        Run
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-bg-elev border border-border rounded-md shadow-xl p-4 space-y-3 z-20">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Run simulation</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-fg-muted hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {!canRun && (
            <div className="text-xs text-warning bg-warning/10 border border-warning/40 rounded p-2">
              Mark at least one node as an entry point and one as an objective before running.
            </div>
          )}

          <Field label="Mode">
            <select
              className={inputClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="deterministic">Deterministic · top-K paths</option>
              <option value="monte-carlo">Monte-Carlo · sampled</option>
            </select>
          </Field>

          {mode === 'monte-carlo' && (
            <Field label="Iterations">
              <input
                type="number"
                min={10}
                max={100000}
                step={100}
                className={inputClass}
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Seed">
              <input
                type="number"
                className={inputClass}
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
              />
            </Field>
            <Field label="Top K">
              <input
                type="number"
                min={1}
                max={50}
                className={inputClass}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
              />
            </Field>
          </div>

          {error && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/40 rounded p-2 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={busy || !canRun}
            className="w-full bg-accent text-accent-fg px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Running…' : 'Run now'}
          </button>
        </div>
      )}
    </div>
  );
}
