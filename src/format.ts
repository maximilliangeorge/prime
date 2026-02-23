import chalk from 'chalk'
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
  args.sort((a, b) => (orderMap.get(a.conclusion) ?? 0) - (orderMap.get(b.conclusion) ?? 0))

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

export function formatTree(graph: ArgumentGraph): string {
  if (graph.nodes.size === 0) return ''

  // Roots = nodes with no incoming edges (final conclusions)
  const roots = findRoots(graph)

  if (roots.length === 0) return ''

  const lines: string[] = []
  const globalVisited = new Set<string>()

  function walk(nodeKey: string, prefix: string, isLast: boolean, isRoot: boolean): void {
    const node = graph.nodes.get(nodeKey)!
    const label = node.claim || node.relativePath

    const connector = isRoot ? '' : isLast ? '└─ ' : '├─ '
    const ref = globalVisited.has(nodeKey) ? ' (ref)' : ''
    const suffix = node.isAxiom ? ' [axiom]' : ''
    globalVisited.add(nodeKey)

    lines.push(`${prefix}${connector}${label}${suffix}${ref}`)

    if (ref) return // already expanded

    const children = getChildren(graph, nodeKey)
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ')
    children.forEach((child, i) => {
      walk(child, childPrefix, i === children.length - 1, false)
    })
  }

  roots.forEach((root, rootIdx) => {
    if (rootIdx > 0) lines.push('')
    walk(root, '', true, true)
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
