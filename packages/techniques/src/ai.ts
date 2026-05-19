import { defineTechnique } from './define.js';

const OWASP_LLM_TOP10 =
  'https://owasp.org/www-project-top-10-for-large-language-model-applications/';
const ATLAS = 'https://atlas.mitre.org/';

export const promptInjectionDirect = defineTechnique({
  id: 'prompt-injection.direct',
  name: 'Direct prompt injection',
  family: 'ai-prompt',
  summary:
    'An attacker controlling part of the input directly issues instructions that override the system prompt.',
  references: [
    { url: OWASP_LLM_TOP10, title: 'OWASP LLM01:2025 Prompt Injection' },
    { url: ATLAS, title: 'MITRE ATLAS LLM Prompt Injection' },
  ],
  defaultProbability: 0.6,
  defaultDifficulty: 0.2,
  defaultDetection: 0.4,
  tags: ['ai', 'llm'],
  taxonomy: { mitreAtlas: ['AML.T0051'], owaspLlm: ['LLM01:2025'] },
});

export const promptInjectionIndirect = defineTechnique({
  id: 'prompt-injection.indirect',
  name: 'Indirect prompt injection',
  family: 'ai-prompt',
  summary:
    'Untrusted content reaching the model (RAG hits, tool output, fetched pages) carries instructions that the model treats as authoritative.',
  references: [
    { url: OWASP_LLM_TOP10, title: 'OWASP LLM01:2025 Prompt Injection' },
    { url: ATLAS, title: 'MITRE ATLAS LLM Prompt Injection (Indirect)' },
  ],
  defaultProbability: 0.55,
  defaultDifficulty: 0.4,
  defaultDetection: 0.6,
  tags: ['ai', 'llm', 'rag'],
  taxonomy: { mitreAtlas: ['AML.T0051.001'], owaspLlm: ['LLM01:2025'] },
});

export const ragPoison = defineTechnique({
  id: 'rag.poison',
  name: 'RAG store poisoning',
  family: 'ai-rag',
  summary:
    'A writable input to a retrieval store seeds a document that is later retrieved and shapes model behaviour.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM04:2025 Data and Model Poisoning' }],
  defaultProbability: 0.4,
  defaultDifficulty: 0.5,
  defaultDetection: 0.7,
  tags: ['ai', 'rag', 'persistence'],
  taxonomy: { owaspLlm: ['LLM04:2025', 'LLM08:2025'] },
});

export const toolGrantAbuse = defineTechnique({
  id: 'tool-grant.abuse',
  name: 'Tool-grant abuse',
  family: 'ai-tool',
  summary:
    'An LLM with broad tool access is steered into invoking a granted tool against the principal’s intent.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM06:2025 Excessive Agency' }],
  defaultProbability: 0.5,
  defaultDifficulty: 0.4,
  defaultDetection: 0.5,
  requires: ['prompt-injection.direct', 'prompt-injection.indirect'],
  tags: ['ai', 'tools', 'agent'],
  taxonomy: { mitreAtlas: ['AML.T0053'], owaspLlm: ['LLM06:2025'] },
});

export const toolGrantConfusedDeputy = defineTechnique({
  id: 'tool-grant.confused-deputy',
  name: 'Confused-deputy tool grant',
  family: 'ai-tool',
  summary:
    'An agent acting on a user’s behalf carries its own elevated privileges into actions requested by a lower-trust caller.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM06:2025 Excessive Agency' }],
  defaultProbability: 0.45,
  defaultDifficulty: 0.5,
  defaultDetection: 0.6,
  tags: ['ai', 'authz', 'agent'],
  taxonomy: { owaspLlm: ['LLM06:2025'] },
});

export const agentHijack = defineTechnique({
  id: 'agent.hijack',
  name: 'Agent hijack',
  family: 'ai-agent',
  summary:
    'Compromise of an agent’s identity, system prompt, or memory to repurpose it for the attacker.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM01:2025 + LLM07:2025' }],
  defaultProbability: 0.35,
  defaultDifficulty: 0.6,
  defaultDetection: 0.5,
  tags: ['ai', 'agent'],
  taxonomy: { owaspLlm: ['LLM01:2025', 'LLM07:2025'] },
});

export const agentDelegateTrust = defineTechnique({
  id: 'agent.delegate-trust',
  name: 'Trust propagation between agents',
  family: 'ai-agent',
  summary:
    'A compromised upstream agent passes attacker-influenced instructions to a downstream agent that trusts it.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM06:2025 Excessive Agency' }],
  defaultProbability: 0.5,
  defaultDifficulty: 0.4,
  defaultDetection: 0.7,
  requires: ['agent.hijack', 'prompt-injection.direct'],
  tags: ['ai', 'agent', 'multi-agent'],
  taxonomy: { owaspLlm: ['LLM06:2025'] },
});

export const mcpServerImpersonation = defineTechnique({
  id: 'mcp.server-impersonation',
  name: 'MCP server impersonation',
  family: 'ai-mcp',
  summary:
    'An attacker-controlled MCP server registers under the name of, or is wired in alongside, a trusted one.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM03:2025 Supply Chain' }],
  defaultProbability: 0.3,
  defaultDifficulty: 0.5,
  defaultDetection: 0.6,
  tags: ['ai', 'mcp', 'supply-chain'],
  taxonomy: { owaspLlm: ['LLM03:2025'] },
});

