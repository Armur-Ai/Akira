import type { Scenario } from '@akira/schema';

export class ScenarioValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(`${message}\n  - ${issues.join('\n  - ')}`);
    this.name = 'ScenarioValidationError';
  }
}

export function assertScenarioValid(scenario: Scenario): void {
  const issues: string[] = [];
  const nodeIds = new Set<string>();
  for (const node of scenario.nodes) {
    if (nodeIds.has(node.id)) issues.push(`duplicate node id: ${node.id}`);
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of scenario.edges) {
    if (edgeIds.has(edge.id)) issues.push(`duplicate edge id: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from))
      issues.push(`edge ${edge.id} references unknown 'from' node: ${edge.from}`);
    if (!nodeIds.has(edge.to))
      issues.push(`edge ${edge.id} references unknown 'to' node: ${edge.to}`);
  }
  for (const id of scenario.entryPoints) {
    if (!nodeIds.has(id)) issues.push(`entry point references unknown node: ${id}`);
  }
  for (const id of scenario.objectives) {
    if (!nodeIds.has(id)) issues.push(`objective references unknown node: ${id}`);
  }
  if (issues.length > 0) {
    throw new ScenarioValidationError('Scenario is invalid', issues);
  }
}
