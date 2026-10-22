import type { Node, Edge } from '@xyflow/svelte';

export function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  // Build adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }

  // BFS layering
  const queue: Array<{ id: string; layer: number }> = [];
  const layers = new Map<string, number>();

  // Find root nodes (in-degree == 0)
  for (const n of nodes) {
    if (inDegree.get(n.id) === 0) {
      queue.push({ id: n.id, layer: 0 });
      layers.set(n.id, 0);
    }
  }

  // If cycle or no in-degree 0, pick the first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push({ id: nodes[0].id, layer: 0 });
    layers.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    const neighbors = adj.get(id) || [];
    for (const neighbor of neighbors) {
      const currentLayer = layers.get(neighbor);
      if (currentLayer === undefined || currentLayer < layer + 1) {
        layers.set(neighbor, layer + 1);
        queue.push({ id: neighbor, layer: layer + 1 });
      }
    }
  }

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  for (const n of nodes) {
    const layer = layers.get(n.id) ?? 0;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(n.id);
  }

  // Coordinate geometry
  const X_SPACING = 380;
  const Y_SPACING = 280;
  const START_X = 60;
  const START_Y = 80;

  const positions = new Map<string, { x: number; y: number }>();

  for (const [layer, nodeIds] of layerGroups.entries()) {
    const layerX = START_X + layer * X_SPACING;
    const totalHeight = (nodeIds.length - 1) * Y_SPACING;
    const startY = Math.max(START_Y, START_Y + (400 - totalHeight) / 2);

    nodeIds.forEach((id, idx) => {
      positions.set(id, {
        x: layerX,
        y: startY + idx * Y_SPACING
      });
    });
  }

  return nodes.map((node) => {
    const pos = positions.get(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: { ...pos }
    };
  });
}
