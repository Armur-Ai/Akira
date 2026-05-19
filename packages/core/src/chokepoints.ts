import type { AttackPath, Chokepoint } from '@akira/schema';

export function computeChokepoints(paths: AttackPath[]): Chokepoint[] {
  if (paths.length === 0) return [];
  const total = paths.length;
  const nodeUses = new Map<string, number>();
  const edgeUses = new Map<string, number>();

  for (const path of paths) {
    const nodesOnPath = new Set<string>();
    nodesOnPath.add(path.entry);
    for (const step of path.steps) {
      nodesOnPath.add(step.from);
      nodesOnPath.add(step.to);
      edgeUses.set(step.edgeId, (edgeUses.get(step.edgeId) ?? 0) + 1);
    }
    // Exclude the entry and objective themselves — only interior nodes are
    // meaningful chokepoints.
    nodesOnPath.delete(path.entry);
    nodesOnPath.delete(path.objective);
    for (const n of nodesOnPath) {
      nodeUses.set(n, (nodeUses.get(n) ?? 0) + 1);
    }
  }

  const chokepoints: Chokepoint[] = [];
  for (const [id, count] of nodeUses) {
    chokepoints.push({
      kind: 'node',
      id,
      pathsCovered: count,
      coverageRatio: count / total,
    });
  }
  for (const [id, count] of edgeUses) {
    chokepoints.push({
      kind: 'edge',
      id,
      pathsCovered: count,
      coverageRatio: count / total,
    });
  }
  chokepoints.sort((a, b) => b.pathsCovered - a.pathsCovered);
  return chokepoints;
}
