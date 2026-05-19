// mulberry32: tiny, fast, deterministic PRNG. Adequate for simulation, not crypto.
export interface Prng {
  next(): number;
  int(maxExclusive: number): number;
  bool(p: number): boolean;
}

export function mulberry32(seed: number): Prng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
    bool: (p: number) => next() < p,
  };
}
