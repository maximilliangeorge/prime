import type { ArgumentGraph, PrimeNode } from '../types.js'
import type { StructuredLine } from '../format.js'

export type ViewMode = 'list' | 'tree'
export type Screen = 'browser' | 'detail'

export interface TuiState {
  graph: ArgumentGraph
  rootDir: string

  // Browser view
  viewMode: ViewMode
  lines: StructuredLine[]
  cursorIndex: number   // index into selectableIndices
  scrollOffset: number
  selectableIndices: number[] // indices into lines[] that have a nodeKey

  // Detail view
  screen: Screen
  detailLines: string[]
  detailScroll: number
  detailNodeKey: string | null

  // Navigation stack for drilling into premises
  navStack: { nodeKey: string; cursorIndex: number; scrollOffset: number }[]

  // Terminal dimensions
  rows: number
  cols: number
}

export function createState(
  graph: ArgumentGraph,
  rootDir: string,
  lines: StructuredLine[],
): TuiState {
  const selectableIndices = lines
    .map((l, i) => (l.nodeKey ? i : -1))
    .filter((i) => i >= 0)

  const rows = process.stdout.rows ?? 24
  const cols = process.stdout.columns ?? 80

  return {
    graph,
    rootDir,
    viewMode: 'list',
    lines,
    cursorIndex: 0,
    scrollOffset: 0,
    selectableIndices,
    screen: 'browser',
    detailLines: [],
    detailScroll: 0,
    detailNodeKey: null,
    navStack: [],
    rows,
    cols,
  }
}
