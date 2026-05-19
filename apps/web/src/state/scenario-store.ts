import { Scenario } from '@akira/schema';
import type {
  Edge as AkiraEdge,
  Node as AkiraNode,
  EdgeKind,
  NodePosition,
  NodeType,
  Scenario as ScenarioType,
} from '@akira/schema';
import { create } from 'zustand';

interface ScenarioStore {
  scenarios: Record<string, ScenarioType>;
  selection: { nodeIds: string[]; edgeIds: string[] };

  // Scenario lifecycle
  createScenario: (id: string, name: string) => ScenarioType;
  importScenario: (id: string, scenario: ScenarioType) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;

  // Node ops
  addNode: (scenarioId: string, node: AkiraNode) => void;
  updateNode: (scenarioId: string, nodeId: string, patch: Partial<AkiraNode>) => void;
  setNodePosition: (scenarioId: string, nodeId: string, position: NodePosition) => void;
  deleteNodes: (scenarioId: string, nodeIds: readonly string[]) => void;

  // Edge ops
  addEdge: (scenarioId: string, edge: AkiraEdge) => void;
  updateEdge: (scenarioId: string, edgeId: string, patch: Partial<AkiraEdge>) => void;
  deleteEdges: (scenarioId: string, edgeIds: readonly string[]) => void;

  // Role toggles
  toggleEntry: (scenarioId: string, nodeId: string) => void;
  toggleObjective: (scenarioId: string, nodeId: string) => void;

  // Selection
  setSelection: (selection: { nodeIds: string[]; edgeIds: string[] }) => void;
}

function replaceScenario(
  state: ScenarioStore,
  scenarioId: string,
  mutate: (s: ScenarioType) => ScenarioType,
): Partial<ScenarioStore> {
  const existing = state.scenarios[scenarioId];
  if (!existing) return {};
  const next = mutate(existing);
  if (next === existing) return {};
  return {
    scenarios: { ...state.scenarios, [scenarioId]: next },
  };
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: {},
  selection: { nodeIds: [], edgeIds: [] },

  createScenario(id, name) {
    const scenario = Scenario.parse({ id, name });
    set((state) => ({ scenarios: { ...state.scenarios, [id]: scenario } }));
    return scenario;
  },

  importScenario(id, scenario) {
    set((state) => ({
      scenarios: { ...state.scenarios, [id]: { ...scenario, id } },
    }));
  },

  renameScenario(id, name) {
    set((state) => replaceScenario(state, id, (s) => ({ ...s, name })));
  },

  deleteScenario(id) {
    set((state) => {
      const next = { ...state.scenarios };
      delete next[id];
      return { scenarios: next };
    });
  },

  addNode(scenarioId, node) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({ ...s, nodes: [...s.nodes, node] })),
    );
  },

  updateNode(scenarioId, nodeId, patch) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const idx = s.nodes.findIndex((n) => n.id === nodeId);
        if (idx === -1) return s;
        const updated = { ...s.nodes[idx], ...patch } as AkiraNode;
        const nodes = [...s.nodes];
        nodes[idx] = updated;
        return { ...s, nodes };
      }),
    );
  },

  setNodePosition(scenarioId, nodeId, position) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const idx = s.nodes.findIndex((n) => n.id === nodeId);
        if (idx === -1) return s;
        const existing = s.nodes[idx];
        if (!existing) return s;
        if (existing.position?.x === position.x && existing.position?.y === position.y) return s;
        const nodes = [...s.nodes];
        nodes[idx] = { ...existing, position };
        return { ...s, nodes };
      }),
    );
  },

  deleteNodes(scenarioId, nodeIds) {
    const remove = new Set(nodeIds);
    if (remove.size === 0) return;
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({
        ...s,
        nodes: s.nodes.filter((n) => !remove.has(n.id)),
        edges: s.edges.filter((e) => !remove.has(e.from) && !remove.has(e.to)),
        entryPoints: s.entryPoints.filter((id) => !remove.has(id)),
        objectives: s.objectives.filter((id) => !remove.has(id)),
      })),
    );
  },

  addEdge(scenarioId, edge) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({ ...s, edges: [...s.edges, edge] })),
    );
  },

  updateEdge(scenarioId, edgeId, patch) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const idx = s.edges.findIndex((e) => e.id === edgeId);
        if (idx === -1) return s;
        const updated = { ...s.edges[idx], ...patch } as AkiraEdge;
        const edges = [...s.edges];
        edges[idx] = updated;
        return { ...s, edges };
      }),
    );
  },

  deleteEdges(scenarioId, edgeIds) {
    const remove = new Set(edgeIds);
    if (remove.size === 0) return;
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({
        ...s,
        edges: s.edges.filter((e) => !remove.has(e.id)),
      })),
    );
  },

  toggleEntry(scenarioId, nodeId) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const entryPoints = s.entryPoints.includes(nodeId)
          ? s.entryPoints.filter((id) => id !== nodeId)
          : [...s.entryPoints, nodeId];
        return { ...s, entryPoints };
      }),
    );
  },

  toggleObjective(scenarioId, nodeId) {
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const objectives = s.objectives.includes(nodeId)
          ? s.objectives.filter((id) => id !== nodeId)
          : [...s.objectives, nodeId];
        return { ...s, objectives };
      }),
    );
  },

  setSelection(selection) {
    set({ selection });
  },
}));

export type { NodeType, EdgeKind };
