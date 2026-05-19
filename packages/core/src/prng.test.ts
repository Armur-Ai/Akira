import { describe, expect, it } from 'vitest';
import { mulberry32 } from './prng.js';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('diverges for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let differs = false;
    for (let i = 0; i < 20; i++) {
      if (a.next() !== b.next()) differs = true;
    }
    expect(differs).toBe(true);
  });

  it('yields values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('bool(p) approximates the requested probability over many samples', () => {
    const r = mulberry32(99);
    let hits = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      if (r.bool(0.3)) hits++;
    }
    const empirical = hits / N;
    expect(empirical).toBeGreaterThan(0.27);
    expect(empirical).toBeLessThan(0.33);
  });
});
