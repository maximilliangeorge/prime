import type { TuiState } from './state.js'
import {
  formatListStructured,
  formatTreeStructured,
  formatNodeDetail,
} from '../format.js'
import { buildSelectableIndices } from './selectable.js'

const HEADER_LINES = 2

function viewportHeight(state: TuiState): number {
  return Math.max(1, state.rows - HEADER_LINES)
}

/**
 * Ensure the cursor's line is visible in the viewport.
 */
function ensureVisible(state: TuiState): void {
  const cursorLineIdx = state.selectableIndices[state.cursorIndex] ?? 0
  const vh = viewportHeight(state)

  if (cursorLineIdx < state.scrollOffset) {
    state.scrollOffset = cursorLineIdx
  } else if (cursorLineIdx >= state.scrollOffset + vh) {
    state.scrollOffset = cursorLineIdx - vh + 1
  }
}

function ensureDetailVisible(state: TuiState): void {
  const vh = viewportHeight(state)
  const max = Math.max(0, state.detailLines.length - vh)
  if (state.detailScroll > max) state.detailScroll = max
  if (state.detailScroll < 0) state.detailScroll = 0
}

export type InputResult = 'render' | 'quit' | 'none'

/**
 * Handle a keypress and mutate state. Returns what the caller should do.
 */
export function handleKey(
  key: string,
  ctrl: boolean,
  state: TuiState,
): InputResult {
  // Ctrl+C always quits
  if (ctrl && key === 'c') return 'quit'

  if (state.screen === 'browser') {
    return handleBrowserKey(key, ctrl, state)
  } else {
    return handleDetailKey(key, ctrl, state)
  }
}

function handleBrowserKey(
  key: string,
  ctrl: boolean,
  state: TuiState,
): InputResult {
  switch (key) {
    case 'q':
      return 'quit'

    case 'j':
    case 'down': {
      if (state.cursorIndex < state.selectableIndices.length - 1) {
        state.cursorIndex++
        ensureVisible(state)
      }
      return 'render'
    }

    case 'k':
    case 'up': {
      if (state.cursorIndex > 0) {
        state.cursorIndex--
        ensureVisible(state)
      }
      return 'render'
    }

    case 'g': {
      state.cursorIndex = 0
      ensureVisible(state)
      return 'render'
    }

    case 'G': {
      state.cursorIndex = Math.max(0, state.selectableIndices.length - 1)
      ensureVisible(state)
      return 'render'
    }

    case 'tab': {
      // Toggle view mode
      const prevNodeKey = state.selectableIndices[state.cursorIndex] !== undefined
        ? state.lines[state.selectableIndices[state.cursorIndex]]?.nodeKey
        : undefined

      state.viewMode = state.viewMode === 'list' ? 'tree' : 'list'
      state.lines = state.viewMode === 'list'
        ? formatListStructured(state.graph)
        : formatTreeStructured(state.graph)
      state.selectableIndices = buildSelectableIndices(state.lines)

      // Try to restore cursor to the same node
      if (prevNodeKey) {
        const newIdx = state.selectableIndices.findIndex(
          (li) => state.lines[li]?.nodeKey === prevNodeKey,
        )
        state.cursorIndex = newIdx >= 0 ? newIdx : 0
      } else {
        state.cursorIndex = 0
      }
      state.scrollOffset = 0
      ensureVisible(state)
      return 'render'
    }

    case 'return': {
      const lineIdx = state.selectableIndices[state.cursorIndex]
      if (lineIdx === undefined) return 'none'
      const nodeKey = state.lines[lineIdx]?.nodeKey
      if (!nodeKey) return 'none'

      openDetail(state, nodeKey)
      return 'render'
    }

    case 'escape':
      return 'quit'

    default:
      return 'none'
  }
}

function openDetail(state: TuiState, nodeKey: string): void {
  const node = state.graph.nodes.get(nodeKey)
  if (!node) return

  // Push current browser position to nav stack
  state.navStack.push({
    nodeKey,
    cursorIndex: state.cursorIndex,
    scrollOffset: state.scrollOffset,
  })

  state.screen = 'detail'
  state.detailNodeKey = nodeKey
  state.detailLines = formatNodeDetail(node)
  state.detailScroll = 0
}

function handleDetailKey(
  key: string,
  ctrl: boolean,
  state: TuiState,
): InputResult {
  switch (key) {
    case 'q':
    case 'escape': {
      // Pop nav stack
      const prev = state.navStack.pop()
      if (state.navStack.length === 0) {
        // Back to browser
        state.screen = 'browser'
        if (prev) {
          state.cursorIndex = prev.cursorIndex
          state.scrollOffset = prev.scrollOffset
        }
      } else {
        // Back to previous detail
        const parent = state.navStack[state.navStack.length - 1]
        const parentNode = state.graph.nodes.get(parent.nodeKey)
        if (parentNode) {
          state.detailNodeKey = parent.nodeKey
          state.detailLines = formatNodeDetail(parentNode)
          state.detailScroll = 0
        }
      }
      return 'render'
    }

    case 'j':
    case 'down': {
      state.detailScroll++
      ensureDetailVisible(state)
      return 'render'
    }

    case 'k':
    case 'up': {
      state.detailScroll--
      ensureDetailVisible(state)
      return 'render'
    }

    case 'g': {
      state.detailScroll = 0
      return 'render'
    }

    case 'G': {
      state.detailScroll = Math.max(0, state.detailLines.length - viewportHeight(state))
      return 'render'
    }

    case 'return': {
      // Check if we can drill into a premise
      const node = state.detailNodeKey ? state.graph.nodes.get(state.detailNodeKey) : null
      if (!node || node.isAxiom) return 'none'

      // Find which premise the detail scroll is near — for now, drill into first premise
      // A more sophisticated version would track which premise line is selected
      return 'none'
    }

    default:
      // Number keys 1-9 to jump to a premise
      if (key >= '1' && key <= '9') {
        const premIdx = parseInt(key) - 1
        const node = state.detailNodeKey ? state.graph.nodes.get(state.detailNodeKey) : null
        if (!node || premIdx >= node.premises.length) return 'none'

        const prem = node.premises[premIdx]
        if (!prem.resolvedPath) return 'none'

        const premNode = state.graph.nodes.get(prem.resolvedPath)
        if (!premNode) return 'none'

        openDetail(state, prem.resolvedPath)
        return 'render'
      }
      return 'none'
  }
}
