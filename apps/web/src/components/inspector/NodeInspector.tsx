import { NodeType } from '@akira/schema';
import type { Node as AkiraNode } from '@akira/schema';
import { useScenarioStore } from '../../state/scenario-store.js';
import { Field } from '../ui/Field.js';

interface Props {
  scenarioId: string;
  node: AkiraNode;
  isEntry: boolean;
  isObjective: boolean;
}

const inputClass =
  'w-full rounded bg-bg-elev border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40';

export function NodeInspector({ scenarioId, node, isEntry, isObjective }: Props) {
  const updateNode = useScenarioStore((s) => s.updateNode);
  const toggleEntry = useScenarioStore((s) => s.toggleEntry);
  const toggleObjective = useScenarioStore((s) => s.toggleObjective);
  const deleteNodes = useScenarioStore((s) => s.deleteNodes);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Node</h3>
        <button
          type="button"
          className="text-xs text-danger hover:underline"
          onClick={() => deleteNodes(scenarioId, [node.id])}
        >
          Delete
        </button>
      </header>

      <Field label="Label">
        <input
          className={inputClass}
          value={node.label}
          onChange={(e) => updateNode(scenarioId, node.id, { label: e.target.value })}
        />
      </Field>

      <Field label="Type">
        <select
          className={inputClass}
          value={node.type}
          onChange={(e) =>
            updateNode(scenarioId, node.id, { type: e.target.value as AkiraNode['type'] })
          }
        >
          {NodeType.options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={`Criticality · ${node.criticality.toFixed(2)}`}
        hint="0 = irrelevant, 1 = crown-jewel"
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={node.criticality}
          onChange={(e) => updateNode(scenarioId, node.id, { criticality: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </Field>

      <Field label="Tags" hint="Comma-separated">
        <input
          className={inputClass}
          value={node.tags.join(', ')}
          onChange={(e) =>
            updateNode(scenarioId, node.id, {
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEntry}
            onChange={() => toggleEntry(scenarioId, node.id)}
            className="accent-accent"
          />
          <span>Entry point — attacker starts here</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isObjective}
            onChange={() => toggleObjective(scenarioId, node.id)}
            className="accent-accent"
          />
          <span>Objective — crown-jewel to reach</span>
        </label>
      </div>

      <div className="pt-2 text-[11px] text-fg-muted font-mono">id · {node.id}</div>
    </div>
  );
}
