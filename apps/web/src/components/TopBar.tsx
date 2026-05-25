import { Check, Download, LayoutGrid, Link2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { autoLayout } from '../lib/auto-layout.js';
import { downloadScenario } from '../lib/download.js';
import { buildShareUrl } from '../lib/share.js';
import { useScenarioStore } from '../state/scenario-store.js';
import { RunPanel } from './run/RunPanel.js';

interface Props {
  scenarioId: string;
  scenarioName: string;
}

export function TopBar({ scenarioId, scenarioName }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const renameScenario = useScenarioStore((s) => s.renameScenario);
  const setNodePositions = useScenarioStore((s) => s.setNodePositions);
  const [copied, setCopied] = useState(false);
  const [laying, setLaying] = useState(false);

  const handleExport = useCallback(() => {
    if (scenario) downloadScenario(scenario);
  }, [scenario]);

  const handleShare = useCallback(async () => {
    if (!scenario) return;
    const url = await buildShareUrl(scenario);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: open a prompt with the URL.
      window.prompt('Copy this share link:', url);
    }
  }, [scenario]);

  const handleLayout = useCallback(async () => {
    if (!scenario || scenario.nodes.length === 0) return;
    setLaying(true);
    try {
      const updates = await autoLayout(scenario.nodes, scenario.edges);
      setNodePositions(scenario.id, updates);
    } finally {
      setLaying(false);
    }
  }, [scenario, setNodePositions]);

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

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          onClick={handleLayout}
          disabled={laying || !scenario}
          title="Auto-layout the graph"
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          label={laying ? 'Laying out…' : 'Layout'}
        />
        <ToolbarButton
          onClick={handleShare}
          disabled={!scenario}
          title="Copy a share link to the clipboard"
          icon={
            copied ? <Check className="h-3.5 w-3.5 text-good" /> : <Link2 className="h-3.5 w-3.5" />
          }
          label={copied ? 'Copied' : 'Share'}
        />
        <ToolbarButton
          onClick={handleExport}
          disabled={!scenario}
          title="Download scenario JSON"
          icon={<Download className="h-3.5 w-3.5" />}
          label="Export"
        />
        <RunPanel scenarioId={scenarioId} />
      </div>
    </header>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-fg-muted hover:text-fg hover:bg-bg-elev transition disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}
