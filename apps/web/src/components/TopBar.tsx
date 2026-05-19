import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadScenario } from '../lib/download.js';
import { useScenarioStore } from '../state/scenario-store.js';
import { RunPanel } from './run/RunPanel.js';

interface Props {
  scenarioId: string;
  scenarioName: string;
}

export function TopBar({ scenarioId, scenarioName }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const renameScenario = useScenarioStore((s) => s.renameScenario);

  function handleExport() {
    if (scenario) downloadScenario(scenario);
  }

  return (
    <header className="flex h-12 items-center px-4 gap-3">
      <Link to="/" className="font-semibold tracking-tight hover:opacity-80">
        Akira
      </Link>
      <span className="text-fg-muted text-sm">/</span>
      <input
        aria-label="Scenario name"
        className="bg-transparent text-sm min-w-0 max-w-xs focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 -ml-1"
        value={scenarioName}
        onChange={(e) => renameScenario(scenarioId, e.target.value)}
      />
      <span className="text-[11px] text-fg-muted">· auto-saved</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-fg-muted hover:text-fg hover:bg-bg-elev transition"
          title="Download scenario JSON"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <RunPanel scenarioId={scenarioId} />
      </div>
    </header>
  );
}
