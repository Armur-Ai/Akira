import { Scenario } from '@akira/schema';
import type {
  Edge as AkiraEdge,
  Node as AkiraNode,
  Control,
  EdgeKind,
  NodePosition,
  NodeType,
  Scenario as ScenarioType,
} from '@akira/schema';
import { create } from 'zustand';
import { recordHistory, useHistoryStore } from './history-store.js';

interface ScenarioStore {
  scenarios: Record<string, ScenarioType>;
  selection: { nodeIds: string[]; edgeIds: string[] };

  // Scenario lifecycle
  createScenario: (id: string, name: string) => ScenarioType;
  importScenario: (id: string, scenario: ScenarioType) => void;
  restoreSnapshot: (id: string, scenario: ScenarioType) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;

  // Node ops
  addNode: (scenarioId: string, node: AkiraNode) => void;
  updateNode: (scenarioId: string, nodeId: string, patch: Partial<AkiraNode>) => void;
  setNodePosition: (scenarioId: string, nodeId: string, position: NodePosition) => void;
  setNodePositions: (
    scenarioId: string,
    updates: ReadonlyArray<{ id: string; position: NodePosition }>,
  ) => void;
  deleteNodes: (scenarioId: string, nodeIds: readonly string[]) => void;

  // Edge ops
  addEdge: (scenarioId: string, edge: AkiraEdge) => void;
  updateEdge: (scenarioId: string, edgeId: string, patch: Partial<AkiraEdge>) => void;
  deleteEdges: (scenarioId: string, edgeIds: readonly string[]) => void;

  // Role toggles
  toggleEntry: (scenarioId: string, nodeId: string) => void;
  toggleObjective: (scenarioId: string, nodeId: string) => void;

  // Controls
  addControl: (scenarioId: string, control: Control) => void;
  updateControl: (scenarioId: string, controlId: string, patch: Partial<Control>) => void;
  toggleControl: (scenarioId: string, controlId: string) => void;
  deleteControl: (scenarioId: string, controlId: string) => void;

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
    useHistoryStore.getState().reset(id);
    return scenario;
  },

  importScenario(id, scenario) {
    set((state) => ({
      scenarios: { ...state.scenarios, [id]: { ...scenario, id } },
    }));
    useHistoryStore.getState().reset(id);
  },

  // Like importScenario but records history so the user can undo a restore.
  restoreSnapshot(id, scenario) {
    recordHistory(id);
    set((state) => ({
      scenarios: { ...state.scenarios, [id]: { ...scenario, id } },
    }));
  },

  renameScenario(id, name) {
    recordHistory(id, `rename:${id}`);
    set((state) => replaceScenario(state, id, (s) => ({ ...s, name })));
  },

  deleteScenario(id) {
    set((state) => {
      const next = { ...state.scenarios };
      delete next[id];
      return { scenarios: next };
    });
    useHistoryStore.getState().reset(id);
  },

  addNode(scenarioId, node) {
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({ ...s, nodes: [...s.nodes, node] })),
    );
  },

  updateNode(scenarioId, nodeId, patch) {
    const fields = Object.keys(patch).sort().join(',');
    recordHistory(scenarioId, `updateNode:${nodeId}:${fields}`);
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
    recordHistory(scenarioId, `pos:${nodeId}`);
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

  setNodePositions(scenarioId, updates) {
    if (updates.length === 0) return;
    recordHistory(scenarioId);
    const byId = new Map(updates.map((u) => [u.id, u.position]));
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        let changed = false;
        const nodes = s.nodes.map((n) => {
          const pos = byId.get(n.id);
          if (!pos) return n;
          if (n.position?.x === pos.x && n.position?.y === pos.y) return n;
          changed = true;
          return { ...n, position: pos };
        });
        return changed ? { ...s, nodes } : s;
      }),
    );
  },

  deleteNodes(scenarioId, nodeIds) {
    const remove = new Set(nodeIds);
    if (remove.size === 0) return;
    recordHistory(scenarioId);
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
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({ ...s, edges: [...s.edges, edge] })),
    );
  },

  updateEdge(scenarioId, edgeId, patch) {
    const fields = Object.keys(patch).sort().join(',');
    recordHistory(scenarioId, `updateEdge:${edgeId}:${fields}`);
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
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({
        ...s,
        edges: s.edges.filter((e) => !remove.has(e.id)),
      })),
    );
  },

  toggleEntry(scenarioId, nodeId) {
    recordHistory(scenarioId);
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
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const objectives = s.objectives.includes(nodeId)
          ? s.objectives.filter((id) => id !== nodeId)
          : [...s.objectives, nodeId];
        return { ...s, objectives };
      }),
    );
  },

  addControl(scenarioId, control) {
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({ ...s, controls: [...s.controls, control] })),
    );
  },

  updateControl(scenarioId, controlId, patch) {
    const fields = Object.keys(patch).sort().join(',');
    recordHistory(scenarioId, `updateControl:${controlId}:${fields}`);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const idx = s.controls.findIndex((c) => c.id === controlId);
        if (idx === -1) return s;
        const controls = [...s.controls];
        controls[idx] = { ...s.controls[idx], ...patch } as Control;
        return { ...s, controls };
      }),
    );
  },

  toggleControl(scenarioId, controlId) {
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => {
        const idx = s.controls.findIndex((c) => c.id === controlId);
        if (idx === -1) return s;
        const controls = [...s.controls];
        const existing = s.controls[idx];
        if (!existing) return s;
        controls[idx] = { ...existing, enabled: !existing.enabled };
        return { ...s, controls };
      }),
    );
  },

  deleteControl(scenarioId, controlId) {
    recordHistory(scenarioId);
    set((state) =>
      replaceScenario(state, scenarioId, (s) => ({
        ...s,
        controls: s.controls.filter((c) => c.id !== controlId),
      })),
    );
  },

  setSelection(selection) {
    set({ selection });
  },
}));

export type { NodeType, EdgeKind };
