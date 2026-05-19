import type { Technique } from '@akira/schema';
import { aiTechniques } from './ai.js';
import { classicalTechniques } from './classical.js';

export { defineTechnique } from './define.js';
export { classicalTechniques } from './classical.js';
export { aiTechniques } from './ai.js';
export * from './classical.js';
export * from './ai.js';

export const allTechniques: readonly Technique[] = Object.freeze([
  ...classicalTechniques,
  ...aiTechniques,
]);

const byId: Map<string, Technique> = new Map(allTechniques.map((t) => [t.id, t]));

export function getTechnique(id: string): Technique | undefined {
  return byId.get(id);
}

export function getAllTechniques(): readonly Technique[] {
  return allTechniques;
}

export function searchTechniques(query: string): Technique[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...allTechniques];
  return allTechniques.filter((t) => {
    if (t.id.toLowerCase().includes(q)) return true;
    if (t.name.toLowerCase().includes(q)) return true;
    if (t.summary.toLowerCase().includes(q)) return true;
    if (t.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
    return false;
  });
}
