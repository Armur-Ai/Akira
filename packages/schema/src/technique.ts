import { z } from 'zod';

export const TechniqueFamily = z.enum([
  'reconnaissance',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'exfiltration',
  'impact',
  'ai-prompt',
  'ai-rag',
  'ai-tool',
  'ai-agent',
  'ai-model',
  'ai-mcp',
  'ai-output',
  'ai-training',
]);
export type TechniqueFamily = z.infer<typeof TechniqueFamily>;

export const TechniqueReference = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});
export type TechniqueReference = z.infer<typeof TechniqueReference>;

export const TechniqueTaxonomy = z.object({
  mitreAttack: z.array(z.string()).default([]),
  mitreAtlas: z.array(z.string()).default([]),
  owaspLlm: z.array(z.string()).default([]),
});
export type TechniqueTaxonomy = z.infer<typeof TechniqueTaxonomy>;

export const Technique = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9.-]*$/, 'technique id must be kebab/dot, lowercase'),
  name: z.string().min(1),
  family: TechniqueFamily,
  summary: z.string().min(1),
  references: z.array(TechniqueReference).default([]),
  defaultProbability: z.number().min(0).max(1).default(0.5),
  defaultDifficulty: z.number().min(0).max(1).default(0.5),
  defaultDetection: z.number().min(0).max(1).default(0.5),
  requires: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  taxonomy: TechniqueTaxonomy.default({ mitreAttack: [], mitreAtlas: [], owaspLlm: [] }),
});
export type Technique = z.infer<typeof Technique>;
