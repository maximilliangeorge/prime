# Prime

CLI tool that makes philosophical/scientific argument structures explicit and machine-readable. Arguments are encoded as markdown files in Git repositories, forming a directed acyclic graph (DAG) of claims and premises.

## Core Concept

**One node, one file.** Each `.md` file makes a single claim (H1 heading), optionally supported by premises declared in YAML frontmatter. Cross-repo references use `prime://` URIs. Git provides versioning, integrity, and distribution.

## Commands

```
npm run dev -- <command>     # Run from source
npm run build && npm start   # Run compiled
npm test                     # Vitest
```

- `prime init [dir]` — Scaffold a new prime repo
- `prime validate [dir]` — Check graph validity (cycles, broken refs, missing claims)
- `prime graph [dir] -f <list|tree|dot|json>` — Display argument graph
- `prime show <ref>` — Display a single node (local path or prime:// URI)

## Architecture

```
src/
  cli.ts              # Commander entry point
  types.ts            # PrimeNode, PrimeUri, ArgumentGraph
  parse.ts            # Extract H1 claim + YAML frontmatter from .md
  discover.ts         # Recursive .md file finder (ignores README.md, _-prefixed)
  uri.ts              # prime:// URI parsing & alias expansion
  cache.ts            # Git bare clone cache at ~/.prime/cache/
  resolve.ts          # Recursive remote premise resolution
  graph-builder.ts    # DAG construction, cycle detection, validation
  format.ts           # Output formatters (list, tree, dot, json)
  manifest.ts         # prime.yaml parser (remotes, exports)
  commands/            # Command implementations (init, validate, graph, show)
```

## Node File Format

Axiom (no premises):
```markdown
# Claim text
Body...
```

Derived (with premises):
```markdown
---
premises:
  - ./other-claim.md
  - prime://github.com/owner/repo/main/file.md
---
# Conclusion
Body...
```

## Prime URI Scheme

- Mutable: `prime://github.com/owner/repo/main/path.md`
- Immutable: `prime://github.com/owner/repo@commitsha/path.md`
- Alias: `prime://@alias/path.md` (expanded via prime.yaml remotes)

## Key Patterns

- ESM (`"type": "module"`) with TypeScript strict mode, target ES2022
- Tests in `test/` with fixtures in `test/fixtures/` (valid-tree, cycle, broken-ref, etc.)
- `simple-git` for all git operations (clone, fetch, show)
- `gray-matter` for frontmatter parsing, `commander` for CLI
- Graph validation: cycle detection, broken reference checks, missing claim warnings
