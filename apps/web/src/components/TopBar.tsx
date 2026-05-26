import { Check, Download, LayoutGrid, Link2, Redo2, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { autoLayout } from '../lib/auto-layout.js';
import { downloadScenario } from '../lib/download.js';
import { lintScenario } from '../lib/lint.js';
import { buildShareUrl } from '../lib/share.js';
import { useHistoryStore } from '../state/history-store.js';
import { useScenarioStore } from '../state/scenario-store.js';
import { SnapshotsPanel } from './SnapshotsPanel.js';
import { RunPanel } from './run/RunPanel.js';

interface Props {
  scenarioId: string;
  scenarioName: string;
}

export function TopBar({ scenarioId, scenarioName }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const renameScenario = useScenarioStore((s) => s.renameScenario);
  const setNodePositions = useScenarioStore((s) => s.setNodePositions);
  const canUndo = useHistoryStore((s) => (s.past[scenarioId]?.length ?? 0) > 0);
  const canRedo = useHistoryStore((s) => (s.future[scenarioId]?.length ?? 0) > 0);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
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

  // Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z (or Cmd+Y) global shortcuts.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
          return;
        event.preventDefault();
        undo(scenarioId);
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
          return;
        event.preventDefault();
        redo(scenarioId);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scenarioId, undo, redo]);

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
      <LintBadge scenarioId={scenarioId} />

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          onClick={() => undo(scenarioId)}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          icon={<Undo2 className="h-3.5 w-3.5" />}
        />
        <IconButton
          onClick={() => redo(scenarioId)}
          disabled={!canRedo}
          title="Redo (⇧⌘Z)"
          icon={<Redo2 className="h-3.5 w-3.5" />}
        />
        <Separator />
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
        <SnapshotsPanel scenarioId={scenarioId} />
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

function IconButton({
  onClick,
  disabled,
  title,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-bg-elev transition disabled:opacity-30"
    >
      {icon}
    </button>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function LintBadge({ scenarioId }: { scenarioId: string }) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  if (!scenario) return null;
  const result = lintScenario(scenario);
  if (result.issues.length === 0) return null;
  const title = result.issues.map((i) => `· ${i.message}`).join('\n');
  return (
    <span
      className="text-[11px] text-warning border border-warning/40 bg-warning/10 px-1.5 py-0.5 rounded"
      title={title}
    >
      {result.issues.length} {result.issues.length === 1 ? 'issue' : 'issues'}
    </span>
  );
}
