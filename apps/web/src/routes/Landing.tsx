import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '../state/scenario-store.js';

export function Landing() {
  const navigate = useNavigate();
  const createScenario = useScenarioStore((s) => s.createScenario);
  const scenarios = useScenarioStore((s) => s.scenarios);

  function handleNew() {
    const id = nanoid(8);
    createScenario(id, 'Untitled scenario');
    navigate(`/scenario/${id}`);
  }

  const recent = Object.values(scenarios);

  return (
    <main className="flex h-full items-center justify-center">
      <div className="w-full max-w-xl px-6 space-y-10 text-center">
        <div className="space-y-3">
          <h1 className="text-6xl font-semibold tracking-tight">Akira</h1>
          <p className="text-fg-muted text-lg">Attack-path simulator for the post-AI world.</p>
        </div>

        <div className="flex gap-3 justify-center">
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

        {recent.length > 0 && (
          <section className="text-left">
            <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2">
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
