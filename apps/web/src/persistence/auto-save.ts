import { useScenarioStore } from '../state/scenario-store.js';
import { useSnapshotsStore } from '../state/snapshots-store.js';
import { useSyncStore } from '../state/sync-store.js';
import { saveAllScenarios } from './db.js';
import { saveSnapshots } from './snapshots-db.js';

const DEBOUNCE_MS = 300;
// Slightly longer than IndexedDB so we don't race when both fire on the same
// keystroke. The server-side write is allowed to coast a bit; conflict
// resolution is last-write-wins anyway.
const SERVER_PUSH_DEBOUNCE_MS = 800;

let scenarioTimer: ReturnType<typeof setTimeout> | null = null;
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
let serverPushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleServerPush() {
  if (!useSyncStore.getState().user) return;
  if (serverPushTimer !== null) clearTimeout(serverPushTimer);
  serverPushTimer = setTimeout(() => {
    serverPushTimer = null;
    useSyncStore
      .getState()
      .push()
      .catch((err) => {
        console.error('Sync push failed:', err);
      });
  }, SERVER_PUSH_DEBOUNCE_MS);
}

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
    scheduleServerPush();
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
    scheduleServerPush();
  });

  return () => {
    unsubScenarios();
    unsubSnapshots();
  };
}
