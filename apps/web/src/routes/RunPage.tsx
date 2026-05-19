import { Link, useParams } from 'react-router-dom';

export function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  return (
    <main className="flex h-full items-center justify-center text-fg-muted">
      <div className="text-center space-y-3">
        <p>Run {runId} — view coming in Phase 6.</p>
        <Link to="/" className="text-accent underline-offset-2 hover:underline">
          Back to start
        </Link>
      </div>
    </main>
  );
}
