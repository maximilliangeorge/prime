import * as path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { loadRepoSource } from "../repo-source.js";
import { buildGraph } from "../graph-builder.js";
import type { ArgumentGraph, PrimeNode } from "../types.js";

export async function pluckCommand(
  reference: string,
  options: { depth?: number }
): Promise<void> {
  const isRemote =
    reference.startsWith("prime://") || reference.startsWith("https://");

  if (isRemote) {
    console.error(
      chalk.red("pluck currently supports local paths only.")
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(reference);
  const rootDir = process.cwd();

  const spinner = ora("Loading argument graph…").start();
  const { nodes, remoteNodes } = await loadRepoSource(rootDir);

  if (nodes.length === 0) {
    spinner.stop();
    console.log(chalk.yellow("No node files found."));
    process.exit(0);
  }

  const graph = buildGraph([...nodes, ...remoteNodes]);
  spinner.stop();

  const targetNode = graph.nodes.get(resolvedPath);
  if (!targetNode) {
    console.error(chalk.red(`Node not found in graph: ${reference}`));
    process.exit(1);
  }

  const maxDepth = options.depth ?? -1;
  const output = renderMarkdown(graph, resolvedPath, maxDepth);
  console.log(output);
}

function getChildren(graph: ArgumentGraph, nodeKey: string): string[] {
  return graph.edges
    .filter((e) => e.from === nodeKey)
    .map((e) => e.to)
    .sort((a, b) => {
      const na = graph.nodes.get(a)!;
      const nb = graph.nodes.get(b)!;
      if (na.isAxiom !== nb.isAxiom) return na.isAxiom ? 1 : -1;
      return (na.claim || na.relativePath).localeCompare(
        nb.claim || nb.relativePath
      );
    });
}

function renderMarkdown(
  graph: ArgumentGraph,
  rootKey: string,
  maxDepth: number
): string {
  const lines: string[] = [];
  const visited = new Set<string>();

  function walk(nodeKey: string, depth: number, numbering: string): void {
    const node = graph.nodes.get(nodeKey)!;
    const headingLevel = Math.min(depth + 1, 6);
    const heading = "#".repeat(headingLevel);
    const label = node.claim || node.relativePath;

    if (visited.has(nodeKey)) {
      lines.push(`${heading} ${numbering}${label}`);
      lines.push("");
      lines.push("*(see above)*");
      lines.push("");
      return;
    }
    visited.add(nodeKey);

    // Heading
    if (depth === 0) {
      lines.push(`${heading} ${label}`);
    } else {
      lines.push(`${heading} Premise ${numbering}${label}`);
    }
    lines.push("");

    // Type
    lines.push(`**Type:** ${node.isAxiom ? "axiom" : "derived"}`);
    lines.push("");

    // Body (strip any residual H1 heading)
    if (node.body) {
      const body = node.body.replace(/^#\s+.+\n?/m, "").trim();
      if (body) {
        lines.push(body);
        lines.push("");
      }
    }

    // Recurse into premises
    const children = getChildren(graph, nodeKey);
    if (children.length === 0) return;

    if (maxDepth !== -1 && depth >= maxDepth) {
      lines.push(
        `*${children.length} premise${children.length === 1 ? "" : "s"} not expanded (depth limit reached)*`
      );
      lines.push("");
      return;
    }

    children.forEach((child, i) => {
      const childNumbering =
        numbering === "" ? `${i + 1}: ` : `${numbering.replace(/: $/, "")}.${i + 1}: `;
      walk(child, depth + 1, childNumbering);
    });
  }

  walk(rootKey, 0, "");
  return lines.join("\n").trimEnd();
}
