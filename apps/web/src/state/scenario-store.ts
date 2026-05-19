import { Scenario } from '@akira/schema';
import type { Scenario as ScenarioType } from '@akira/schema';
import { create } from 'zustand';

interface ScenarioStore {
  scenarios: Record<string, ScenarioType>;
  selection: { nodeIds: string[]; edgeIds: string[] };

  createScenario: (id: string, name: string) => ScenarioType;
  renameScenario: (id: string, name: string) => void;
  patchScenario: (id: string, patch: Partial<ScenarioType>) => void;
  deleteScenario: (id: string) => void;
  setSelection: (selection: { nodeIds: string[]; edgeIds: string[] }) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: {},
  selection: { nodeIds: [], edgeIds: [] },

  createScenario(id, name) {
    const scenario = Scenario.parse({ id, name });
    set((state) => ({
      scenarios: { ...state.scenarios, [id]: scenario },
    }));
    return scenario;
  },

  renameScenario(id, name) {
    set((state) => {
      const existing = state.scenarios[id];
      if (!existing) return state;
      return {
        scenarios: {
          ...state.scenarios,
          [id]: { ...existing, name },
        },
      };
    });
  },

  patchScenario(id, patch) {
    set((state) => {
      const existing = state.scenarios[id];
      if (!existing) return state;
      return {
        scenarios: {
          ...state.scenarios,
          [id]: { ...existing, ...patch },
        },
      };
    });
  },

  deleteScenario(id) {
    set((state) => {
      const next = { ...state.scenarios };
      delete next[id];
      return { scenarios: next };
    });
  },

  setSelection(selection) {
    set({ selection });
  },
}));
