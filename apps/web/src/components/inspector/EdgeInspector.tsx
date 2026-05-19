import { EdgeKind } from '@akira/schema';
import type { Edge as AkiraEdge } from '@akira/schema';
import { allTechniques } from '@akira/techniques';
import { useScenarioStore } from '../../state/scenario-store.js';
import { Field } from '../ui/Field.js';

interface Props {
  scenarioId: string;
  edge: AkiraEdge;
}

const inputClass =
  'w-full rounded bg-bg-elev border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40';

export function EdgeInspector({ scenarioId, edge }: Props) {
  const updateEdge = useScenarioStore((s) => s.updateEdge);
  const deleteEdges = useScenarioStore((s) => s.deleteEdges);
  const selected = new Set(edge.techniqueIds);

  function toggleTechnique(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateEdge(scenarioId, edge.id, { techniqueIds: [...next] });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edge</h3>
        <button
          type="button"
          className="text-xs text-danger hover:underline"
          onClick={() => deleteEdges(scenarioId, [edge.id])}
        >
          Delete
        </button>
      </header>

      <Field label="Kind">
        <select
          className={inputClass}
          value={edge.kind}
          onChange={(e) =>
            updateEdge(scenarioId, edge.id, { kind: e.target.value as AkiraEdge['kind'] })
          }
        >
          {EdgeKind.options.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={`Probability · ${edge.probability.toFixed(2)}`}
        hint="Single-step success likelihood"
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={edge.probability}
          onChange={(e) => updateEdge(scenarioId, edge.id, { probability: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </Field>

      <Field
        label={`Detection noise · ${edge.noise.toFixed(2)}`}
        hint="Chance defenders notice this step"
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={edge.noise}
          onChange={(e) => updateEdge(scenarioId, edge.id, { noise: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </Field>

      <Field label="Cost" hint="Time/effort budget consumed by the attacker">
        <input
          type="number"
          min={0}
          step={0.5}
          className={inputClass}
          value={edge.cost}
          onChange={(e) => updateEdge(scenarioId, edge.id, { cost: Number(e.target.value) })}
        />
      </Field>

      <Field label="Techniques" hint={`${selected.size} of ${allTechniques.length} attached`}>
        <div className="max-h-64 overflow-y-auto rounded border border-border bg-bg-elev divide-y divide-border">
          {allTechniques.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-2 px-2 py-1.5 hover:bg-bg-elev-2 cursor-pointer text-xs"
              title={t.summary}
            >
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggleTechnique(t.id)}
                className="mt-0.5 accent-accent"
              />
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{t.name}</span>
                <span className="block text-fg-muted font-mono truncate">{t.id}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      <div className="pt-2 text-[11px] text-fg-muted font-mono">
        id · {edge.id} · {edge.from} → {edge.to}
      </div>
    </div>
  );
}
