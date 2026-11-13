import type { AttackPath } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { computeFixSet } from './fix-set.js';

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

describe('computeFixSet', () => {
  it('returns an empty, fully-closed set for no paths', () => {
    const fs = computeFixSet([]);
    expect(fs.totalPaths).toBe(0);
    expect(fs.items).toEqual([]);
    expect(fs.closesAll).toBe(true);
  });

  it('picks a single choke point that covers every path', () => {
    // entry→A→C→objective and entry→B→C→objective: C is on both.
    const paths = [
      makePath('p1', [
        { id: 'e1', from: 'entry', to: 'A' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'C', to: 'objective' },
      ]),
      makePath('p2', [
        { id: 'e4', from: 'entry', to: 'B' },
        { id: 'e5', from: 'B', to: 'C' },
        { id: 'e6', from: 'C', to: 'objective' },
      ]),
    ];
    const fs = computeFixSet(paths);
    expect(fs.totalPaths).toBe(2);
    expect(fs.closesAll).toBe(true);
    expect(fs.items).toHaveLength(1);
    expect(fs.items[0]!.id).toBe('C');
    expect(fs.items[0]!.pathsClosed).toBe(2);
    expect(fs.items[0]!.coverageRatio).toBe(1);
  });

  it('needs one fix per path when paths are independent', () => {
    const paths = [
      makePath('p1', [
        { id: 'e1', from: 'entry', to: 'X' },
        { id: 'e2', from: 'X', to: 'objective' },
      ]),
      makePath('p2', [
        { id: 'e3', from: 'entry', to: 'Y' },
        { id: 'e4', from: 'Y', to: 'objective' },
      ]),
    ];
    const fs = computeFixSet(paths);
    expect(fs.closesAll).toBe(true);
    expect(fs.items).toHaveLength(2);
    // Deterministic order: X before Y (equal cover, lexicographic tie-break).
    expect(fs.items.map((i) => i.id)).toEqual(['X', 'Y']);
  });

  it('cannot close a direct entry→objective path (no interior node)', () => {
    const paths = [makePath('direct', [{ id: 'e1', from: 'entry', to: 'objective' }])];
    const fs = computeFixSet(paths);
    expect(fs.closesAll).toBe(false);
    expect(fs.items).toHaveLength(0);
  });
});
