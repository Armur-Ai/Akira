import type { Scenario } from '@akira/schema';
import { nanoid } from 'nanoid';
import { create } from 'zustand';

export interface Snapshot {
  id: string;
  scenarioId: string;
  name: string;
  createdAt: string;
  scenario: Scenario;
}

interface SnapshotsStore {
  snapshots: Record<string, Snapshot[]>;

  capture: (scenarioId: string, scenario: Scenario, name?: string) => Snapshot;
  rename: (scenarioId: string, snapshotId: string, name: string) => void;
  remove: (scenarioId: string, snapshotId: string) => void;
  list: (scenarioId: string) => readonly Snapshot[];
}

function defaultName(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 16).replace('T', ' ')}`;
}

export const useSnapshotsStore = create<SnapshotsStore>((set, get) => ({
  snapshots: {},

  capture(scenarioId, scenario, name) {
    const snap: Snapshot = {
      id: nanoid(8),
      scenarioId,
      name: name ?? defaultName(),
      createdAt: new Date().toISOString(),
      scenario: structuredClone(scenario),
    };
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [scenarioId]: [...(state.snapshots[scenarioId] ?? []), snap],
      },
    }));
    return snap;
  },

  rename(scenarioId, snapshotId, name) {
    set((state) => {
      const list = state.snapshots[scenarioId];
      if (!list) return state;
      const next = list.map((s) => (s.id === snapshotId ? { ...s, name } : s));
      return { snapshots: { ...state.snapshots, [scenarioId]: next } };
    });
  },

  remove(scenarioId, snapshotId) {
    set((state) => {
      const list = state.snapshots[scenarioId];
      if (!list) return state;
      const next = list.filter((s) => s.id !== snapshotId);
      return { snapshots: { ...state.snapshots, [scenarioId]: next } };
    });
  },

  list(scenarioId) {
    return get().snapshots[scenarioId] ?? [];
  },
}));
