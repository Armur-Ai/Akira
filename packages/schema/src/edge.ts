import { z } from 'zod';

export const EdgeKind = z.enum([
  'trust',
  'data-flow',
  'tool-grant',
  'network-reach',
  'identity-assumes',
  'model-invokes',
  'prompt-flow',
  'physical',
]);
export type EdgeKind = z.infer<typeof EdgeKind>;

export const Edge = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: EdgeKind,
  techniqueIds: z.array(z.string()).default([]),
  probability: z.number().min(0).max(1).default(0.5),
  cost: z.number().min(0).default(1),
  noise: z.number().min(0).max(1).default(0.5),
  requires: z.array(z.string()).default([]),
  label: z.string().optional(),
  meta: z.record(z.unknown()).default({}),
});
export type Edge = z.infer<typeof Edge>;
