import { z } from 'zod';

export const NodeType = z.enum([
  'human',
  'agent',
  'model',
  'tool',
  'data',
  'service',
  'mcp-server',
  'network',
  'credential',
  'secret',
]);
export type NodeType = z.infer<typeof NodeType>;

export const NodePosition = z.object({
  x: z.number(),
  y: z.number(),
});
export type NodePosition = z.infer<typeof NodePosition>;

export const Node = z.object({
  id: z.string().min(1),
  type: NodeType,
  label: z.string().min(1),
  meta: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  criticality: z.number().min(0).max(1).default(0),
  position: NodePosition.optional(),
});
export type Node = z.infer<typeof Node>;
