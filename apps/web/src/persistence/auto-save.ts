import { useScenarioStore } from '../state/scenario-store.js';
import { useSnapshotsStore } from '../state/snapshots-store.js';
import { saveAllScenarios } from './db.js';
import { saveSnapshots } from './snapshots-db.js';

const DEBOUNCE_MS = 300;

let scenarioTimer: ReturnType<typeof setTimeout> | null = null;
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

export function startAutoSave(): () => void {
  const unsubScenarios = useScenarioStore.subscribe((state, prev) => {
    if (state.scenarios === prev.scenarios) return;
    if (scenarioTimer !== null) clearTimeout(scenarioTimer);
    scenarioTimer = setTimeout(() => {
      scenarioTimer = null;
      saveAllScenarios(state.scenarios).catch((err) => {
        console.error('Scenario auto-save failed:', err);
      });
    }, DEBOUNCE_MS);
  });

  const unsubSnapshots = useSnapshotsStore.subscribe((state, prev) => {
    if (state.snapshots === prev.snapshots) return;
    if (snapshotTimer !== null) clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => {
      snapshotTimer = null;
      saveSnapshots(state.snapshots).catch((err) => {
        console.error('Snapshot auto-save failed:', err);
      });
    }, DEBOUNCE_MS);
  });

  return () => {
    unsubScenarios();
    unsubSnapshots();
  };
}