export const mcpMaliciousTool = defineTechnique({
  id: 'mcp.malicious-tool',
  name: 'Malicious MCP tool',
  family: 'ai-mcp',
  summary:
    'A legitimately installed MCP server exposes a tool whose description or behaviour is designed to manipulate the calling agent.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM03:2025 + LLM01:2025' }],
  defaultProbability: 0.4,
  defaultDifficulty: 0.4,
  defaultDetection: 0.7,
  tags: ['ai', 'mcp', 'prompt'],
  taxonomy: { owaspLlm: ['LLM03:2025', 'LLM01:2025'] },
});

export const modelSupplyChain = defineTechnique({
  id: 'model.supply-chain',
  name: 'Model supply-chain compromise',
  family: 'ai-model',
  summary:
    'A poisoned base model, fine-tune, adapter, or distribution artefact reaches production via the model supply chain.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM03:2025 Supply Chain' }],
  defaultProbability: 0.25,
  defaultDifficulty: 0.7,
  defaultDetection: 0.8,
  tags: ['ai', 'supply-chain', 'model'],
  taxonomy: { mitreAtlas: ['AML.T0010'], owaspLlm: ['LLM03:2025'] },
});

export const modelWeightsExfil = defineTechnique({
  id: 'model.weights-exfil',
  name: 'Model weights exfiltration',
  family: 'ai-model',
  summary:
    'Direct or distilled extraction of a hosted model’s weights through reads, snapshots, or repeated query distillation.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM10:2025 Unbounded Consumption' }],
  defaultProbability: 0.2,
  defaultDifficulty: 0.7,
  defaultDetection: 0.6,
  tags: ['ai', 'exfil', 'model'],
  taxonomy: { mitreAtlas: ['AML.T0044'], owaspLlm: ['LLM10:2025'] },
});

export const trainingDataExfil = defineTechnique({
  id: 'training-data.exfil',
  name: 'Training-data exfiltration',
  family: 'ai-training',
  summary:
    'Membership-inference, extraction, or jailbreak techniques surface sensitive records the model memorised during training.',
  references: [
    { url: OWASP_LLM_TOP10, title: 'OWASP LLM02:2025 Sensitive Information Disclosure' },
  ],
  defaultProbability: 0.3,
  defaultDifficulty: 0.6,
  defaultDetection: 0.7,
  tags: ['ai', 'exfil', 'privacy'],
  taxonomy: { mitreAtlas: ['AML.T0024'], owaspLlm: ['LLM02:2025'] },
});

export const embeddingPoison = defineTechnique({
  id: 'embedding.poison',
  name: 'Embedding-space poisoning',
  family: 'ai-rag',
  summary:
    'Crafted content shifts the vector neighbourhood of a target query, biasing what the retriever returns.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM08:2025 Vector and Embedding Weaknesses' }],
  defaultProbability: 0.3,
  defaultDifficulty: 0.6,
  defaultDetection: 0.8,
  tags: ['ai', 'rag', 'embeddings'],
  taxonomy: { owaspLlm: ['LLM08:2025'] },
});

export const jailbreakChain = defineTechnique({
  id: 'jailbreak.chain',
  name: 'Jailbreak chain',
  family: 'ai-prompt',
  summary:
    'A multi-turn or compositional jailbreak strips safety conditioning and unlocks restricted capabilities.',
  references: [
    { url: OWASP_LLM_TOP10, title: 'OWASP LLM01:2025 Prompt Injection' },
    { url: ATLAS, title: 'MITRE ATLAS LLM Jailbreak' },
  ],
  defaultProbability: 0.5,
  defaultDifficulty: 0.3,
  defaultDetection: 0.5,
  tags: ['ai', 'llm', 'safety'],
  taxonomy: { mitreAtlas: ['AML.T0054'], owaspLlm: ['LLM01:2025'] },
});

export const outputHandlingUnsanitised = defineTechnique({
  id: 'output-handling.unsanitised',
  name: 'Unsanitised LLM output',
  family: 'ai-output',
  summary:
    'Model output is rendered, executed, or trusted downstream without sanitisation, turning a content vulnerability into code execution, XSS, SQLi, etc.',
  references: [{ url: OWASP_LLM_TOP10, title: 'OWASP LLM05:2025 Improper Output Handling' }],
  defaultProbability: 0.5,
  defaultDifficulty: 0.3,
  defaultDetection: 0.4,
  tags: ['ai', 'output'],
  taxonomy: { owaspLlm: ['LLM05:2025'] },
});

export const aiTechniques = [
  promptInjectionDirect,
  promptInjectionIndirect,
  ragPoison,
  toolGrantAbuse,
  toolGrantConfusedDeputy,
  agentHijack,
  agentDelegateTrust,
  mcpServerImpersonation,
  mcpMaliciousTool,
  modelSupplyChain,
  modelWeightsExfil,
  trainingDataExfil,
  embeddingPoison,
  jailbreakChain,
  outputHandlingUnsanitised,
];
