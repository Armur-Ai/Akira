import type { Node as AkiraNode } from '@akira/schema';
import { Handle, type NodeProps, Position, type Node as RFNode } from '@xyflow/react';
import { cn } from '../../lib/cn.js';
import { nodeIcon } from '../../lib/icons.js';

export interface AkiraNodeData extends Record<string, unknown> {
  node: AkiraNode;
  isEntry: boolean;
  isObjective: boolean;
  heatmapIntensity: number | null;
}

export type AkiraFlowNode = RFNode<AkiraNodeData, 'akira'>;

export function AkiraNodeView({ data, selected }: NodeProps<AkiraFlowNode>) {
  const Icon = nodeIcon(data.node.type);
  const heat = data.heatmapIntensity;
  const heatStyle =
    heat !== null && heat > 0
      ? {
          boxShadow: `0 0 0 ${1 + heat * 3}px var(--color-warning)`,
        }
      : undefined;
  return (
    <div
      style={heatStyle}
      className={cn(
        'rounded-lg border bg-bg px-3 py-2 min-w-[160px] shadow-sm transition',
        selected ? 'border-accent ring-1 ring-accent/40' : 'border-border',
        data.isObjective && !heatStyle && 'ring-1 ring-warning',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-fg-muted !border-bg !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-fg-muted !border-bg !w-2 !h-2"
      />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-fg-muted shrink-0" />
        <div className="font-medium text-sm leading-tight truncate">{data.node.label}</div>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-muted">
        <span>{data.node.type}</span>
        {data.isEntry && <span className="text-good">· entry</span>}
        {data.isObjective && <span className="text-warning">· objective</span>}
        {data.node.criticality > 0 && <span>· c{(data.node.criticality * 10).toFixed(0)}</span>}
      </div>
    </div>
  );
}
