# Simulator

The core engine lives in `packages/core` and turns a `Scenario + RunConfig` into a `RunResult`.

## The neg-log-prob trick

We want the highest-probability path from an entry to an objective, where path probability is the product of edge probabilities (a Markov-ish assumption: edges fail independently):

```
P(path) = ∏ p_i
```

Dijkstra finds the lowest-additive-weight path. To bridge multiplicative to additive, we map probability to weight via `−log(p)`:

```
w_i  = −log(p_i)
Σ w_i = −log(∏ p_i) = −log(P(path))
```

Minimising `Σ w_i` maximises `P(path)`. Two edges are worth noting:

- `p = 1` → weight 0 (free traversal).
- `p = 0` → weight `+∞` (a dead edge; Dijkstra ignores it).

The mapping is in `packages/core/src/build-graph.ts`'s `probabilityToWeight()`.

## Controls

`applyControls()` resolves every active control against every edge. The composition for matched edges is:

```
effective_prob       = base_prob × ∏ control.probabilityMultiplier
effective_detection  = clamp(base_noise + Σ control.detectionDelta, 0, 1)
effective_cost       = base_cost + Σ control.costDelta
```

Node-targeted controls apply to the destination of every incoming edge.

## Top-K via Yen

Once the graph is built we use Yen's loopless k-shortest-paths algorithm (`packages/core/src/k-shortest-paths.ts`) seeded by Dijkstra. Per iteration:

1. Walk the previously accepted path one node at a time (the spur node).
2. Forbid edges that any earlier accepted path took from the same prefix (forces a different continuation).
3. Forbid interior nodes of the current root path (loopless guarantee).
4. Dijkstra from the spur to the target with those forbids.
5. Concatenate root + spur, score the candidate, keep the lightest one.

Yen is `O(K · (V+E) log V)` worst case. The forbids are passed to Dijkstra via predicate sets rather than mutating the graph, so a single graph instance services every spur search.

## Monte-Carlo

`simulateMonteCarlo()` runs N independent trials of edge thinning:

```
for i in 1..N:
  live_edges = { e : sample(0,1) < e.probability }
  for entry in entries:
    BFS over live_edges, parent-track for reconstruction
    for each reached objective: increment hits; consider best path
```

`mulberry32` seeds the PRNG so a run with the same `(seed, scenario)` is bit-for-bit reproducible — useful for tests and for two side-by-side runs that should differ only in their controls.

`reachProbability` per objective is `hits / (iterations × |entries|)`.

## Detection composition

Step detection is independent per edge. Path detection is the complement of the probability of going undetected at every step:

```
P(undetected | path) = ∏ (1 - noise_i)
detection(path)     = 1 − that
```

## Score

The path ranking key:

```
score = probability × (1 - detection) − 0.01 · log1p(cost)
```

Successful, stealthy, cheap attacks rank highest. The `log1p(cost)` term is a tie-breaker — it nudges the simulator toward shorter paths when probability and detection are close. The 0.01 weight is deliberately small; we want probability and detection to dominate the order.

## Chokepoints

For the deterministic top-K, every interior node and every edge gets a `coverageRatio = paths_through / paths_total`. Entries and objectives themselves are not eligible — every path crosses them by construction so they aren't interesting from a "where to defend" lens. Sort descending, take top 10 for the UI.

## Validation

`assertScenarioValid()` runs before every simulate. It refuses scenarios with:

- duplicate node or edge ids,
- edges referencing unknown `from` or `to` nodes,
- entry or objective ids that don't exist.

Failures throw `ScenarioValidationError` with the full list of issues — surfaces in the Run popover as an inline error.
