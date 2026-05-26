import type { Scenario } from '@akira/schema';

export interface LintIssue {
  kind: 'edge' | 'node' | 'scenario';
  id: string;
  message: string;
}

export interface LintResult {
  issues: LintIssue[];
  byEdgeId: Map<string, LintIssue[]>;
  byNodeId: Map<string, LintIssue[]>;
}

export function lintScenario(scenario: Scenario): LintResult {
  const issues: LintIssue[] = [];
  const byEdgeId = new Map<string, LintIssue[]>();
  const byNodeId = new Map<string, LintIssue[]>();

  function push(issue: LintIssue) {
    issues.push(issue);
    if (issue.kind === 'edge') {
      const list = byEdgeId.get(issue.id) ?? [];
      list.push(issue);
      byEdgeId.set(issue.id, list);
    } else if (issue.kind === 'node') {
      const list = byNodeId.get(issue.id) ?? [];
      list.push(issue);
      byNodeId.set(issue.id, list);
    }
  }

  // Scenario-level
  if (scenario.entryPoints.length === 0) {
    push({ kind: 'scenario', id: scenario.id, message: 'No entry points marked.' });
  }
  if (scenario.objectives.length === 0) {
    push({ kind: 'scenario', id: scenario.id, message: 'No objectives marked.' });
  }

  // Edges without techniques
  for (const edge of scenario.edges) {
    if (edge.techniqueIds.length === 0) {
      push({
        kind: 'edge',
        id: edge.id,
        message: 'No techniques attached — the simulator will use the raw edge probability.',
      });
    }
  }

  // Orphan entries and objectives
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of scenario.edges) {
    outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }
  const entries = new Set(scenario.entryPoints);
  const objectives = new Set(scenario.objectives);
  for (const node of scenario.nodes) {
    if (entries.has(node.id) && (outgoing.get(node.id) ?? 0) === 0) {
      push({
        kind: 'node',
        id: node.id,
        message: "Entry point with no outgoing edges — attacker can't go anywhere from here.",
      });
    }
    if (objectives.has(node.id) && (incoming.get(node.id) ?? 0) === 0) {
      push({
        kind: 'node',
        id: node.id,
        message: 'Objective with no incoming edges — unreachable.',
      });
    }
  }

  return { issues, byEdgeId, byNodeId };
}
