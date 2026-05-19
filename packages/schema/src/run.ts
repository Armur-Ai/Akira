import { z } from 'zod';

export const RunMode = z.enum(['deterministic', 'monte-carlo']);
export type RunMode = z.infer<typeof RunMode>;

export const RunConfig = z.object({
  seed: z.number().int().default(0),
  iterations: z.number().int().min(1).default(1),
  mode: RunMode.default('deterministic'),
  maxDepth: z.number().int().min(1).default(20),
  topK: z.number().int().min(1).default(10),
});
export type RunConfig = z.infer<typeof RunConfig>;

export const PathStep = z.object({
  edgeId: z.string(),
  from: z.string(),
  to: z.string(),
  techniqueIds: z.array(z.string()).default([]),
  probability: z.number().min(0).max(1),
  cost: z.number().min(0),
});
export type PathStep = z.infer<typeof PathStep>;

export const AttackPath = z.object({
  id: z.string(),
  entry: z.string(),
  objective: z.string(),
  steps: z.array(PathStep),
  probability: z.number().min(0).max(1),
  cost: z.number().min(0),
  detection: z.number().min(0).max(1),
  score: z.number(),
});
export type AttackPath = z.infer<typeof AttackPath>;

export const ObjectiveMetrics = z.object({
  objective: z.string(),
  reachable: z.boolean(),
  reachProbability: z.number().min(0).max(1),
  bestPathScore: z.number().nullable(),
  pathCount: z.number().int().min(0),
});
export type ObjectiveMetrics = z.infer<typeof ObjectiveMetrics>;

export const Chokepoint = z.object({
  kind: z.enum(['node', 'edge']),
  id: z.string(),
  pathsCovered: z.number().int().min(0),
  coverageRatio: z.number().min(0).max(1),
});
export type Chokepoint = z.infer<typeof Chokepoint>;

export const RunResult = z.object({
  scenarioId: z.string(),
  scenarioVersion: z.number().int(),
  seed: z.number().int(),
  mode: RunMode,
  iterations: z.number().int().min(1),
  paths: z.array(AttackPath),
  metricsByObjective: z.array(ObjectiveMetrics),
  chokepoints: z.array(Chokepoint),
  unreachable: z.array(z.string()),
  wallTimeMs: z.number().min(0),
});
export type RunResult = z.infer<typeof RunResult>;
