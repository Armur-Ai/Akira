import { useScenarioStore } from '../state/scenario-store.js';
import { saveAllScenarios } from './db.js';

const DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | null = null;

export function startAutoSave(): () => void {
  return useScenarioStore.subscribe((state, prev) => {
    if (state.scenarios === prev.scenarios) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveAllScenarios(state.scenarios).catch((err) => {
        console.error('Auto-save failed:', err);
      });
    }, DEBOUNCE_MS);
  });
}
