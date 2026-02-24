import * as fs from 'node:fs'
import chalk from 'chalk'
import matter from 'gray-matter'
import type { ArgumentGraph, PrimeNode } from './types.js'

const ARG_COLORS = [
  'cyan',
  'magenta',
  'yellow',
  'green',
  'blue',
  'red',
] as const

function findRoots(graph: ArgumentGraph): string[] {
  const hasIncoming = new Set<string>()
  for (const edge of graph.edges) {
    hasIncoming.add(edge.to)
  }
  const roots: string[] = []
  for (const key of graph.nodes.keys()) {
    if (!hasIncoming.has(key)) {
      roots.push(key)
    }
  }
  return roots.sort()
}

function getChildren(graph: ArgumentGraph, nodeKey: string): string[] {
  return graph.edges
    .filter((e) => e.from === nodeKey)
    .map((e) => e.to)
    .sort((a, b) => {
      const na = graph.nodes.get(a)!
      const nb = graph.nodes.get(b)!
      // Prior conclusions first, then axioms
      if (na.isAxiom !== nb.isAxiom) return na.isAxiom ? 1 : -1
      return (na.claim || na.relativePath).localeCompare(
        nb.claim || nb.relativePath,
      )
    })
}

export interface FormatOptions {
  color?: boolean
}

export function formatList(
  graph: ArgumentGraph,
  options: FormatOptions = {},
): string {
  const { color = true } = options

  if (graph.nodes.size === 0) return ''

  // Collect arguments: each non-axiom node with premises forms an argument
  const args: { conclusion: string; premises: string[] }[] = []
  for (const [key, node] of graph.nodes) {
    if (!node.isAxiom) {
      const premises = getChildren(graph, key)
      if (premises.length > 0) {
        args.push({ conclusion: key, premises })
      }
    }
  }

  if (args.length === 0) {
    // No arguments — just list axioms
    return Array.from(graph.nodes.values())
      .map((n) => `${n.claim || n.relativePath} [axiom]`)
      .join('\n')
  }

  // Topological sort: foundational arguments (whose conclusions are premises
  // of later arguments) come first. Ties broken alphabetically by label.
  const conclusionSet = new Set(args.map((a) => a.conclusion))
  // Build adjacency: if arg A's conclusion is a premise of arg B, A must come before B
  const dependsOn = new Map<string, Set<string>>() // conclusion -> set of conclusion keys it depends on
  for (const arg of args) {
    const deps = new Set<string>()
    for (const p of arg.premises) {
      if (conclusionSet.has(p)) {
        deps.add(p)
      }
    }
    dependsOn.set(arg.conclusion, deps)
  }

  // Kahn's algorithm for topological sort
  const inDegree = new Map<string, number>()
  for (const arg of args) {
    inDegree.set(arg.conclusion, 0)
  }
  for (const [key, deps] of dependsOn) {
    inDegree.set(key, deps.size)
  }

  const queue: string[] = []
  for (const [key, deg] of inDegree) {
    if (deg === 0) queue.push(key)
  }
  // Sort queue alphabetically for stable tie-breaking
  queue.sort((a, b) => {
    const la = graph.nodes.get(a)!
    const lb = graph.nodes.get(b)!
    return (la.claim || la.relativePath).localeCompare(
      lb.claim || lb.relativePath,
    )
  })

  const sorted: string[] = []
  while (queue.length > 0) {
    const cur = queue.shift()!
    sorted.push(cur)
    // Find args that depend on cur and decrement their in-degree
    for (const [key, deps] of dependsOn) {
      if (deps.has(cur)) {
        deps.delete(cur)
        const newDeg = inDegree.get(key)! - 1
        inDegree.set(key, newDeg)
        if (newDeg === 0) {
          // Insert into queue in sorted position for stable ordering
          const label = (n: string) => {
            const node = graph.nodes.get(n)!
            return node.claim || node.relativePath
          }
          const idx = queue.findIndex(
            (q) => label(key).localeCompare(label(q)) < 0,
          )
          if (idx === -1) queue.push(key)
          else queue.splice(idx, 0, key)
        }
      }
    }
  }

  // Reorder args according to topological sort
  const orderMap = new Map(sorted.map((key, i) => [key, i]))
  args.sort(
    (a, b) =>
      (orderMap.get(a.conclusion) ?? 0) - (orderMap.get(b.conclusion) ?? 0),
  )

  const lines: string[] = []
  const seen = new Set<string>()

  args.forEach((arg, argIdx) => {
    const colorName = ARG_COLORS[argIdx % ARG_COLORS.length]
    const c = color ? chalk[colorName] : (s: string) => s

    if (argIdx > 0) {
      lines.push('')
      //lines.push('---')
      lines.push('')
    }

    lines.push(c(`${argIdx + 1})`))
    lines.push('')

    // Premises
    arg.premises.forEach((premKey, i) => {
      const node = graph.nodes.get(premKey)!
      const label = node.claim || node.relativePath
      const suffix = node.isAxiom ? ' [axiom]' : ''
      const ref = seen.has(premKey) ? ' (ref)' : ''
      seen.add(premKey)

      const connector = i === 0 ? '┌─' : '├─'
      lines.push(`${c(`${connector} *`)} ${label}${suffix}${ref}`)
    })

    // Blank line before conclusion
    lines.push(c('│'))

    // Conclusion
    const cNode = graph.nodes.get(arg.conclusion)!
    const cLabel = cNode.claim || cNode.relativePath
    lines.push(`${c('└─ >')} ${cLabel} [conclusion]`)
  })

  return lines.join('\n')
}

