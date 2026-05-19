import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { examples } from '../examples/index.js';
import { useScenarioStore } from '../state/scenario-store.js';

export function Landing() {
  const navigate = useNavigate();
  const createScenario = useScenarioStore((s) => s.createScenario);
  const importScenario = useScenarioStore((s) => s.importScenario);
  const scenarios = useScenarioStore((s) => s.scenarios);

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

  const recent = Object.values(scenarios);

  return (
    <main className="min-h-full overflow-y-auto py-12">
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
              disabled
              className="border border-border px-5 py-2.5 rounded-md text-fg-muted opacity-60 cursor-not-allowed"
            >
              Import (soon)
            </button>
          </div>
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
              In this session
            </h2>
            <ul className="space-y-1">
              {recent.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/scenario/${s.id}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-bg-elev transition"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-fg-muted">
                      {s.nodes.length} nodes · {s.edges.length} edges
                    </div>
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
