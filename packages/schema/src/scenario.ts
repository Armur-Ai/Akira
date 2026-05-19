import { z } from 'zod';
import { Control } from './control.js';
import { Edge } from './edge.js';
import { Node } from './node.js';

export const Scenario = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.number().int().min(1).default(1),
  description: z.string().default(''),
  nodes: z.array(Node).default([]),
  edges: z.array(Edge).default([]),
  controls: z.array(Control).default([]),
  entryPoints: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  notes: z.string().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Scenario = z.infer<typeof Scenario>;
