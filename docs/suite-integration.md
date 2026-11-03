# Akira ↔ Armur suite integration (PLAN)

> **Planning doc — no code yet.** Describes how Akira becomes the correlation hub
> of the Armur suite by consuming evidence from the sibling products and exposing
> "eligible actions and paths" back to Pentest Swarm. Nothing here is built; it
> records the intended contract so the Go products and Akira agree.

## Where Akira sits

```
Hayagriva (discovery) ─┐
Trishul   (code)       ├─▶  Akira  ──(eligible actions & paths)──▶  Pentest Swarm
Engira    (advisory)  ─┘     │  ▲                                     │
                             │  └──────────(execution evidence)───────┘
                             └──(assessment snapshots)──▶ Engira (review/report/cases)
```

Akira owns the canonical graph, chains, path reasoning, and the shared transport
schemas. It does **not** run scanners, hold live secrets, execute exploits, call
JEV, fetch advisories, or manage tickets.

## The shared contract

The suite's evidence vocabulary is `github.com/Armur-Ai/armur-contracts` (Go
bindings; three conformant transports — in-process, file, HTTP). Akira is
TypeScript, so integration is **language-neutral**: Akira mirrors the relevant
record shapes in `@akira/schema` (zod) and exchanges them as JSON over the HTTP
transport. The canonical record set Akira cares about:

- **ingest (in):** `DiscoveryBundle` (Hayagriva), `CodeAnalysisBundle` +
  `SourceClaim` (Trishul), `IntelligenceResult` + `StandardMapping` (Engira),
  and `Envelope`/`SourceRevisionRef` framing.
- **emit (out):** an `AssessmentSnapshot` (graph + paths) for Engira to review/
  report, and an "eligible actions/paths" projection for Pentest Swarm.

## APIs to build (greenfield, additive to `apps/api`)

The existing `apps/api` (Hono) only has auth + an opaque `/sync` blob store. Add,
behind auth, a typed evidence surface:

1. `POST /v1/evidence` — accept a versioned `Envelope` (DiscoveryBundle /
   CodeAnalysisBundle / IntelligenceResult). Validate against the mirrored zod
   schema; reject unknown kinds; return a receipt (idempotent on content digest,
   matching `contracts.Digest`). Fold the evidence into the context graph.
2. `GET /v1/assessment/:id/snapshot` — return an `AssessmentSnapshot` (nodes +
   edges + proven paths) for a given assessment.
3. `GET /v1/assessment/:id/actions` — the **eligible actions & paths**
   projection Pentest Swarm consumes: bounded, with preconditions and the
   supporting evidence refs. This is a read model over the graph, not a second
   authoritative store.
4. `POST /v1/assessment/:id/execution` — accept Swarm execution evidence
   (what was attempted, what was proven) to update edge `verified` state.

## Mapping to `@akira/schema`

Add zod schemas mirroring the contract records, re-using Akira's existing
`Node`/`Edge`/`Technique`/`AttackPath` where they already line up:

- `contracts.GraphNode` ↔ `Node`, `contracts.GraphEdge` ↔ `Edge` (both already
  carry type/kind/technique refs; add `verified`/`exploitability`).
- `contracts.AttackPath`/`PathStep` ↔ `AttackPath`/`PathStep` (Akira computes
  these; the contract shape is the wire form).
- New zod schemas for `DiscoveryBundle`, `CodeAnalysisBundle`, `SourceClaim`,
  `IntelligenceResult`, `StandardMapping`, `Envelope`, `Receipt`.

Keep a single `schemaVersion` constant mirroring `contracts.SchemaVersion`;
extend additively.

## Honesty / boundaries

- A scanner/discovery claim is a **SourceClaim**, not a confirmed finding, until
  adjudicated; keep declared / adjudicated-source / runtime-confirmed distinct
  (the contract already encodes this — do not collapse it in the UI).
- "No path found" is not proof of security; surface search bounds + unknowns.
- The graph-simulation "what-if" space (authored probabilities) stays separate
  from observed/verified evidence — never merge assumptions into proven edges.

## Sequencing

1. Mirror the record schemas in `@akira/schema` (no behavior change).
2. Add `POST /v1/evidence` ingest + fold into the graph.
3. Add the snapshot + actions read models.
4. Add execution-evidence intake.

None of this touches the offensive products' internals; it is additive API +
schema work on Akira. Cross-reference: the suite migration plan (private) and
`armur-contracts`.
