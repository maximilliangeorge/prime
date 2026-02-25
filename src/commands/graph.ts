import chalk from "chalk";
import ora from "ora";
import { buildGraph } from "../graph-builder.js";
import { formatList, formatTree, formatDot, formatJson } from "../format.js";
import { loadRepoSource } from "../repo-source.js";

export async function graphCommand(
  directory: string,
  options: { format: string; depth?: number }
): Promise<void> {
  const spinner = ora("Loading argument graph…").start();
  const { nodes, remoteNodes, label, hasRemotes } =
    await loadRepoSource(directory);

  if (nodes.length === 0) {
    spinner.stop();
    console.log(chalk.yellow("No node files found."));
    process.exit(0);
  }

  if (hasRemotes) {
    spinner.succeed(
      `Loaded from ${label} (${remoteNodes.length} remote node${remoteNodes.length === 1 ? "" : "s"})`
    );
  } else {
    spinner.succeed(`Loaded from ${label}`);
  }

  const graph = buildGraph([...nodes, ...remoteNodes]);

  if (options.depth !== undefined && options.format !== "tree") {
    console.error(
      chalk.red("--depth is only supported with tree format (-f tree)")
    );
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
