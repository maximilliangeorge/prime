import type {
  PrimeNode,
  ArgumentGraph,
  ValidationResult,
  ValidationError,
} from "./types.js";

export function buildGraph(nodes: PrimeNode[]): ArgumentGraph {
  const nodeMap = new Map<string, PrimeNode>();
  for (const node of nodes) {
    nodeMap.set(node.filePath, node);
  }

  const edges: { from: string; to: string; type: "premise" | "counter" }[] = [];
  for (const node of nodes) {
    for (const premise of node.premises) {
      if (premise.resolvedPath) {
        edges.push({ from: node.filePath, to: premise.resolvedPath, type: "premise" });
      }
    }
    for (const counter of node.counters) {
      if (counter.resolvedPath) {
        edges.push({ from: node.filePath, to: counter.resolvedPath, type: "counter" });
      }
    }
  }

  return { nodes: nodeMap, edges };
}

export function detectCycles(graph: ArgumentGraph): string[][] {
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const key of graph.nodes.keys()) {
    adj.set(key, []);
    color.set(key, WHITE);
  }
  for (const edge of graph.edges) {
    if (edge.type !== "premise") continue;
    const list = adj.get(edge.from);
    if (list) list.push(edge.to);
  }

  function dfs(u: string): void {
    color.set(u, GRAY);
    for (const v of adj.get(u) || []) {
      if (color.get(v) === GRAY) {
        // Back edge found — extract cycle
        const cycle: string[] = [v, u];
        let cur = u;
        while (cur !== v && parent.get(cur) != null) {
          cur = parent.get(cur)!;
          if (cur !== v) cycle.push(cur);
        }
        cycles.push(cycle.reverse());
      } else if (color.get(v) === WHITE) {
        parent.set(v, u);
        dfs(v);
      }
    }
    color.set(u, BLACK);
  }

  for (const key of graph.nodes.keys()) {
    if (color.get(key) === WHITE) {
      parent.set(key, null);
      dfs(key);
    }
  }

  return cycles;
}

export function validate(
  graph: ArgumentGraph,
  rootDir: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check for missing claims
  for (const [filePath, node] of graph.nodes) {
    if (!node.claim) {
      warnings.push({
        file: node.relativePath,
        message: "Missing H1 heading (claim)",
      });
    }
  }

  // Check for broken references (premises and counters)
  for (const [filePath, node] of graph.nodes) {
    for (const ref of [...node.premises, ...node.counters]) {
      if (ref.error) {
        errors.push({
          file: node.relativePath,
          message: ref.error,
        });
      } else if (ref.kind === "local" && ref.resolvedPath) {
        if (!graph.nodes.has(ref.resolvedPath)) {
          errors.push({
            file: node.relativePath,
            message: `Broken reference: ${ref.raw} (resolved to ${ref.resolvedPath})`,
          });
        }
      }
    }
  }

  // Cycle detection
  const cycles = detectCycles(graph);
  for (const cycle of cycles) {
    const node = graph.nodes.get(cycle[0]);
    const relCycle = cycle.map(
      (p) => graph.nodes.get(p)?.relativePath || p
    );
    errors.push({
      file: relCycle[0],
      message: `Circular dependency: ${relCycle.join(" → ")}`,
    });
  }

  return {
    errors,
    warnings,
    valid: errors.length === 0,
  };
}
