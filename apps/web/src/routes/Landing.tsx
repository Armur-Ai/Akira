import { Scenario } from '@akira/schema';
import { Trash2, Upload } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncStatus } from '../components/SyncStatus.js';
import { examples } from '../examples/index.js';
import { clearShareFragment, decodeShareFragment } from '../lib/share.js';
import { useScenarioStore } from '../state/scenario-store.js';

export function Landing() {
  const navigate = useNavigate();
  const createScenario = useScenarioStore((s) => s.createScenario);
  const importScenario = useScenarioStore((s) => s.importScenario);
  const deleteScenario = useScenarioStore((s) => s.deleteScenario);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const sharedHandled = useRef(false);

  useEffect(() => {
    if (sharedHandled.current) return;
    if (!window.location.hash.includes('share=')) return;
    sharedHandled.current = true;
    (async () => {
      try {
        const shared = await decodeShareFragment(window.location.hash);
        if (!shared) return;
        const id = `${shared.id}-${nanoid(4)}`;
        importScenario(id, shared);
        clearShareFragment();
        navigate(`/scenario/${id}`);
      } catch (err) {
        setImportError(
          `Shared link is invalid: ${err instanceof Error ? err.message : String(err)}`,
        );
        clearShareFragment();
      }
    })();
  }, [importScenario, navigate]);

  function handleNew() {
    const id = nanoid(8);
    createScenario(id, 'Untitled scenario');
    navigate(`/scenario/${id}`);
  }

  function handleLoadExample(scenarioJson: (typeof examples)[number]['scenario']) {
    const id = `${scenarioJson.id}-${nanoid(4)}`;
    importScenario(id, scenarioJson);
    navigate(`/scenario/${id}`);
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = Scenario.parse(JSON.parse(text));
      const id = `${parsed.id}-${nanoid(4)}`;
      importScenario(id, parsed);
      navigate(`/scenario/${id}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    }
  }

  const recent = Object.values(scenarios).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-full overflow-y-auto py-12 relative">
      <div className="absolute top-4 right-6">
        <SyncStatus />
      </div>
      <div className="mx-auto w-full max-w-4xl px-6 space-y-12">
        <div className="space-y-3 text-center">
          <h1 className="text-6xl font-semibold tracking-tight">Akira</h1>
          <p className="text-fg-muted text-lg">Attack-path simulator for the post-AI world.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={handleNew}
              className="bg-accent text-accent-fg px-5 py-2.5 rounded-md font-medium hover:opacity-90 transition"
            >
              New scenario
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 border border-border px-5 py-2.5 rounded-md text-fg-muted hover:text-fg hover:border-fg-muted transition"
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
          {importError && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/40 rounded p-2 max-w-xl mx-auto">
              Import failed: {importError}
            </div>
          )}
        </div>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-3">
            Examples
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examples.map((ex) => (
              <li key={ex.key}>
                <button
                  type="button"
                  onClick={() => handleLoadExample(ex.scenario)}
                  className="w-full h-full text-left p-4 rounded-md border border-border hover:border-accent hover:bg-bg-elev transition"
                >
                  <div className="font-medium text-sm mb-1">{ex.title}</div>
                  <div className="text-xs text-fg-muted leading-relaxed">{ex.summary}</div>
                  <div className="text-[11px] text-fg-muted mt-2 font-mono">
                    {ex.scenario.nodes.length} nodes · {ex.scenario.edges.length} edges
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-3">
              Your scenarios · auto-saved locally
            </h2>
            <ul className="space-y-1">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => navigate(`/scenario/${s.id}`)}
                    className="flex-1 text-left px-3 py-2 rounded hover:bg-bg-elev transition"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-fg-muted">
                      {s.nodes.length} nodes · {s.edges.length} edges
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) {
                        deleteScenario(s.id);
                      }
                    }}
                    className="p-2 text-fg-muted hover:text-danger opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
