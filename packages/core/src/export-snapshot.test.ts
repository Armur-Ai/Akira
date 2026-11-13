import { Scenario } from '@akira/schema';
import type { Scenario as ScenarioT } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { exportAssessmentSnapshot } from './export-snapshot.js';
import { importAssessmentSnapshot } from './import-snapshot.js';

function demoScenario(): ScenarioT {
  return Scenario.parse({
    id: 'sc-1',
    name: 'demo',
    nodes: [
      { id: 'entry', type: 'network', label: 'Internet', criticality: 0 },
      { id: 'api', type: 'service', label: 'API', criticality: 0.5 },
      { id: 'db', type: 'data', label: 'Customer DB', criticality: 1 },
    ],
    edges: [
      { id: 'e1', from: 'entry', to: 'api', kind: 'network-reach', probability: 0.9, meta: { verified: true } },
      { id: 'e2', from: 'api', to: 'db', kind: 'data-flow', probability: 0.6, meta: { verified: false } },
    ],
    objectives: ['db'],
  });
}

describe('exportAssessmentSnapshot', () => {
  it('produces an AssessmentSnapshot envelope', () => {
    const env = exportAssessmentSnapshot(demoScenario(), { revision: 'abc123' }) as any;
    expect(env.kind).toBe('AssessmentSnapshot');
    expect(env.version).toBe('0.1.0');
    expect(env.namespace).toBe('akira');
    expect(env.payload.snapshot_id).toBe('sc-1');
    expect(env.payload.revision).toBe('abc123');
    expect(env.payload.edges).toHaveLength(2);
    // Proof status survives the export.
    const e1 = env.payload.edges.find((e: any) => e.id === 'e1');
    expect(e1.verified).toBe(true);
    expect(e1.exploitability).toBe(0.9);
  });

  it('round-trips through importAssessmentSnapshot', () => {
    const original = demoScenario();
    const env = exportAssessmentSnapshot(original);
    const reimported = importAssessmentSnapshot(env);

    expect(reimported.nodes.map((n) => n.id).sort()).toEqual(['api', 'db', 'entry']);
    expect(reimported.edges.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    // Verified edge stays verified; modeled edge stays modeled.
    const e1 = reimported.edges.find((e) => e.id === 'e1')!;
    const e2 = reimported.edges.find((e) => e.id === 'e2')!;
    expect(e1.meta.verified).toBe(true);
    expect(e2.meta.verified).toBe(false);
    expect(reimported.objectives).toEqual(['db']);
  });

  it('includes provided attack paths as steps', () => {
    const env = exportAssessmentSnapshot(demoScenario(), {
      paths: [
        {
          id: 'p1',
          entry: 'entry',
          objective: 'db',
          steps: [
            { edgeId: 'e1', from: 'entry', to: 'api', techniqueIds: ['T1190'], probability: 0.9, cost: 1 },
            { edgeId: 'e2', from: 'api', to: 'db', techniqueIds: [], probability: 0.6, cost: 1 },
          ],
          probability: 0.54,
          cost: 2,
          detection: 0.1,
          score: 0.4,
        },
      ],
    }) as any;
    expect(env.payload.paths).toHaveLength(1);
    expect(env.payload.paths[0].steps).toHaveLength(2);
    expect(env.payload.paths[0].steps[0].edge_id).toBe('e1');
    expect(env.payload.paths[0].steps[0].technique_id).toBe('T1190');
  });
});
