import { cn } from '../lib/cn.js';
import { useRunStore } from '../state/run-store.js';
import { Inspector } from './inspector/Inspector.js';
import { RunResults } from './run/RunResults.js';

interface Props {
  scenarioId: string;
}

export function RightSidebar({ scenarioId }: Props) {
  const tab = useRunStore((s) => s.rightTabByScenario[scenarioId] ?? 'inspector');
  const setTab = useRunStore((s) => s.setRightTab);
  const hasRun = useRunStore((s) => Boolean(s.runs[scenarioId]));

  return (
    <div className="flex flex-col h-full">
      <nav className="flex border-b border-border bg-bg sticky top-0 z-10">
        <TabButton
          active={tab === 'inspector'}
          onClick={() => setTab(scenarioId, 'inspector')}
          label="Inspector"
        />
        <TabButton
          active={tab === 'run'}
          onClick={() => setTab(scenarioId, 'run')}
          label="Run"
          badge={hasRun ? '·' : undefined}
        />
      </nav>
      <div className="flex-1 overflow-y-auto">
        {tab === 'inspector' ? (
          <Inspector scenarioId={scenarioId} />
        ) : (
          <RunResults scenarioId={scenarioId} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 px-3 py-2 text-xs uppercase tracking-wider font-medium transition',
        active ? 'text-fg border-b-2 border-accent -mb-px' : 'text-fg-muted hover:text-fg',
      )}
    >
      {label}
      {badge && <span className="ml-1 text-accent">{badge}</span>}
    </button>
  );
}
