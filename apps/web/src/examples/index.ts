import { Scenario } from '@akira/schema';
import type { Scenario as ScenarioType } from '@akira/schema';
import agentToolAbuse from './agent-tool-abuse.json';
import classicCorp from './classic-corp.json';
import modelSupplyChain from './model-supply-chain.json';
import multiAgentTrust from './multi-agent-trust.json';
import ragLeak from './rag-leak.json';

export interface Example {
  key: string;
  title: string;
  summary: string;
  scenario: ScenarioType;
}

// Validate every example at module load so a malformed JSON file fails loudly
// rather than at first interaction.
function example(raw: unknown): Example {
  const scenario = Scenario.parse(raw);
  return {
    key: scenario.id,
    title: scenario.name,
    summary: scenario.description,
    scenario,
  };
}

export const examples: readonly Example[] = [
  example(ragLeak),
  example(agentToolAbuse),
  example(multiAgentTrust),
  example(modelSupplyChain),
  example(classicCorp),
];
