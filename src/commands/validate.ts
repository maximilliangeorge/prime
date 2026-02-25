import chalk from "chalk";
import ora from "ora";
import { buildGraph, validate } from "../graph-builder.js";
import { loadRepoSource } from "../repo-source.js";

export async function validateCommand(directory: string): Promise<void> {
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
  const result = validate(graph, label);

  for (const warning of result.warnings) {
    console.log(chalk.yellow(`  warning: ${warning.file}: ${warning.message}`));
  }

  for (const error of result.errors) {
    console.log(chalk.red(`  error: ${error.file}: ${error.message}`));
  }

  if (result.valid) {
    console.log(
      chalk.green(`Valid. ${graph.nodes.size} nodes, ${graph.edges.length} edges.`)
    );
    process.exit(0);
  } else {
    console.log(
      chalk.red(
        `Invalid. ${result.errors.length} error(s), ${result.warnings.length} warning(s).`
      )
    );
    process.exit(1);
  }
}
