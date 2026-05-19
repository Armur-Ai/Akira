import type { Control } from '@akira/schema';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useScenarioStore } from '../../state/scenario-store.js';

interface Props {
  scenarioId: string;
  control: Control;
}

function targetSummary(target: Control['target']): string {
  if (target.kind === 'edge') {
    if (target.edgeKind) return `edges · kind = ${target.edgeKind}`;
    if (target.techniqueId) return `edges · technique = ${target.techniqueId}`;
    if (target.edgeId) return `edge · ${target.edgeId}`;
    if (target.tag) return `edges · tag = ${target.tag}`;
    return 'all edges';
  }
  if (target.tag) return `nodes · tag = ${target.tag}`;
  if (target.nodeType) return `nodes · type = ${target.nodeType}`;
  if (target.nodeId) return `node · ${target.nodeId}`;
  return 'all nodes';
}

export function ControlCard({ scenarioId, control }: Props) {
  const toggleControl = useScenarioStore((s) => s.toggleControl);
  const updateControl = useScenarioStore((s) => s.updateControl);
  const deleteControl = useScenarioStore((s) => s.deleteControl);

  return (
    <div
      className={cn(
        'rounded border p-3 space-y-2 transition',
        control.enabled ? 'border-border bg-bg-elev' : 'border-border/50 opacity-60',
      )}
    >
      <header className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={control.enabled}
          onChange={() => toggleControl(scenarioId, control.id)}
          className="mt-1 accent-accent"
          aria-label={`Toggle ${control.name}`}
        />
        <input
          className="flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 -ml-1"
          value={control.name}
          onChange={(e) => updateControl(scenarioId, control.id, { name: e.target.value })}
        />
        <button
          type="button"
          aria-label="Delete control"
          onClick={() => deleteControl(scenarioId, control.id)}
          className="text-fg-muted hover:text-danger transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </header>

      {control.summary && <p className="text-xs text-fg-muted">{control.summary}</p>}

      <div className="text-[11px] text-fg-muted font-mono">{targetSummary(control.target)}</div>

      <div className="space-y-2 pt-2 border-t border-border/70">
        <Row
          label={`Probability × ${control.effect.probabilityMultiplier.toFixed(2)}`}
          input={
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={control.effect.probabilityMultiplier}
              onChange={(e) =>
                updateControl(scenarioId, control.id, {
                  effect: {
                    ...control.effect,
                    probabilityMultiplier: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-accent"
            />
          }
        />
        <Row
          label={`Detection ${control.effect.detectionDelta >= 0 ? '+' : ''}${control.effect.detectionDelta.toFixed(2)}`}
          input={
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={control.effect.detectionDelta}
              onChange={(e) =>
                updateControl(scenarioId, control.id, {
                  effect: {
                    ...control.effect,
                    detectionDelta: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-accent"
            />
          }
        />
        <Row
          label={`Cost + ${control.effect.costDelta.toFixed(1)}`}
          input={
            <input
              type="number"
              min={0}
              step={0.5}
              value={control.effect.costDelta}
              onChange={(e) =>
                updateControl(scenarioId, control.id, {
                  effect: {
                    ...control.effect,
                    costDelta: Number(e.target.value),
                  },
                })
              }
              className="w-20 rounded bg-bg border border-border px-2 py-1 text-xs"
            />
          }
        />
      </div>
    </div>
  );
}

function Row({ label, input }: { label: string; input: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] text-fg-muted">{label}</div>
      {input}
    </div>
  );
}
