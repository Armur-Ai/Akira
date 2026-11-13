import { z } from 'zod';
import { EdgeKind, NodeType, Scenario } from '@akira/schema';
import type { Scenario as ScenarioT } from '@akira/schema';

// Import a Pentest Swarm AssessmentSnapshot (the armur-contracts cross-product
// wire form, emitted by `pentestswarm scan --format snapshot`) into an Akira
// Scenario. This lets the attack-path canvas start from a real assessment —
// discovered assets and *proven* edges — instead of a hand-drawn graph.
//
// The incoming envelope is validated loosely and coerced into Akira's strict
// schema: a node/edge whose type isn't in Akira's vocabulary falls back to a
// safe default rather than failing the whole import, and a newer producer's
// extra fields are ignored. The swarm's proof status is preserved on each edge
// (meta.verified) so the UI can distinguish demonstrated from merely modeled.

const SnapshotNode = z.object({
  id: z.string().min(1),
  type: z.string().default('service'),
  label: z.string().default(''),
  criticality: z.number().optional(),
  meta: z.record(z.string()).optional(),
});

const SnapshotEdge = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.string().default('trust'),
  exploitability: z.number().optional(),
  verified: z.boolean().optional(),
});

const SnapshotEnvelope = z.object({
  kind: z.string(),
  payload: z.object({
    snapshot_id: z.string().default('snapshot'),
    revision: z.string().optional(),
    nodes: z.array(SnapshotNode).default([]),
    edges: z.array(SnapshotEdge).default([]),
    paths: z.array(z.object({ objective: z.string() }).passthrough()).default([]),
  }),
});

const NODE_TYPES = new Set<string>(NodeType.options);
const EDGE_KINDS = new Set<string>(EdgeKind.options);

function coerceNodeType(t: string): z.infer<typeof NodeType> {
  return (NODE_TYPES.has(t) ? t : 'service') as z.infer<typeof NodeType>;
}

function coerceEdgeKind(k: string): z.infer<typeof EdgeKind> {
  return (EDGE_KINDS.has(k) ? k : 'trust') as z.infer<typeof EdgeKind>;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Convert a Pentest Swarm AssessmentSnapshot envelope (object or JSON string)
 * into a validated Akira Scenario. Throws if the envelope is not an
 * AssessmentSnapshot or is structurally invalid.
 */
export function importAssessmentSnapshot(input: unknown): ScenarioT {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  const env = SnapshotEnvelope.parse(raw);
  if (env.kind !== 'AssessmentSnapshot') {
    throw new Error(`akira: expected an AssessmentSnapshot envelope, got "${env.kind}"`);
  }
  const p = env.payload;

  const objectives = [...new Set(p.paths.map((x) => x.objective).filter((o) => o.length > 0))];
  const incoming = new Set(p.edges.map((e) => e.to));
  const entryPoints = p.nodes.map((n) => n.id).filter((id) => !incoming.has(id));

  return Scenario.parse({
    id: p.snapshot_id,
    name: `Imported from Pentest Swarm (${p.snapshot_id})`,
    description: p.revision
      ? `Swarm assessment at revision ${p.revision}`
      : 'Imported swarm assessment',
    nodes: p.nodes.map((n) => ({
      id: n.id,
      type: coerceNodeType(n.type),
      label: n.label.length > 0 ? n.label : n.id,
      criticality: clamp01(n.criticality ?? 0),
      meta: n.meta ?? {},
    })),
    edges: p.edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      kind: coerceEdgeKind(e.kind),
      probability: clamp01(e.exploitability ?? 0.5),
      meta: { verified: e.verified ?? false, source: 'pentest-swarm' },
    })),
    entryPoints,
    objectives,
  });
}
