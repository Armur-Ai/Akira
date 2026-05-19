import type { Control } from '@akira/schema';

export interface ControlTemplate {
  key: string;
  build: () => Omit<Control, 'id'>;
}

export const controlTemplates: readonly ControlTemplate[] = [
  {
    key: 'mfa',
    build: () => ({
      name: 'MFA on identity assumption',
      summary: 'Adds a second factor on role-assume / cred-reuse paths.',
      target: { kind: 'edge', edgeKind: 'identity-assumes' },
      effect: { probabilityMultiplier: 0.3, detectionDelta: 0.2, costDelta: 1 },
      enabled: true,
    }),
  },
  {
    key: 'prompt-shield',
    build: () => ({
      name: 'Prompt-injection filter',
      summary: 'Inline classifier rejects instruction-bearing inputs reaching the model.',
      target: { kind: 'edge', edgeKind: 'prompt-flow' },
      effect: { probabilityMultiplier: 0.4, detectionDelta: 0.3, costDelta: 0 },
      enabled: true,
    }),
  },
  {
    key: 'egress-filter',
    build: () => ({
      name: 'Egress filter on data flow',
      summary: 'DLP/egress controls inhibit outbound transfers.',
      target: { kind: 'edge', edgeKind: 'data-flow' },
      effect: { probabilityMultiplier: 0.5, detectionDelta: 0.2, costDelta: 0 },
      enabled: true,
    }),
  },
  {
    key: 'tool-allow-list',
    build: () => ({
      name: 'Tool allow-list',
      summary: 'Restricts which tools the agent can invoke at runtime.',
      target: { kind: 'edge', edgeKind: 'tool-grant' },
      effect: { probabilityMultiplier: 0.3, detectionDelta: 0.1, costDelta: 0 },
      enabled: true,
    }),
  },
  {
    key: 'output-sanitiser',
    build: () => ({
      name: 'Output sanitiser',
      summary: 'Strips active payloads from model output before downstream use.',
      target: { kind: 'edge', techniqueId: 'output-handling.unsanitised' },
      effect: { probabilityMultiplier: 0.2, detectionDelta: 0, costDelta: 0 },
      enabled: true,
    }),
  },
  {
    key: 'crown-jewel-hardening',
    build: () => ({
      name: 'Crown-jewel hardening',
      summary: 'Extra access controls on assets tagged crown-jewel.',
      target: { kind: 'node', tag: 'crown-jewel' },
      effect: { probabilityMultiplier: 0.4, detectionDelta: 0.3, costDelta: 1 },
      enabled: true,
    }),
  },
];
