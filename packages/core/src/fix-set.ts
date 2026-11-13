import type { AttackPath } from '@akira/schema';

/**
 * One remediation in a minimal fix set: fixing this node closes `pathsClosed`
 * of the attack paths that were still open when it was chosen (greedy order).
 */
export interface FixSetItem {
  /** Interior node id to remediate (a finding / capability, never entry or objective). */
  id: string;
  /** Paths this fix closes among those still open at its selection step. */
  pathsClosed: number;
  /** pathsClosed / totalPaths. */
  coverageRatio: number;
}

/**
 * A minimal, greedily-chosen set of node fixes that neutralises the attack
 * surface. Where `computeChokepoints` ranks *every* node by how many paths it
 * sits on, `computeFixSet` answers the operator's real question: the smallest
 * ordered set of fixes that closes the most paths — "fix these N first".
 */
export interface FixSet {
  totalPaths: number;
  /** Greedy order: each item closes the most still-open paths at its step. */
  items: FixSetItem[];
  /** True when the set closes every path (false if some path has no interior node). */
  closesAll: boolean;
}

/**
 * Compute a minimal fix set over attack paths via greedy set cover. Only
 * interior nodes are candidates (the entry and objective of a path are not
 * remediable). A path with no interior node (a direct entry→objective edge)
 * cannot be closed by a node fix, so `closesAll` is false.
 *
 * Greedy set cover is a (ln n)-approximation of the NP-hard minimum set cover;
 * it is the standard, well-behaved choice for ranking remediations and matches
 * the Go attack-graph fix plan Pentest-Swarm emits.
 */
export function computeFixSet(paths: AttackPath[]): FixSet {
  const totalPaths = paths.length;
  if (totalPaths === 0) {
    return { totalPaths: 0, items: [], closesAll: true };
  }

  // For each interior node, the set of path indices it sits on.
  const nodeToPaths = new Map<string, Set<number>>();
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!;
    const interior = new Set<string>();
    for (const step of path.steps) {
      interior.add(step.from);
      interior.add(step.to);
    }
    interior.delete(path.entry);
    interior.delete(path.objective);
    for (const n of interior) {
      let set = nodeToPaths.get(n);
      if (!set) {
        set = new Set<number>();
        nodeToPaths.set(n, set);
      }
      set.add(i);
    }
  }

  const open = new Set<number>();
  for (let i = 0; i < paths.length; i++) open.add(i);

  const items: FixSetItem[] = [];
  const used = new Set<string>();

  while (open.size > 0) {
    let bestNode: string | null = null;
    let bestCover = 0;
    // Deterministic tie-break: among equal coverage, the lexicographically
    // smallest node id wins, so the output is stable across runs.
    for (const [node, covered] of nodeToPaths) {
      if (used.has(node)) continue;
      let cover = 0;
      for (const idx of covered) {
        if (open.has(idx)) cover++;
      }
      if (cover > bestCover || (cover === bestCover && cover > 0 && (bestNode === null || node < bestNode))) {
        bestNode = node;
        bestCover = cover;
      }
    }
    if (bestNode === null || bestCover === 0) break;

    used.add(bestNode);
    for (const idx of nodeToPaths.get(bestNode)!) open.delete(idx);
    items.push({
      id: bestNode,
      pathsClosed: bestCover,
      coverageRatio: bestCover / totalPaths,
    });
  }

  return { totalPaths, items, closesAll: open.size === 0 };
}
