import { z } from 'zod';
import { EdgeKind } from './edge.js';
import { NodeType } from './node.js';

export const ControlTarget = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('node'),
    nodeType: NodeType.optional(),
    nodeId: z.string().optional(),
    tag: z.string().optional(),
  }),
  z.object({
    kind: z.literal('edge'),
    edgeKind: EdgeKind.optional(),
    edgeId: z.string().optional(),
    techniqueId: z.string().optional(),
    tag: z.string().optional(),
  }),
]);
export type ControlTarget = z.infer<typeof ControlTarget>;

export const ControlEffect = z.object({
  probabilityMultiplier: z.number().min(0).max(1).default(1),
  detectionDelta: z.number().min(-1).max(1).default(0),
  costDelta: z.number().min(0).default(0),
});
export type ControlEffect = z.infer<typeof ControlEffect>;

export const Control = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().default(''),
  target: ControlTarget,
  effect: ControlEffect,
  enabled: z.boolean().default(true),
});
export type Control = z.infer<typeof Control>;
