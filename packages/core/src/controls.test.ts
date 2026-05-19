import { Scenario } from '@akira/schema';
import { describe, expect, it } from 'vitest';
import { applyControls } from './controls.js';

describe('applyControls', () => {
  it('passes edges through unchanged when no controls match', () => {
    const scenario = Scenario.parse({
      id: 's',
      name: 's',
      nodes: [
        { id: 'a', type: 'service', label: 'a' },
        { id: 'b', type: 'data', label: 'b' },
      ],
      edges: [
        {
          id: 'e1',
          from: 'a',
          to: 'b',
          kind: 'data-flow',
          probability: 0.7,
          cost: 1,
          noise: 0.2,
        },
      ],
    });
    const eff = applyControls(scenario);
    expect(eff[0]!.probability).toBeCloseTo(0.7);
    expect(eff[0]!.cost).toBe(1);
    expect(eff[0]!.detection).toBe(0.2);
    expect(eff[0]!.controlsApplied).toEqual([]);
  });

  it('applies edge-kind-targeted control multiplier', () => {
    const scenario = Scenario.parse({
      id: 's',
      name: 's',
      nodes: [
        { id: 'a', type: 'service', label: 'a' },
        { id: 'b', type: 'data', label: 'b' },
      ],
      edges: [
        {
          id: 'e1',
          from: 'a',
          to: 'b',
          kind: 'data-flow',
          probability: 0.8,
          cost: 1,
          noise: 0.1,
        },
      ],
      controls: [
        {
          id: 'c-egress',
          name: 'Egress filter',
          target: { kind: 'edge', edgeKind: 'data-flow' },
          effect: { probabilityMultiplier: 0.5, detectionDelta: 0.3, costDelta: 2 },
        },
      ],
    });
    const eff = applyControls(scenario);
    expect(eff[0]!.probability).toBeCloseTo(0.4);
    expect(eff[0]!.detection).toBeCloseTo(0.4);
    expect(eff[0]!.cost).toBe(3);
    expect(eff[0]!.controlsApplied).toEqual(['c-egress']);
  });

  it('applies node-targeted controls to the destination of incoming edges', () => {
    const scenario = Scenario.parse({
      id: 's',
      name: 's',
      nodes: [
        { id: 'a', type: 'service', label: 'a' },
        { id: 'crown', type: 'data', label: 'crown', tags: ['pii'] },
      ],
      edges: [
        {
          id: 'e1',
          from: 'a',
          to: 'crown',
          kind: 'data-flow',
          probability: 0.9,
        },
      ],
      controls: [
        {
          id: 'c-pii',
          name: 'PII vault',
          target: { kind: 'node', tag: 'pii' },
          effect: { probabilityMultiplier: 0.1, detectionDelta: 0.2, costDelta: 0 },
        },
      ],
    });
    const eff = applyControls(scenario);
    expect(eff[0]!.probability).toBeCloseTo(0.09);
    expect(eff[0]!.controlsApplied).toEqual(['c-pii']);
  });

  it('skips disabled controls', () => {
    const scenario = Scenario.parse({
      id: 's',
      name: 's',
      nodes: [
        { id: 'a', type: 'service', label: 'a' },
        { id: 'b', type: 'data', label: 'b' },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', kind: 'data-flow', probability: 0.5 }],
      controls: [
        {
          id: 'c-disabled',
          name: 'off',
          enabled: false,
          target: { kind: 'edge', edgeKind: 'data-flow' },
          effect: { probabilityMultiplier: 0.1, detectionDelta: 0, costDelta: 0 },
        },
      ],
    });
    const eff = applyControls(scenario);
    expect(eff[0]!.probability).toBeCloseTo(0.5);
    expect(eff[0]!.controlsApplied).toEqual([]);
  });
});
