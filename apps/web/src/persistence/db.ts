import { Scenario } from '@akira/schema';
import type { Scenario as ScenarioType } from '@akira/schema';
import { get, set } from 'idb-keyval';

const KEY = 'akira:scenarios:v1';

export async function loadAllScenarios(): Promise<Record<string, ScenarioType>> {
  try {
    const raw = (await get(KEY)) as unknown;
    if (!raw || typeof raw !== 'object') return {};

    const valid: Record<string, ScenarioType> = {};
    for (const [id, candidate] of Object.entries(raw as Record<string, unknown>)) {
      const parsed = Scenario.safeParse(candidate);
      if (parsed.success) {
        valid[id] = parsed.data;
      } else {
        console.warn(`Skipping malformed scenario ${id}:`, parsed.error.flatten());
      }
    }
    return valid;
  } catch (err) {
    console.error('Failed to load scenarios from IndexedDB:', err);
    return {};
  }
}

export async function saveAllScenarios(scenarios: Record<string, ScenarioType>): Promise<void> {
  await set(KEY, scenarios);
}