/** Count nodes that would be printed in the subtree below nodeKey. */
function countDescendants(graph: ArgumentGraph, nodeKey: string, visited: Set<string>): number {
  const children = getChildren(graph, nodeKey)
  let count = 0
  for (const child of children) {
    count += 1
    if (visited.has(child)) continue
    visited.add(child)
    count += countDescendants(graph, child, visited)
  }
  return count
}

export interface TreeFormatOptions {
  maxDepth?: number
}

export function formatTree(
  graph: ArgumentGraph,
  options: TreeFormatOptions = {},
): string {
  if (graph.nodes.size === 0) return ''

  const { maxDepth } = options

  // Roots = nodes with no incoming edges (final conclusions)
  const roots = findRoots(graph)

  if (roots.length === 0) return ''

  const lines: string[] = []
  const globalVisited = new Set<string>()

  function walk(
    nodeKey: string,
    prefix: string,
    isLast: boolean,
    isRoot: boolean,
    depth: number,
  ): void {
    const node = graph.nodes.get(nodeKey)!
    const label = node.claim || node.relativePath

    const connector = isRoot ? '' : isLast ? '└─ ' : '├─ '
    const ref = globalVisited.has(nodeKey) ? ' (ref)' : ''
    const suffix = node.isAxiom ? ' [axiom]' : ''
    globalVisited.add(nodeKey)

    lines.push(`${prefix}${connector}${label}${suffix}${ref}`)

    if (ref) return // already expanded

    const children = getChildren(graph, nodeKey)

    if (maxDepth !== undefined && depth >= maxDepth) {
      if (children.length > 0) {
        const remaining = countDescendants(graph, nodeKey, new Set(globalVisited))
        const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')
        lines.push(`${childPrefix}└─ (+${remaining} more)`)
      }
      return
    }
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')
    children.forEach((child, i) => {
      walk(child, childPrefix, i === children.length - 1, false, depth + 1)
    })
  }

  roots.forEach((root, rootIdx) => {
    if (rootIdx > 0) lines.push('')
    walk(root, '', true, true, 0)
  })

  return lines.join('\n')
}

