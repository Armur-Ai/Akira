import { NodeType } from '@akira/schema';
import { allTechniques } from '@akira/techniques';

const nodeTypes = NodeType.options;

export function LeftSidebar() {
  return (
    <div className="p-3 space-y-6">
      <section>
        <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2 px-2">
          Nodes
        </h2>
        <ul className="space-y-0.5">
          {nodeTypes.map((t) => (
            <li
              key={t}
              className="px-2 py-1.5 rounded text-sm cursor-grab hover:bg-bg-elev transition select-none"
              draggable
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2 px-2">
          Techniques · {allTechniques.length}
        </h2>
        <ul className="space-y-0.5">
          {allTechniques.map((t) => (
            <li
              key={t.id}
              className="px-2 py-1.5 rounded text-sm cursor-grab hover:bg-bg-elev transition select-none"
              draggable
              title={t.summary}
            >
              <div className="truncate">{t.name}</div>
              <div className="text-xs text-fg-muted truncate">{t.id}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
