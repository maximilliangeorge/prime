import chalk from 'chalk'
import ora from 'ora'
import { buildGraph } from '../graph-builder.js'
import { loadRepoSource } from '../repo-source.js'
import { initTui } from '../tui/index.js'

export async function browseCommand(directory: string): Promise<void> {
  const spinner = ora('Loading argument graph…').start()
  const { nodes, remoteNodes, label, hasRemotes } =
    await loadRepoSource(directory)

  if (nodes.length === 0) {
    spinner.stop()
    console.log(chalk.yellow('No node files found.'))
    process.exit(0)
  }

  if (hasRemotes) {
    spinner.succeed(
      `Loaded from ${label} (${remoteNodes.length} remote node${remoteNodes.length === 1 ? '' : 's'})`
    )
  } else {
    spinner.succeed(`Loaded from ${label}`)
  }

  const graph = buildGraph([...nodes, ...remoteNodes])

  initTui(graph, label)
}
