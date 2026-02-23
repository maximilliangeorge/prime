import chalk from "chalk";
import type { ArgumentGraph, PrimeNode } from "./types.js";

const ARG_COLORS = ["cyan", "magenta", "yellow", "green", "blue", "red"] as const;

function findRoots(graph: ArgumentGraph): string[] {
  const hasIncoming = new Set<string>();
  for (const edge of graph.edges) {
    hasIncoming.add(edge.to);
  }
  const roots: string[] = [];
  for (const key of graph.nodes.keys()) {
    if (!hasIncoming.has(key)) {
      roots.push(key);
    }
  }
  return roots.sort();
}

function getChildren(graph: ArgumentGraph, nodeKey: string): string[] {
  return graph.edges
    .filter((e) => e.from === nodeKey)
    .map((e) => e.to)
    .sort();
}

export interface FormatTreeOptions {
  color?: boolean;
}

export function formatTree(
  graph: ArgumentGraph,
  options: FormatTreeOptions = {},
): string {
  const { color = true } = options;

  if (graph.nodes.size === 0) return "";

  // Collect arguments: each non-axiom node with premises forms an argument
  const args: { conclusion: string; premises: string[] }[] = [];
  for (const [key, node] of graph.nodes) {
    if (!node.isAxiom) {
      const premises = getChildren(graph, key);
      if (premises.length > 0) {
        args.push({ conclusion: key, premises });
      }
    }
  }

  if (args.length === 0) {
    // No arguments — just list axioms
    return Array.from(graph.nodes.values())
      .map((n) => `${n.claim || n.relativePath} [axiom]`)
      .join("\n");
  }

  // Sort arguments by conclusion label for stable output
  args.sort((a, b) => {
    const la = graph.nodes.get(a.conclusion)!;
    const lb = graph.nodes.get(b.conclusion)!;
    return (la.claim || la.relativePath).localeCompare(lb.claim || lb.relativePath);
  });

  const lines: string[] = [];
  const seen = new Set<string>();

  args.forEach((arg, argIdx) => {
    const colorName = ARG_COLORS[argIdx % ARG_COLORS.length];
    const c = color ? chalk[colorName] : (s: string) => s;

    if (argIdx > 0) {
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    lines.push(c(`Argument #${argIdx + 1}`));
    lines.push("");

    // Premises
    arg.premises.forEach((premKey, i) => {
      const node = graph.nodes.get(premKey)!;
      const label = node.claim || node.relativePath;
      const suffix = node.isAxiom ? " [axiom]" : "";
      const ref = seen.has(premKey) ? " (ref)" : "";
      seen.add(premKey);

      const connector = i === 0 ? "┌─" : "├─";
      lines.push(`${c(`${connector} *`)} ${label}${suffix}${ref}`);
    });

    // Blank line before conclusion
    lines.push(c("│"));

    // Conclusion
    const cNode = graph.nodes.get(arg.conclusion)!;
    const cLabel = cNode.claim || cNode.relativePath;
    lines.push(`${c("└─ >")} ${cLabel} [conclusion]`);
  });

  return lines.join("\n");
}

export function formatDot(graph: ArgumentGraph): string {
  const lines: string[] = ["digraph prime {", '  rankdir=BT;', ""];

  // Node declarations
  for (const [key, node] of graph.nodes) {
    const label = (node.claim || node.relativePath).replace(/"/g, '\\"');
    const shape = node.isAxiom ? "box" : "ellipse";
    lines.push(`  "${node.relativePath}" [label="${label}", shape=${shape}];`);
  }

  lines.push("");

  // Edges (from node to premise, i.e. "depends on")
  for (const edge of graph.edges) {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (fromNode && toNode) {
      lines.push(`  "${fromNode.relativePath}" -> "${toNode.relativePath}";`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

export function formatJson(graph: ArgumentGraph): string {
  const nodes: Record<string, object> = {};
  for (const [key, node] of graph.nodes) {
    nodes[node.relativePath] = {
      claim: node.claim,
      isAxiom: node.isAxiom,
      premises: node.premises.map((p) => p.raw),
    };
  }

  const edges = graph.edges.map((e) => ({
    from: graph.nodes.get(e.from)?.relativePath || e.from,
    to: graph.nodes.get(e.to)?.relativePath || e.to,
  }));

  return JSON.stringify({ nodes, edges }, null, 2);
}
