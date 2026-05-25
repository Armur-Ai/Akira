import type { Scenario } from '@akira/schema';
import { create } from 'zustand';
import { useScenarioStore } from './scenario-store.js';

const MAX_HISTORY = 50;
const COALESCE_MS = 500;

interface HistoryStore {
  past: Record<string, Scenario[]>;
  future: Record<string, Scenario[]>;
  lastKey: Record<string, string>;
  lastTime: Record<string, number>;

  canUndo: (scenarioId: string) => boolean;
  canRedo: (scenarioId: string) => boolean;
  undo: (scenarioId: string) => void;
  redo: (scenarioId: string) => void;
  reset: (scenarioId: string) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: {},
  future: {},
  lastKey: {},
  lastTime: {},

  canUndo(scenarioId) {
    return (get().past[scenarioId]?.length ?? 0) > 0;
  },

  canRedo(scenarioId) {
    return (get().future[scenarioId]?.length ?? 0) > 0;
  },

  undo(scenarioId) {
    const state = get();
    const past = state.past[scenarioId] ?? [];
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    if (!prev) return;
    const current = useScenarioStore.getState().scenarios[scenarioId];
    if (!current) return;
    set({
      past: { ...state.past, [scenarioId]: past.slice(0, -1) },
      future: { ...state.future, [scenarioId]: [...(state.future[scenarioId] ?? []), current] },
      lastKey: { ...state.lastKey, [scenarioId]: '' },
      lastTime: { ...state.lastTime, [scenarioId]: 0 },
    });
    useScenarioStore.setState((s) => ({
      scenarios: { ...s.scenarios, [scenarioId]: prev },
    }));
  },

  redo(scenarioId) {
    const state = get();
    const future = state.future[scenarioId] ?? [];
    if (future.length === 0) return;
    const next = future[future.length - 1];
    if (!next) return;
    const current = useScenarioStore.getState().scenarios[scenarioId];
    if (!current) return;
    set({
      past: { ...state.past, [scenarioId]: [...(state.past[scenarioId] ?? []), current] },
      future: { ...state.future, [scenarioId]: future.slice(0, -1) },
      lastKey: { ...state.lastKey, [scenarioId]: '' },
      lastTime: { ...state.lastTime, [scenarioId]: 0 },
    });
    useScenarioStore.setState((s) => ({
      scenarios: { ...s.scenarios, [scenarioId]: next },
    }));
  },

  reset(scenarioId) {
    set((state) => ({
      past: { ...state.past, [scenarioId]: [] },
      future: { ...state.future, [scenarioId]: [] },
      lastKey: { ...state.lastKey, [scenarioId]: '' },
      lastTime: { ...state.lastTime, [scenarioId]: 0 },
    }));
  },
}));

// Call before a mutation. If coalesceKey is supplied and the same key fired
// within COALESCE_MS, the push is dropped — keeps drag/type bursts as one
// undoable step.
export function recordHistory(scenarioId: string, coalesceKey?: string): void {
  const history = useHistoryStore.getState();
  const now = Date.now();
  if (coalesceKey !== undefined) {
    if (
      history.lastKey[scenarioId] === coalesceKey &&
      now - (history.lastTime[scenarioId] ?? 0) < COALESCE_MS
    ) {
      useHistoryStore.setState((s) => ({
        lastTime: { ...s.lastTime, [scenarioId]: now },
      }));
      return;
    }
  }
  const current = useScenarioStore.getState().scenarios[scenarioId];
  if (!current) return;
  useHistoryStore.setState((s) => {
    const past = [...(s.past[scenarioId] ?? []), current].slice(-MAX_HISTORY);
    return {
      past: { ...s.past, [scenarioId]: past },
      future: { ...s.future, [scenarioId]: [] },
      lastKey: { ...s.lastKey, [scenarioId]: coalesceKey ?? '' },
      lastTime: { ...s.lastTime, [scenarioId]: now },
    };
  });
}
