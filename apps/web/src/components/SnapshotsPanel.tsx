import { Camera, Clock, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useScenarioStore } from '../state/scenario-store.js';
import { type Snapshot, useSnapshotsStore } from '../state/snapshots-store.js';

// Stable reference so the Zustand selector returns the same value when the
// scenario has no snapshots yet — otherwise React's useSyncExternalStore sees
// a fresh [] on every render and loops.
const NO_SNAPSHOTS: readonly Snapshot[] = Object.freeze([]);

interface Props {
  scenarioId: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SnapshotsPanel({ scenarioId }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const snapshots = useSnapshotsStore((s) => s.snapshots[scenarioId] ?? NO_SNAPSHOTS);
  const capture = useSnapshotsStore((s) => s.capture);
  const renameSnapshot = useSnapshotsStore((s) => s.rename);
  const removeSnapshot = useSnapshotsStore((s) => s.remove);
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const restoreScenario = useScenarioStore((s) => s.restoreSnapshot);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  function handleCapture() {
    if (!scenario) return;
    capture(scenarioId, scenario);
  }

  function handleRestore(snapshotId: string) {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    if (!window.confirm(`Restore "${snap.name}"? Current state goes to undo history.`)) return;
    restoreScenario(scenarioId, snap.scenario);
  }

  function handleDelete(snapshotId: string) {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    if (!window.confirm(`Delete snapshot "${snap.name}"?`)) return;
    removeSnapshot(scenarioId, snapshotId);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Snapshots"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-fg-muted hover:text-fg hover:bg-bg-elev transition disabled:opacity-40"
        disabled={!scenario}
      >
        <Clock className="h-3.5 w-3.5" />
        Snapshots
        {snapshots.length > 0 && (
          <span className="text-[10px] bg-bg-elev-2 text-fg-muted px-1 rounded">
            {snapshots.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-bg-elev border border-border rounded-md shadow-xl p-3 space-y-3 z-20">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Snapshots</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-fg-muted hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <button
            type="button"
            onClick={handleCapture}
            className="w-full flex items-center justify-center gap-1.5 bg-accent text-accent-fg px-3 py-1.5 rounded text-sm font-medium hover:opacity-90 transition"
          >
            <Camera className="h-3.5 w-3.5" />
            Capture current state
          </button>

          {snapshots.length === 0 ? (
            <p className="text-xs text-fg-muted text-center pt-2">
              No snapshots yet. Capture before risky edits so you can roll back.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {[...snapshots].reverse().map((snap) => (
                <li key={snap.id} className="rounded border border-border bg-bg p-2 space-y-1">
                  <input
                    className="w-full bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 -ml-1"
                    value={snap.name}
                    onChange={(e) => renameSnapshot(scenarioId, snap.id, e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-muted font-mono">
                      {formatTimestamp(snap.createdAt)} · {snap.scenario.nodes.length}n/
                      {snap.scenario.edges.length}e
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRestore(snap.id)}
                        title="Restore"
                        className="p-1 text-fg-muted hover:text-accent transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(snap.id)}
                        title="Delete"
                        className="p-1 text-fg-muted hover:text-danger transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
