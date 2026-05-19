import type { Control, Edge, Scenario } from '@akira/schema';

export interface EffectiveEdge {
  id: string;
  from: string;
  to: string;
  kind: Edge['kind'];
  techniqueIds: string[];
  probability: number;
  cost: number;
  detection: number;
  controlsApplied: string[];
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

function controlMatchesEdge(control: Control, edge: Edge): boolean {
  if (!control.enabled) return false;
  if (control.target.kind !== 'edge') return false;
  const t = control.target;
  if (t.edgeId !== undefined && t.edgeId !== edge.id) return false;
  if (t.edgeKind !== undefined && t.edgeKind !== edge.kind) return false;
  if (t.techniqueId !== undefined && !edge.techniqueIds.includes(t.techniqueId)) return false;
  return true;
}

function controlMatchesNode(
  control: Control,
  nodeId: string,
  nodeType: string,
  tags: string[],
): boolean {
  if (!control.enabled) return false;
  if (control.target.kind !== 'node') return false;
  const t = control.target;
  if (t.nodeId !== undefined && t.nodeId !== nodeId) return false;
  if (t.nodeType !== undefined && t.nodeType !== nodeType) return false;
  if (t.tag !== undefined && !tags.includes(t.tag)) return false;
  return true;
}

export function applyControls(scenario: Scenario): EffectiveEdge[] {
  const nodesById = new Map(scenario.nodes.map((n) => [n.id, n]));

  return scenario.edges.map((edge): EffectiveEdge => {
    let probability = edge.probability;
    let cost = edge.cost;
    let detection = edge.noise;
    const controlsApplied: string[] = [];

    // Edge-targeted controls.
    for (const control of scenario.controls) {
      if (!controlMatchesEdge(control, edge)) continue;
      probability *= control.effect.probabilityMultiplier;
      detection = clamp01(detection + control.effect.detectionDelta);
      cost += control.effect.costDelta;
      controlsApplied.push(control.id);
    }

    // Node-targeted controls applied to the destination (harden the asset).
    const toNode = nodesById.get(edge.to);
    if (toNode) {
      for (const control of scenario.controls) {
        if (!controlMatchesNode(control, toNode.id, toNode.type, toNode.tags)) continue;
        probability *= control.effect.probabilityMultiplier;
        detection = clamp01(detection + control.effect.detectionDelta);
        cost += control.effect.costDelta;
        controlsApplied.push(control.id);
      }
    }

    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      techniqueIds: edge.techniqueIds,
      probability: clamp01(probability),
      cost,
      detection,
      controlsApplied,
    };
  });
}
