import type { RunResult } from '@akira/schema';
import { create } from 'zustand';

interface RunStore {
  runs: Record<string, RunResult>;
  selectedPathByScenario: Record<string, string | null>;
  rightTabByScenario: Record<string, 'inspector' | 'run'>;

  setRun: (scenarioId: string, run: RunResult) => void;
  clearRun: (scenarioId: string) => void;
  setSelectedPath: (scenarioId: string, pathId: string | null) => void;
  setRightTab: (scenarioId: string, tab: 'inspector' | 'run') => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runs: {},
  selectedPathByScenario: {},
  rightTabByScenario: {},

  setRun(scenarioId, run) {
    set((state) => ({
      runs: { ...state.runs, [scenarioId]: run },
      selectedPathByScenario: {
        ...state.selectedPathByScenario,
        [scenarioId]: run.paths[0]?.id ?? null,
      },
      rightTabByScenario: { ...state.rightTabByScenario, [scenarioId]: 'run' },
    }));
  },

  clearRun(scenarioId) {
    set((state) => {
      const runs = { ...state.runs };
      delete runs[scenarioId];
      const selected = { ...state.selectedPathByScenario };
      delete selected[scenarioId];
      return { runs, selectedPathByScenario: selected };
    });
  },

  setSelectedPath(scenarioId, pathId) {
    set((state) => ({
      selectedPathByScenario: { ...state.selectedPathByScenario, [scenarioId]: pathId },
    }));
  },

  setRightTab(scenarioId, tab) {
    set((state) => ({
      rightTabByScenario: { ...state.rightTabByScenario, [scenarioId]: tab },
    }));
  },
}));
