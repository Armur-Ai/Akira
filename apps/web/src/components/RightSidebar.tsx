import { useScenarioStore } from '../state/scenario-store.js';

export function RightSidebar() {
  const selection = useScenarioStore((s) => s.selection);
  const total = selection.nodeIds.length + selection.edgeIds.length;

  if (total === 0) {
    return (
      <div className="p-4 text-sm text-fg-muted">
        <p>Nothing selected.</p>
        <p className="mt-2 text-xs">
          Drop a node from the left palette onto the canvas, then click it to edit its properties
          here. Editor lands in Phase 5.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 text-sm">
      <div className="text-xs uppercase tracking-wider text-fg-muted font-semibold">Selection</div>
      <div className="text-fg-muted">
        {selection.nodeIds.length} node(s), {selection.edgeIds.length} edge(s)
      </div>
    </div>
  );
}
