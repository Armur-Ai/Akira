import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useScenarioStore } from '../../state/scenario-store.js';
import { ControlCard } from './ControlCard.js';
import { controlTemplates } from './templates.js';

interface Props {
  scenarioId: string;
}

export function ControlsTab({ scenarioId }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const addControl = useScenarioStore((s) => s.addControl);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!scenario) return null;

  function addFromTemplate(key: string) {
    const tpl = controlTemplates.find((t) => t.key === key);
    if (!tpl) return;
    addControl(scenarioId, { id: nanoid(8), ...tpl.build() });
    setPickerOpen(false);
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
  }

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

      {scenario.controls.length === 0 && !pickerOpen && (
        <p className="text-xs text-fg-muted">
          No controls yet. Add one and re-run to see attack paths weaken.
        </p>
      )}

      <div className="space-y-2">
        {scenario.controls.map((c) => (
          <ControlCard key={c.id} scenarioId={scenarioId} control={c} />
        ))}
      </div>
    </div>
  );
}
