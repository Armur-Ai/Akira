import type { Edge as AkiraEdge, Node as AkiraNode } from '@akira/schema';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;

export interface LayoutPosition {
  id: string;
  position: { x: number; y: number };
}

// elkjs is ~1.5 MB minified — lazy-load it on first layout request so users
// who never auto-layout don't pay for it on initial render.
type ElkCtor = new () => { layout: (graph: unknown) => Promise<{ children?: Array<{ id: string; x?: number; y?: number }> }> };
let elkInstancePromise: ReturnType<typeof loadElk> | null = null;

async function loadElk() {
  const mod = await import('elkjs/lib/elk.bundled.js');
  const ELK = mod.default as unknown as ElkCtor;
  return new ELK();
}

function getElk() {
  if (!elkInstancePromise) elkInstancePromise = loadElk();
  return elkInstancePromise;
}

export async function autoLayout(
  nodes: readonly AkiraNode[],
  edges: readonly AkiraEdge[],
): Promise<LayoutPosition[]> {
  if (nodes.length === 0) return [];
  const elk = await getElk();

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.from],
      targets: [e.to],
    })),
  };

  const result = await elk.layout(elkGraph);
  const out: LayoutPosition[] = [];
  for (const child of result.children ?? []) {
    if (child.x !== undefined && child.y !== undefined) {
      out.push({ id: child.id, position: { x: child.x, y: child.y } });
    }
  }
  return out;
}
