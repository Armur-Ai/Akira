import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { startAutoSave } from './persistence/auto-save.js';
import { loadAllScenarios } from './persistence/db.js';
import { useScenarioStore } from './state/scenario-store.js';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Akira: #root element missing');

async function boot() {
  const scenarios = await loadAllScenarios();
  if (Object.keys(scenarios).length > 0) {
    useScenarioStore.setState({ scenarios });
  }
  startAutoSave();
}

void boot();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
