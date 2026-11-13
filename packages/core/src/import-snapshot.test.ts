import { describe, expect, it } from 'vitest';
import { importAssessmentSnapshot } from './import-snapshot.js';

const snapshotEnvelope = {
  version: '0.1.0',
  namespace: 'swarm',
  producer: { product: 'pentest-swarm' },
  kind: 'AssessmentSnapshot',
  payload: {
    snapshot_id: 'swarm-demo',
    revision: 'abc123',
    taken_at: '2026-11-13T00:00:00Z',
    nodes: [
      { id: 'n1', type: 'service', label: 'api' },
      { id: 'n2', type: 'data', label: 'orders' },
      { id: 'n3', type: 'wildcard-unknown-type', label: 'mystery' },
    ],
    edges: [
      { id: 'n1->n2', from: 'n1', to: 'n2', kind: 'data-flow', exploitability: 0.9, verified: true },
      { id: 'n2->n3', from: 'n2', to: 'n3', kind: 'bogus-kind', verified: false },
    ],
    paths: [{ objective: 'exfiltrate orders', steps: [] }],
  },
};

describe('importAssessmentSnapshot', () => {
  it('converts a snapshot envelope into a valid Scenario', () => {
    const scenario = importAssessmentSnapshot(snapshotEnvelope);
    expect(scenario.id).toBe('swarm-demo');
    expect(scenario.nodes).toHaveLength(3);
    expect(scenario.edges).toHaveLength(2);
    expect(scenario.objectives).toEqual(['exfiltrate orders']);
    // entry points = nodes with no incoming edge (n1).
    expect(scenario.entryPoints).toEqual(['n1']);
  });

  it('coerces unknown node/edge vocabulary to safe defaults', () => {
    const scenario = importAssessmentSnapshot(snapshotEnvelope);
    expect(scenario.nodes.find((n) => n.id === 'n3')?.type).toBe('service');
    expect(scenario.edges.find((e) => e.id === 'n2->n3')?.kind).toBe('trust');
  });

  it('preserves the swarm proof status on edges', () => {
    const scenario = importAssessmentSnapshot(snapshotEnvelope);
    const verified = scenario.edges.find((e) => e.id === 'n1->n2');
    expect(verified?.meta.verified).toBe(true);
    expect(verified?.probability).toBeCloseTo(0.9);
  });

  it('accepts a JSON string', () => {
    const scenario = importAssessmentSnapshot(JSON.stringify(snapshotEnvelope));
    expect(scenario.nodes).toHaveLength(3);
  });

  it('rejects a non-AssessmentSnapshot envelope', () => {
    expect(() => importAssessmentSnapshot({ kind: 'DiscoveryBundle', payload: {} })).toThrow(
      /AssessmentSnapshot/,
    );
  });
});

describe('importAssessmentSnapshot — dangling edges', () => {
  it('drops edges whose endpoints are not real nodes', () => {
    const env = {
      version: '0.1.0',
      namespace: 'swarm',
      kind: 'AssessmentSnapshot',
      payload: {
        snapshot_id: 'dangling',
        nodes: [
          { id: 'a', type: 'service', label: 'A' },
          { id: 'b', type: 'data', label: 'B' },
        ],
        edges: [
          { id: 'a->b', from: 'a', to: 'b', kind: 'data-flow' },
          { id: 'a->ghost', from: 'a', to: 'ghost', kind: 'data-flow' }, // dangling
          { id: 'ghost->b', from: 'ghost', to: 'b', kind: 'data-flow' }, // dangling
        ],
        paths: [],
      },
    };
    const scenario = importAssessmentSnapshot(env);
    expect(scenario.edges.map((e) => e.id)).toEqual(['a->b']);
    // 'a' has no kept incoming edge -> it's an entry point; 'b' is not.
    expect(scenario.entryPoints).toContain('a');
    expect(scenario.entryPoints).not.toContain('b');
  });
});