export function formatDot(graph: ArgumentGraph): string {
  const lines: string[] = ['digraph prime {', '  rankdir=BT;', '']

  // Node declarations
  for (const [key, node] of graph.nodes) {
    const label = (node.claim || node.relativePath).replace(/"/g, '\\"')
    const shape = node.isAxiom ? 'box' : 'ellipse'
    lines.push(`  "${node.relativePath}" [label="${label}", shape=${shape}];`)
  }

  lines.push('')

  // Edges (from node to premise, i.e. "depends on")
  for (const edge of graph.edges) {
    const fromNode = graph.nodes.get(edge.from)
    const toNode = graph.nodes.get(edge.to)
    if (fromNode && toNode) {
      lines.push(`  "${fromNode.relativePath}" -> "${toNode.relativePath}";`)
    }
  }

  lines.push('}')
  return lines.join('\n')
}

export function formatJson(graph: ArgumentGraph): string {
  const nodes: Record<string, object> = {}
  for (const [key, node] of graph.nodes) {
    nodes[node.relativePath] = {
      claim: node.claim,
      isAxiom: node.isAxiom,
      premises: node.premises.map((p) => p.raw),
    }
  }

  const edges = graph.edges.map((e) => ({
    from: graph.nodes.get(e.from)?.relativePath || e.from,
    to: graph.nodes.get(e.to)?.relativePath || e.to,
  }))

  return JSON.stringify({ nodes, edges }, null, 2)
}

// --- Structured formats for TUI ---

export interface StructuredLine {
  text: string
  nodeKey?: string
}

/**
 * Returns list-formatted lines with nodeKey annotations for selectable lines.
 * Similar to formatList but returns structured data instead of a joined string.
 */
export function formatListStructured(graph: ArgumentGraph): StructuredLine[] {
  if (graph.nodes.size === 0) return []

  const args: { conclusion: string; premises: string[] }[] = []
  for (const [key, node] of graph.nodes) {
    if (!node.isAxiom) {
      const premises = getChildren(graph, key)
      if (premises.length > 0) {
        args.push({ conclusion: key, premises })
      }
    }
  }

  if (args.length === 0) {
    return Array.from(graph.nodes.entries()).map(([key, n]) => ({
      text: `${n.claim || n.relativePath} [axiom]`,
      nodeKey: key,
    }))
  }

  // Reuse same topological sort logic as formatList
  const conclusionSet = new Set(args.map((a) => a.conclusion))
  const dependsOn = new Map<string, Set<string>>()
  for (const arg of args) {
    const deps = new Set<string>()
    for (const p of arg.premises) {
      if (conclusionSet.has(p)) deps.add(p)
    }
    dependsOn.set(arg.conclusion, deps)
  }

  const inDegree = new Map<string, number>()
  for (const arg of args) inDegree.set(arg.conclusion, 0)
  for (const [key, deps] of dependsOn) inDegree.set(key, deps.size)

  const queue: string[] = []
  for (const [key, deg] of inDegree) {
    if (deg === 0) queue.push(key)
  }
  queue.sort((a, b) => {
    const la = graph.nodes.get(a)!
    const lb = graph.nodes.get(b)!
    return (la.claim || la.relativePath).localeCompare(lb.claim || lb.relativePath)
  })

  const sorted: string[] = []
  while (queue.length > 0) {
    const cur = queue.shift()!
    sorted.push(cur)
    for (const [key, deps] of dependsOn) {
      if (deps.has(cur)) {
        deps.delete(cur)
        const newDeg = inDegree.get(key)! - 1
        inDegree.set(key, newDeg)
        if (newDeg === 0) {
          const label = (n: string) => {
            const node = graph.nodes.get(n)!
            return node.claim || node.relativePath
          }
          const idx = queue.findIndex((q) => label(key).localeCompare(label(q)) < 0)
          if (idx === -1) queue.push(key)
          else queue.splice(idx, 0, key)
        }
      }
    }
  }

  const orderMap = new Map(sorted.map((key, i) => [key, i]))
  args.sort(
    (a, b) => (orderMap.get(a.conclusion) ?? 0) - (orderMap.get(b.conclusion) ?? 0),
  )

  const lines: StructuredLine[] = []
  const seen = new Set<string>()

  args.forEach((arg, argIdx) => {
    if (argIdx > 0) {
      lines.push({ text: '' })
      lines.push({ text: '' })
    }

    lines.push({ text: `${argIdx + 1})` })
    lines.push({ text: '' })

    arg.premises.forEach((premKey, i) => {
      const node = graph.nodes.get(premKey)!
      const label = node.claim || node.relativePath
      const suffix = node.isAxiom ? ' [axiom]' : ''
      const ref = seen.has(premKey) ? ' (ref)' : ''
      seen.add(premKey)

      const connector = i === 0 ? '┌─' : '├─'
      lines.push({
        text: `${connector} * ${label}${suffix}${ref}`,
        nodeKey: premKey,
      })
    })

    lines.push({ text: '│' })

    const cNode = graph.nodes.get(arg.conclusion)!
    const cLabel = cNode.claim || cNode.relativePath
    lines.push({
      text: `└─ > ${cLabel} [conclusion]`,
      nodeKey: arg.conclusion,
    })
  })

  return lines
}

/**
 * Returns tree-formatted lines with nodeKey annotations for selectable lines.
 */
export function formatTreeStructured(graph: ArgumentGraph): StructuredLine[] {
  if (graph.nodes.size === 0) return []

  const roots = findRoots(graph)
  if (roots.length === 0) return []

  const lines: StructuredLine[] = []
  const globalVisited = new Set<string>()

  function walk(
    nodeKey: string,
    prefix: string,
    isLast: boolean,
    isRoot: boolean,
  ): void {
    const node = graph.nodes.get(nodeKey)!
    const label = node.claim || node.relativePath

    const connector = isRoot ? '' : isLast ? '└─ ' : '├─ '
    const ref = globalVisited.has(nodeKey) ? ' (ref)' : ''
    const suffix = node.isAxiom ? ' [axiom]' : ''
    globalVisited.add(nodeKey)

    lines.push({
      text: `${prefix}${connector}${label}${suffix}${ref}`,
      nodeKey,
    })

    if (ref) return

    const children = getChildren(graph, nodeKey)
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')
    children.forEach((child, i) => {
      walk(child, childPrefix, i === children.length - 1, false)
    })
  }

  roots.forEach((root, rootIdx) => {
    if (rootIdx > 0) lines.push({ text: '' })
    walk(root, '', true, true)
  })

  return lines
}

/**
 * Format a node's detail view: claim, type, premises, and body.
 */
export function formatNodeDetail(node: PrimeNode): string[] {
  const lines: string[] = []

  lines.push(`Claim:  ${node.claim ?? '(none)'}`)

  if (node.isAxiom) {
    lines.push('Type:   axiom (no premises)')
  } else {
    lines.push(`Type:   derived (${node.premises.length} premise${node.premises.length === 1 ? '' : 's'})`)
  }

  lines.push(`File:   ${node.relativePath}`)

  if (!node.isAxiom && node.premises.length > 0) {
    lines.push('')
    lines.push('Premises:')
    for (let i = 0; i < node.premises.length; i++) {
      lines.push(`  ${i + 1}. ${node.premises[i].raw}`)
    }
  }

  // Read body from file if it exists on disk
  try {
    const content = fs.readFileSync(node.filePath, 'utf-8')
    const { content: body } = matter(content)
    const bodyWithoutH1 = body.replace(/^#\s+.+\n?/, '').trim()
    if (bodyWithoutH1) {
      lines.push('──────────────────────────────────────')
      lines.push(...bodyWithoutH1.split('\n'))
    }
  } catch {
    // File might be a remote node or inaccessible — skip body
  }

  return lines
}

/**
 * Count arguments (non-axiom nodes with premises) in the graph.
 */
export function countArguments(graph: ArgumentGraph): number {
  let count = 0
  for (const [key, node] of graph.nodes) {
    if (!node.isAxiom) {
      const premises = getChildren(graph, key)
      if (premises.length > 0) count++
    }
  }
  return count
}
