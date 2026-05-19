# Authoring a technique

Techniques are reusable attack primitives attached to edges. Adding one is a four-step exercise that the schema enforces.

## 1. Declare it

In either `packages/techniques/src/classical.ts` or `packages/techniques/src/ai.ts` (or a new file you also export from `index.ts`), define your technique with the `defineTechnique` helper. It parses the input through the `Technique` zod schema at module load — invalid entries fail loudly when you `pnpm typecheck` or run the catalogue tests.

```ts
export const promptShield = defineTechnique({
  id: 'jailbreak.role-play',
  name: 'Role-play jailbreak',
  family: 'ai-prompt',
  summary:
    'Wraps a restricted request in a fictional persona to bypass refusal training.',
  references: [
    { url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
      title: 'OWASP LLM01:2025 Prompt Injection' },
  ],
  defaultProbability: 0.5,
  defaultDifficulty: 0.3,
  defaultDetection: 0.4,
  requires: [],
  tags: ['ai', 'llm', 'safety'],
  taxonomy: {
    mitreAtlas: ['AML.T0054'],
    owaspLlm: ['LLM01:2025'],
  },
});
```

## 2. Register it

Add your export to the corresponding array (`classicalTechniques` or `aiTechniques`). The catalogue index exports a `byId` map built from these arrays, and the catalogue test asserts ids are unique — so you'll get a CI failure if you collide.

## 3. Choose its taxonomy mapping

Map to the nearest entries in:

- **MITRE ATT&CK** — for classical primitives (`T1566`, `T1078`…).
- **MITRE ATLAS** — for AI-specific primitives (`AML.T0051`…).
- **OWASP LLM Top-10 (2025)** — for LLM-application risks (`LLM01:2025`…).

Leave fields empty if no clean mapping exists rather than forcing a fit; the report and UI handle empty arrays cleanly.

## 4. Decide its defaults

Authors set the technique's **default** probability/difficulty/detection. Scenarios override these on a per-edge basis — so think of the defaults as "what the average instance of this primitive looks like in a halfway-reasonable environment." Anchors:

| Property | Low (0.2) | Mid (0.5) | High (0.8) |
| --- | --- | --- | --- |
| `defaultProbability` | rare or fragile | takes effort but routinely works | trivial / well-trodden |
| `defaultDifficulty` | script-kiddie | intermediate operator | nation-state-tier |
| `defaultDetection` | invisible | typical | screaming |

## ID rules

- Lowercase, kebab + dot. Regex: `^[a-z0-9][a-z0-9.-]*$`.
- First segment is a category (`prompt-injection`, `rag`, `model`, `mcp`, `lateral`, …).
- Sub-segments make it specific (`prompt-injection.indirect`, `rag.poison`).
- Stable ids are part of the saved scenario format — renaming is a breaking change. Add a new id and leave the old one in place.

## Testing

`packages/techniques/src/catalogue.test.ts` already enforces:

- Every entry parses against the schema.
- Ids are unique.
- The classical and AI sets are disjoint and together cover the whole catalogue.

If you add a category the application should recognise (a new `family`), add it to `TechniqueFamily` in `packages/schema/src/technique.ts` first.
