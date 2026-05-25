import type { RunResult } from '@akira/schema';
import { create } from 'zustand';

export type CanvasOverlay = 'none' | 'heatmap';

interface RunStore {
  runs: Record<string, RunResult>;
  previousRuns: Record<string, RunResult>;
  selectedPathByScenario: Record<string, string | null>;
  rightTabByScenario: Record<string, 'inspector' | 'run' | 'controls'>;
  overlayByScenario: Record<string, CanvasOverlay>;

  setRun: (scenarioId: string, run: RunResult) => void;
  clearRun: (scenarioId: string) => void;
  setSelectedPath: (scenarioId: string, pathId: string | null) => void;
  setRightTab: (scenarioId: string, tab: 'inspector' | 'run' | 'controls') => void;
  setOverlay: (scenarioId: string, overlay: CanvasOverlay) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runs: {},
  previousRuns: {},
  selectedPathByScenario: {},
  rightTabByScenario: {},
  overlayByScenario: {},

  setRun(scenarioId, run) {
    set((state) => {
      const prior = state.runs[scenarioId];
      return {
        runs: { ...state.runs, [scenarioId]: run },
        previousRuns: prior ? { ...state.previousRuns, [scenarioId]: prior } : state.previousRuns,
        selectedPathByScenario: {
          ...state.selectedPathByScenario,
          [scenarioId]: run.paths[0]?.id ?? null,
        },
        rightTabByScenario: { ...state.rightTabByScenario, [scenarioId]: 'run' },
      };
    });
  },

  clearRun(scenarioId) {
    set((state) => {
      const runs = { ...state.runs };
      delete runs[scenarioId];
      const selected = { ...state.selectedPathByScenario };
      delete selected[scenarioId];
      const previous = { ...state.previousRuns };
      delete previous[scenarioId];
      return { runs, selectedPathByScenario: selected, previousRuns: previous };
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

  setOverlay(scenarioId, overlay) {
    set((state) => ({
      overlayByScenario: { ...state.overlayByScenario, [scenarioId]: overlay },
    }));
  },
}));
