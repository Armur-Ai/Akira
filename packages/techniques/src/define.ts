import { Technique } from '@akira/schema';
import type { Technique as TechniqueType } from '@akira/schema';

// Parse-validate-at-import-time: every entry in the catalogue is guaranteed
// well-formed by the time the module finishes loading.
export function defineTechnique(input: unknown): TechniqueType {
  return Technique.parse(input);
}
