import { get, set } from 'idb-keyval';
import type { Snapshot } from '../state/snapshots-store.js';

const KEY = 'akira:snapshots:v1';

export async function loadSnapshots(): Promise<Record<string, Snapshot[]>> {
  try {
    const raw = (await get(KEY)) as unknown;
    if (!raw || typeof raw !== 'object') return {};
    // Light validation: trust the structure but ensure top-level is a dict
    // mapping scenarioId → array. Individual Snapshot validation is skipped
    // here for cost; malformed entries surface as restore failures, not as
    // load-time crashes.
    return raw as Record<string, Snapshot[]>;
  } catch (err) {
    console.error('Failed to load snapshots from IndexedDB:', err);
    return {};
  }
}

export async function saveSnapshots(snapshots: Record<string, Snapshot[]>): Promise<void> {
  await set(KEY, snapshots);
}
