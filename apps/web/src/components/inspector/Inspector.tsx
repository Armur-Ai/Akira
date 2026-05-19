import { useScenarioStore } from '../../state/scenario-store.js';
import { EdgeInspector } from './EdgeInspector.js';
import { NodeInspector } from './NodeInspector.js';

interface Props {
  scenarioId: string;
}

export function Inspector({ scenarioId }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const selection = useScenarioStore((s) => s.selection);

  if (!scenario) return null;

  const total = selection.nodeIds.length + selection.edgeIds.length;

  if (total === 0) {
    return (
      <div className="p-4 text-sm text-fg-muted space-y-2">
        <p>Nothing selected.</p>
        <p className="text-xs">
          Drag a node from the left palette onto the canvas. Click a node or edge to edit it here.
          Drag from a node’s right-side handle to another node to create an edge.
        </p>
      </div>
    );
  }

  if (total > 1) {
    return (
      <div className="p-4 text-sm text-fg-muted">
        <p>{total} items selected.</p>
        <p className="text-xs mt-2">Bulk edit lands in a future phase.</p>
      </div>
    );
  }

  const nodeId = selection.nodeIds[0];
  if (nodeId) {
    const node = scenario.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return (
      <div className="p-4">
        <NodeInspector
          scenarioId={scenarioId}
          node={node}
          isEntry={scenario.entryPoints.includes(node.id)}
          isObjective={scenario.objectives.includes(node.id)}
        />
      </div>
    );
  }

  const edgeId = selection.edgeIds[0];
  if (edgeId) {
    const edge = scenario.edges.find((e) => e.id === edgeId);
    if (!edge) return null;
    return (
      <div className="p-4">
        <EdgeInspector scenarioId={scenarioId} edge={edge} />
      </div>
    );
  }

  return null;
}
