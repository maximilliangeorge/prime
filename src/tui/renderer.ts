import chalk from 'chalk'
import type { TuiState } from './state.js'
import { countArguments } from '../format.js'

const HEADER_LINES = 2  // status bar + separator
const FOOTER_LINES = 0

/**
 * Compute the number of content rows available for the viewport.
 */
function viewportHeight(state: TuiState): number {
  return Math.max(1, state.rows - HEADER_LINES - FOOTER_LINES)
}

/**
 * Render the browser screen as an array of strings (one per terminal row).
 */
export function renderBrowser(state: TuiState): string[] {
  const { graph, lines, cursorIndex, scrollOffset, selectableIndices, viewMode, cols } = state
  const vh = viewportHeight(state)

  const nodeCount = graph.nodes.size
  const argCount = countArguments(graph)

  // Status bar
  const left = ` Prime · ${nodeCount} nodes · ${argCount} arguments · ${viewMode}`
  const right = 'tab switch  q quit  enter open'
  const padding = Math.max(0, cols - left.length - right.length)
  const statusBar = chalk.inverse(left + ' '.repeat(padding) + right)
  const separator = chalk.dim('─'.repeat(cols))

  // Current cursor line index in the full lines array
  const cursorLineIdx = selectableIndices[cursorIndex] ?? 0

  const output: string[] = [statusBar, separator]

  for (let i = 0; i < vh; i++) {
    const lineIdx = scrollOffset + i
    if (lineIdx >= lines.length) {
      output.push('')
      continue
    }

    const line = lines[lineIdx]
    const isSelected = lineIdx === cursorLineIdx

    let prefix = '  '
    if (isSelected) {
      prefix = chalk.bold.cyan('> ')
    }

    let text = prefix + line.text
    if (isSelected) {
      text = chalk.bold(text)
    }

    // Truncate to terminal width
    output.push(text.slice(0, cols))
  }

  return output
}

/**
 * Render the detail screen as an array of strings.
 */
export function renderDetail(state: TuiState): string[] {
  const { detailLines, detailScroll, detailNodeKey, graph, cols, rows } = state
  const vh = viewportHeight(state)

  const node = detailNodeKey ? graph.nodes.get(detailNodeKey) : null
  const title = node?.claim ?? node?.relativePath ?? ''

  const left = ` ${title}`
  const right = 'q back  esc back'
  const padding = Math.max(0, cols - left.length - right.length)
  const statusBar = chalk.inverse(left + ' '.repeat(padding) + right)
  const separator = chalk.dim('─'.repeat(cols))

  const output: string[] = [statusBar, separator]

  for (let i = 0; i < vh; i++) {
    const lineIdx = detailScroll + i
    if (lineIdx >= detailLines.length) {
      output.push('')
      continue
    }
    output.push('  ' + detailLines[lineIdx])
  }

  return output
}
