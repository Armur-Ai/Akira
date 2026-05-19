import { Technique } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import {
  aiTechniques,
  allTechniques,
  classicalTechniques,
  getAllTechniques,
  getTechnique,
  searchTechniques,
} from './index.js';

describe('technique catalogue', () => {
  it('every entry passes schema validation', () => {
    for (const t of allTechniques) {
      expect(() => Technique.parse(t)).not.toThrow();
    }
  });

  it('every id is unique', () => {
    const ids = allTechniques.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains at least the core AI primitives', () => {
    const ids = new Set(allTechniques.map((t) => t.id));
    for (const required of [
      'prompt-injection.direct',
      'prompt-injection.indirect',
      'rag.poison',
      'tool-grant.abuse',
      'agent.hijack',
      'mcp.malicious-tool',
      'model.supply-chain',
      'output-handling.unsanitised',
    ]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it('contains at least the core classical primitives', () => {
    const ids = new Set(allTechniques.map((t) => t.id));
    for (const required of [
      'phishing.spear',
      'credential.dump',
      'credential.reuse',
      'exfil.data',
    ]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it('classical and ai sets are disjoint and cover the whole catalogue', () => {
    const classicalIds = new Set(classicalTechniques.map((t) => t.id));
    const aiIds = new Set(aiTechniques.map((t) => t.id));
    for (const id of classicalIds) expect(aiIds.has(id)).toBe(false);
    expect(classicalIds.size + aiIds.size).toBe(allTechniques.length);
  });

  it('getTechnique returns a match or undefined', () => {
    expect(getTechnique('prompt-injection.direct')?.name).toBe('Direct prompt injection');
    expect(getTechnique('nope-not-real')).toBeUndefined();
  });

  it('getAllTechniques returns the full catalogue', () => {
    expect(getAllTechniques().length).toBe(allTechniques.length);
  });

  it('searchTechniques matches on id, name, summary, tag', () => {
    expect(searchTechniques('rag').some((t) => t.id === 'rag.poison')).toBe(true);
    expect(searchTechniques('jailbreak').some((t) => t.id === 'jailbreak.chain')).toBe(true);
    expect(searchTechniques('cloud').some((t) => t.id === 'lateral.assume-role')).toBe(true);
    expect(searchTechniques('').length).toBe(allTechniques.length);
  });
});
