import * as readline from 'node:readline'
import type { ArgumentGraph } from '../types.js'
import { formatListStructured } from '../format.js'
import { createState } from './state.js'
import {
  enterAltScreen,
  exitAltScreen,
  hideCursor,
  showCursor,
  writeScreen,
} from './screen.js'
import { renderBrowser, renderDetail } from './renderer.js'
import { handleKey, type InputResult } from './input.js'

/**
 * Launch the interactive TUI browser for an argument graph.
 */
export function initTui(graph: ArgumentGraph, rootDir: string): void {
  if (!process.stdin.isTTY) {
    console.error('Interactive browse requires a TTY.')
    process.exit(1)
  }

  const lines = formatListStructured(graph)
  const state = createState(graph, rootDir, lines)

  // Enter alternate screen
  enterAltScreen()
  hideCursor()

  function render(): void {
    const output =
      state.screen === 'browser'
        ? renderBrowser(state)
        : renderDetail(state)
    writeScreen(output)
  }

  function cleanup(): void {
    showCursor()
    exitAltScreen()
    if (process.stdin.isRaw) {
      process.stdin.setRawMode(false)
    }
    process.stdin.pause()
  }

  // Handle resize
  process.stdout.on('resize', () => {
    state.rows = process.stdout.rows ?? 24
    state.cols = process.stdout.columns ?? 80
    render()
  })

  // Ensure cleanup on exit
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    cleanup()
    process.exit(0)
  })

  // Set up raw mode for keypresses
  process.stdin.setRawMode(true)
  process.stdin.resume()
  readline.emitKeypressEvents(process.stdin)

  process.stdin.on('keypress', (_str: string | undefined, key: readline.Key) => {
    if (!key) return

    // Normalize key name
    let name = key.name ?? key.sequence ?? ''
    const ctrl = !!key.ctrl

    // Handle shift+g for 'G'
    if (key.shift && name === 'g') name = 'G'

    // Map common key names
    if (name === '\t' || key.sequence === '\t') name = 'tab'

    const result: InputResult = handleKey(name, ctrl, state)

    if (result === 'quit') {
      cleanup()
      process.exit(0)
    } else if (result === 'render') {
      render()
    }
  })

  // Initial render
  render()
}
