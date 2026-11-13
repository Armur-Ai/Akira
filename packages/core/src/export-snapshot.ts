import type { AttackPath, Scenario as ScenarioT } from '@akira/schema';

// Export an Akira Scenario as a Pentest Swarm / armur-contracts
// AssessmentSnapshot envelope — the inverse of importAssessmentSnapshot. This
// lets Akira put its reasoned graph back onto the suite bus so Engira (triage /
// diff) and Dhantra (remediation guidance) can consume a scenario the same way
// they consume a swarm assessment. Nodes/edges round-trip; an edge's proof
// status (meta.verified) is preserved so demonstrated vs. modeled survives.

/** armur-contracts SchemaVersion this envelope targets. */
const SCHEMA_VERSION = '0.1.0';

export interface ExportOptions {
  /** snapshot_id to stamp (defaults to the scenario id). */
  snapshotId?: string;
  /** revision label (e.g. a git commit) to stamp. */
  revision?: string;
  /** producer version string for the envelope's producer block. */
  producerVersion?: string;
  /** ISO timestamp for taken_at / emitted_at (defaults to now). */
  takenAt?: string;
  /**
   * Pre-computed attack paths to include (e.g. from dijkstra / Yen's). Each is
   * mapped to the contracts PathStep shape. Omitted ⇒ no paths in the snapshot.
   */
  paths?: AttackPath[];
}

/** Coerce an Akira meta record (unknown values) to the contracts string map. */
function stringifyMeta(meta: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

/** Whether an Akira edge is marked proven (meta.verified === true). */
function edgeVerified(meta: Record<string, unknown>): boolean {
  return meta.verified === true;
}

/**
 * Convert an Akira Scenario into an AssessmentSnapshot envelope (a plain object
 * ready to JSON.stringify). The result validates against
 * contracts.ValidateSnapshot provided the scenario's edges reference real nodes
 * (Scenario's own schema already guarantees unique ids).
 */
export function exportAssessmentSnapshot(scenario: ScenarioT, opts: ExportOptions = {}): unknown {
  const takenAt = opts.takenAt ?? new Date().toISOString();

  const nodes = scenario.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    criticality: n.criticality,
    meta: stringifyMeta(n.meta),
  }));

  const edges = scenario.edges.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    technique_ids: e.techniqueIds,
    exploitability: e.probability,
    verified: edgeVerified(e.meta),
  }));

  const paths = (opts.paths ?? []).map((p) => ({
    objective: p.objective,
    probability: p.probability,
    complete: true,
    steps: p.steps.map((s) => ({
      edge_id: s.edgeId,
      technique_id: s.techniqueIds[0] ?? '',
      verified: false,
    })),
  }));
  // A declared objective with no computed path is still part of the scenario;
  // emit it as a step-less, incomplete path so it survives a round-trip (the
  // importer reconstructs objectives from path objectives) without claiming a
  // route that was never found.
  const covered = new Set(paths.map((p) => p.objective));
  for (const obj of scenario.objectives) {
    if (!covered.has(obj)) {
      paths.push({ objective: obj, probability: 0, complete: false, steps: [] });
      covered.add(obj);
    }
  }

  return {
    version: SCHEMA_VERSION,
    namespace: 'akira',
    producer: { product: 'akira', version: opts.producerVersion ?? 'core' },
    kind: 'AssessmentSnapshot',
    emitted_at: takenAt,
    payload: {
      snapshot_id: opts.snapshotId ?? scenario.id,
      revision: opts.revision ?? '',
      nodes,
      edges,
      paths,
      taken_at: takenAt,
    },
  };
}
