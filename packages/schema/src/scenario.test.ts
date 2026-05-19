import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario.js';

describe('Scenario', () => {
  it('parses a minimal scenario with defaults filled', () => {
    const result = Scenario.parse({
      id: 's1',
      name: 'minimal',
    });

    expect(result.id).toBe('s1');
    expect(result.version).toBe(1);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.controls).toEqual([]);
    expect(result.entryPoints).toEqual([]);
    expect(result.objectives).toEqual([]);
  });

  it('round-trips through JSON', () => {
    const input = {
      id: 'rag-leak',
      name: 'RAG indirect prompt injection',
      version: 2,
      description: 'A malicious doc poisons the RAG store.',
      nodes: [
        { id: 'web', type: 'service', label: 'Web app', tags: ['frontend'], criticality: 0.4 },
        { id: 'rag', type: 'data', label: 'Vector store', criticality: 0.8 },
        { id: 'llm', type: 'model', label: 'LLM' },
        { id: 'customer-pii', type: 'data', label: 'Customer PII', criticality: 1 },
      ],
      edges: [
        {
          id: 'e1',
          from: 'web',
          to: 'rag',
          kind: 'data-flow',
          techniqueIds: ['rag.poison'],
          probability: 0.3,
        },
        {
          id: 'e2',
          from: 'rag',
          to: 'llm',
          kind: 'prompt-flow',
          techniqueIds: ['prompt-injection.indirect'],
          probability: 0.7,
        },
        {
          id: 'e3',
          from: 'llm',
          to: 'customer-pii',
          kind: 'data-flow',
          techniqueIds: ['output-handling.unsanitised'],
          probability: 0.5,
        },
      ],
      entryPoints: ['web'],
      objectives: ['customer-pii'],
    };

    const parsed = Scenario.parse(input);
    const json = JSON.stringify(parsed);
    const reparsed = Scenario.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });

  it('rejects scenario with empty id', () => {
    expect(() => Scenario.parse({ id: '', name: 'x' })).toThrow();
  });

  it('rejects edges with out-of-range probability', () => {
    expect(() =>
      Scenario.parse({
        id: 's',
        name: 'bad',
        edges: [{ id: 'e', from: 'a', to: 'b', kind: 'trust', probability: 1.5 }],
      }),
    ).toThrow();
  });
});
