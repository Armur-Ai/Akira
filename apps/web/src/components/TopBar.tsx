import { Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RunPanel } from './run/RunPanel.js';

interface Props {
  scenarioId: string;
  scenarioName: string;
}

export function TopBar({ scenarioId, scenarioName }: Props) {
  return (
    <header className="flex h-12 items-center px-4 gap-3">
      <Link to="/" className="font-semibold tracking-tight hover:opacity-80">
        Akira
      </Link>
      <span className="text-fg-muted text-sm">/</span>
      <span className="text-sm">{scenarioName}</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-fg-muted hover:text-fg hover:bg-bg-elev transition disabled:opacity-40"
          disabled
          title="Persistence lands in Phase 8"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
        <RunPanel scenarioId={scenarioId} />
      </div>
    </header>
  );
}
