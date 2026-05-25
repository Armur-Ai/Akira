import type { Edge as AkiraEdge, Node as AkiraNode, EdgeKind, NodeType } from '@akira/schema';
import {
  Background,
  type Connection,
  type EdgeChange,
  Controls as FlowControls,
  MiniMap,
  type NodeChange,
  type Edge as RFEdge,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useCallback, useMemo } from 'react';
import { edgeColour } from '../../lib/edge-styles.js';
import { useRunStore } from '../../state/run-store.js';
import { useScenarioStore } from '../../state/scenario-store.js';
import { type AkiraFlowNode, type AkiraNodeData, AkiraNodeView } from './AkiraNode.js';

const NODE_TYPES = { akira: AkiraNodeView } as const;
const PALETTE_NODE_MIME = 'application/x-akira-node-type';

function defaultNode(type: NodeType, position: { x: number; y: number }): AkiraNode {
  return {
    id: nanoid(8),
    type,
    label: type === 'mcp-server' ? 'MCP server' : type.charAt(0).toUpperCase() + type.slice(1),
    meta: {},
    tags: [],
    criticality: type === 'data' || type === 'secret' || type === 'credential' ? 0.8 : 0.3,
    position,
  };
}

function defaultEdge(from: string, to: string): AkiraEdge {
  return {
    id: nanoid(8),
    from,
    to,
    kind: 'trust' satisfies EdgeKind,
    techniqueIds: [],
    probability: 0.5,
    cost: 1,
    noise: 0.5,
    requires: [],
    meta: {},
  };
}

interface Props {
  scenarioId: string;
}

function InnerCanvas({ scenarioId }: Props) {
  const scenario = useScenarioStore((s) => s.scenarios[scenarioId]);
  const setSelection = useScenarioStore((s) => s.setSelection);
  const run = useRunStore((s) => s.runs[scenarioId]);
  const selectedPathId = useRunStore((s) => s.selectedPathByScenario[scenarioId] ?? null);
  const overlay = useRunStore((s) => s.overlayByScenario[scenarioId] ?? 'none');
  const { screenToFlowPosition } = useReactFlow();

  const highlightedEdges = useMemo(() => {
    if (!run || !selectedPathId) return null;
    const path = run.paths.find((p) => p.id === selectedPathId);
    if (!path) return null;
    return new Set(path.steps.map((s) => s.edgeId));
  }, [run, selectedPathId]);

  const chokepointEdgeRatio = useMemo(() => {
    if (!run || overlay !== 'heatmap') return null;
    const map = new Map<string, number>();
    for (const c of run.chokepoints) {
      if (c.kind === 'edge') map.set(c.id, c.coverageRatio);
    }
    return map;
  }, [run, overlay]);

  const chokepointNodeRatio = useMemo(() => {
    if (!run || overlay !== 'heatmap') return null;
    const map = new Map<string, number>();
    for (const c of run.chokepoints) {
      if (c.kind === 'node') map.set(c.id, c.coverageRatio);
    }
    return map;
  }, [run, overlay]);

  const flowNodes = useMemo<AkiraFlowNode[]>(() => {
    if (!scenario) return [];
    const entries = new Set(scenario.entryPoints);
    const objectives = new Set(scenario.objectives);
    return scenario.nodes.map((node) => {
      const data: AkiraNodeData = {
        node,
        isEntry: entries.has(node.id),
        isObjective: objectives.has(node.id),
        heatmapIntensity: chokepointNodeRatio?.get(node.id) ?? null,
      };
      return {
        id: node.id,
        type: 'akira',
        position: node.position ?? { x: 0, y: 0 },
        data,
      };
    });
  }, [scenario, chokepointNodeRatio]);

  const flowEdges = useMemo<RFEdge[]>(() => {
    if (!scenario) return [];
    return scenario.edges.map((edge) => {
      const isHighlighted = highlightedEdges?.has(edge.id) ?? false;
      const isDimmed = highlightedEdges !== null && !isHighlighted;
      const heat = chokepointEdgeRatio?.get(edge.id);

      let stroke = edgeColour(edge.kind);
      let strokeWidth = 1 + edge.probability * 2;
      let opacity = 1;

      if (chokepointEdgeRatio && !isHighlighted) {
        if (heat !== undefined) {
          stroke = 'var(--color-warning)';
          strokeWidth = 1 + heat * 3;
          opacity = 0.3 + heat * 0.7;
        } else {
          opacity = 0.2;
        }
      }

      if (isHighlighted) {
        stroke = 'var(--color-accent)';
        strokeWidth = 3;
        opacity = 1;
      } else if (isDimmed) {
        opacity = Math.min(opacity, 0.25);
      }

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: `${edge.kind} · p=${edge.probability.toFixed(2)}`,
        animated: isHighlighted,
        style: { stroke, strokeWidth, opacity },
        labelStyle: { fill: 'var(--color-fg-muted)', fontSize: 10 },
        labelBgStyle: { fill: 'var(--color-bg-elev)' },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };
    });
  }, [scenario, highlightedEdges, chokepointEdgeRatio]);

  const onNodesChange = useCallback(
    (changes: NodeChange<AkiraFlowNode>[]) => {
      const store = useScenarioStore.getState();
      const toRemove: string[] = [];
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          store.setNodePosition(scenarioId, change.id, change.position);
        } else if (change.type === 'position' && change.position) {
          // Stream intermediate positions so dragging feels smooth.
          store.setNodePosition(scenarioId, change.id, change.position);
        } else if (change.type === 'remove') {
          toRemove.push(change.id);
        }
      }
      if (toRemove.length > 0) store.deleteNodes(scenarioId, toRemove);
    },
    [scenarioId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const store = useScenarioStore.getState();
      const toRemove: string[] = [];
      for (const change of changes) {
        if (change.type === 'remove') toRemove.push(change.id);
      }
      if (toRemove.length > 0) store.deleteEdges(scenarioId, toRemove);
    },
    [scenarioId],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const store = useScenarioStore.getState();
      store.addEdge(scenarioId, defaultEdge(params.source, params.target));
    },
    [scenarioId],
  );

  const onSelectionChange = useCallback(
    (params: { nodes: AkiraFlowNode[]; edges: RFEdge[] }) => {
      setSelection({
        nodeIds: params.nodes.map((n) => n.id),
        edgeIds: params.edges.map((e) => e.id),
      });
    },
    [setSelection],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (event.dataTransfer.types.includes(PALETTE_NODE_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const type = event.dataTransfer.getData(PALETTE_NODE_MIME) as NodeType | '';
      if (!type) return;
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      useScenarioStore.getState().addNode(scenarioId, defaultNode(type as NodeType, position));
    },
    [scenarioId, screenToFlowPosition],
  );

  if (!scenario) return null;

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <FlowControls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

export function Canvas({ scenarioId }: Props) {
  return (
    <ReactFlowProvider>
      <InnerCanvas scenarioId={scenarioId} />
    </ReactFlowProvider>
  );
}

export { PALETTE_NODE_MIME };
