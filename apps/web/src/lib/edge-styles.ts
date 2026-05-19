import type { EdgeKind } from '@akira/schema';

// Stroke colour per kind (oklch via tailwind utility classes). Edge stroke uses
// the raw CSS colour so we keep them as values rather than tailwind classes.
const EDGE_COLOURS: Record<EdgeKind, string> = {
  trust: 'oklch(0.74 0.16 230)',
  'data-flow': 'oklch(0.78 0.15 150)',
  'tool-grant': 'oklch(0.7 0.18 305)',
  'network-reach': 'oklch(0.78 0.12 210)',
  'identity-assumes': 'oklch(0.8 0.15 80)',
  'model-invokes': 'oklch(0.7 0.2 350)',
  'prompt-flow': 'oklch(0.78 0.15 50)',
  physical: 'oklch(0.65 0.02 250)',
};

export function edgeColour(kind: EdgeKind): string {
  return EDGE_COLOURS[kind];
}
