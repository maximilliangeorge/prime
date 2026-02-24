import type { StructuredLine } from '../format.js'

/**
 * Build the list of line indices that are selectable (have a nodeKey).
 */
export function buildSelectableIndices(lines: StructuredLine[]): number[] {
  return lines
    .map((l, i) => (l.nodeKey ? i : -1))
    .filter((i) => i >= 0)
}
