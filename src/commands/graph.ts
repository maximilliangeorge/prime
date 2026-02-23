import * as path from "node:path";
import chalk from "chalk";
import { discoverNodes } from "../discover.js";
import { parseNode } from "../parse.js";
import { buildGraph } from "../graph-builder.js";
import { formatList, formatTree, formatDot, formatJson } from "../format.js";
import { loadManifest } from "../manifest.js";
import { resolveAllPremises } from "../resolve.js";

export async function graphCommand(
  directory: string,
  options: { format: string; depth?: number }
): Promise<void> {
  const rootDir = path.resolve(directory);
  const files = discoverNodes(rootDir);

  if (files.length === 0) {
    console.log(chalk.yellow("No node files found."));
    process.exit(0);
  }

  const nodes = files.map((f) => parseNode(f, rootDir));

  // Resolve remote premises
  const manifest = loadManifest(rootDir);
  const remoteNodes = await resolveAllPremises(nodes, rootDir, manifest);

  const graph = buildGraph([...nodes, ...remoteNodes]);

  if (options.depth !== undefined && options.format !== "tree") {
    console.error(chalk.red("--depth is only supported with tree format (-f tree)"));
    process.exit(1);
  }

  switch (options.format) {
    case "dot":
      console.log(formatDot(graph));
      break;
    case "json":
      console.log(formatJson(graph));
      break;
    case "tree":
      console.log(formatTree(graph, { maxDepth: options.depth }));
      break;
    case "list":
    default:
      console.log(formatList(graph));
      break;
  }
}
