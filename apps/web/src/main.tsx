import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { startAutoSave } from './persistence/auto-save.js';
import { loadAllScenarios } from './persistence/db.js';
import { loadSnapshots } from './persistence/snapshots-db.js';
import { useScenarioStore } from './state/scenario-store.js';
import { useSnapshotsStore } from './state/snapshots-store.js';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Akira: #root element missing');

async function boot() {
  const [scenarios, snapshots] = await Promise.all([loadAllScenarios(), loadSnapshots()]);
  if (Object.keys(scenarios).length > 0) {
    useScenarioStore.setState({ scenarios });
  }
  if (Object.keys(snapshots).length > 0) {
    useSnapshotsStore.setState({ snapshots });
  }
  startAutoSave();
}

void boot();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
