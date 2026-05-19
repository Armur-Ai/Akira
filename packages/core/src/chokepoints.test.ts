import type { AttackPath } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { computeChokepoints } from './chokepoints.js';

function makePath(id: string, edges: Array<{ id: string; from: string; to: string }>): AttackPath {
  return {
    id,
    entry: edges[0]!.from,
    objective: edges[edges.length - 1]!.to,
    steps: edges.map((e) => ({
      edgeId: e.id,
      from: e.from,
      to: e.to,
      techniqueIds: [],
      probability: 0.5,
      cost: 1,
    })),
    probability: 0.125,
    cost: edges.length,
    detection: 0.1,
    score: 0.1,
  };
}

describe('computeChokepoints', () => {
  it('returns empty when no paths', () => {
    expect(computeChokepoints([])).toEqual([]);
  });

  it('identifies a shared interior node across all paths', () => {
    const paths = [
      makePath('p1', [
        { id: 'e1', from: 'A', to: 'X' },
        { id: 'e2', from: 'X', to: 'D' },
      ]),
      makePath('p2', [
        { id: 'e3', from: 'A', to: 'X' },
        { id: 'e4', from: 'X', to: 'D' },
      ]),
    ];
    const cps = computeChokepoints(paths);
    const xNode = cps.find((c) => c.kind === 'node' && c.id === 'X');
    expect(xNode).toBeDefined();
    expect(xNode!.coverageRatio).toBe(1);
    expect(xNode!.pathsCovered).toBe(2);
  });

  it('does not count entry or objective as chokepoint nodes', () => {
    const paths = [
      makePath('p1', [
        { id: 'e1', from: 'A', to: 'X' },
        { id: 'e2', from: 'X', to: 'D' },
      ]),
    ];
    const cps = computeChokepoints(paths);
    expect(cps.some((c) => c.kind === 'node' && c.id === 'A')).toBe(false);
    expect(cps.some((c) => c.kind === 'node' && c.id === 'D')).toBe(false);
  });
});
