import { NodeType } from '@akira/schema';
import { allTechniques } from '@akira/techniques';
import { nodeIcon } from '../lib/icons.js';
import { PALETTE_NODE_MIME } from './canvas/Canvas.js';

const nodeTypes = NodeType.options;

export function LeftSidebar() {
  function onDragStart(event: React.DragEvent, type: string) {
    event.dataTransfer.setData(PALETTE_NODE_MIME, type);
    event.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div className="p-3 space-y-6">
      <section>
        <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2 px-2">
          Nodes
        </h2>
        <ul className="space-y-0.5">
          {nodeTypes.map((t) => {
            const Icon = nodeIcon(t);
            return (
              <li key={t}>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-grab hover:bg-bg-elev transition select-none"
                  draggable
                  onDragStart={(e) => onDragStart(e, t)}
                >
                  <Icon className="h-3.5 w-3.5 text-fg-muted" />
                  <span>{t}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-fg-muted mt-2 px-2">Drag onto the canvas.</p>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2 px-2">
          Techniques · {allTechniques.length}
        </h2>
        <ul className="space-y-0.5 max-h-[40vh] overflow-y-auto">
          {allTechniques.map((t) => (
            <li
              key={t.id}
              className="px-2 py-1.5 rounded text-sm hover:bg-bg-elev transition select-none"
              title={t.summary}
            >
              <div className="truncate">{t.name}</div>
              <div className="text-[11px] text-fg-muted font-mono truncate">{t.id}</div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-fg-muted mt-2 px-2">
          Attach techniques to edges from the inspector.
        </p>
      </section>
    </div>
  );
}
