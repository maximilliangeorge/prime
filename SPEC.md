# Prime Specification v0.1

## Rationale

Philosophical and scientific arguments are hierarchical structures of premises and inference, culminating in conclusions. Today, these structures are buried in prose — implicit, unlinked, and impossible to trace mechanically. prime makes argument structure explicit and machine-readable while keeping authoring natural.

Git is the foundation because it already solves the hard problems: content-addressed storage, distributed replication, versioning, cryptographic integrity, and collaboration. A philosopher working on an argument needs exactly these properties. By encoding arguments as markdown files in Git repositories, we inherit the entire Git ecosystem — branching for exploration, commits for revision history, signed commits for attribution, and remotes for decentralized distribution.

The core principle is **one node, one file**. Each file makes a single claim, optionally supported by premises that reference other files. Cross-repository references use a URI scheme that maps directly onto Git's addressing model. The result is a directed acyclic graph of arguments that can span repositories, organizations, and disciplines — with every conclusion traceable to its foundational assumptions.

## Core Concepts

A **node** is a markdown file that makes a single claim. The claim is the file's H1 heading.

A **premise** is a reference from one node to another, declaring a logical dependency: "my claim depends on this other claim being true." Premises are declared in YAML frontmatter and point to other node files via relative paths or prime URIs.

An **axiom** is a node with no premises — a claim accepted without further justification. Axioms are leaf nodes in the graph. They may represent empirical observations, definitions, logical laws, or simply assumptions the author chooses not to defend further. A node is an axiom if and only if it has no `premises` field (or the field is empty).

A **dispute** is a node that argues against a claim made in another node. The disputed claim is declared via a `disputes` field in YAML frontmatter, pointing to the target node via a prime URI. A dispute node typically also has `premises` supporting its counter-argument. The `disputes` link is metadata — it is not a logical edge in the argument DAG. A dispute says "my claim contradicts that claim"; the premises say why.

The **argument graph** is the directed acyclic graph formed by premise relationships across all nodes. Edges point from a node to its premises ("depends on"). Cycles are invalid — they constitute circular reasoning.

## Node Format

A node is a markdown file (`.md`) with optional YAML frontmatter. The recognized frontmatter fields are `premises` and `disputes`.

### Minimal node (axiom)

```markdown
# Thinking is self-evident to the thinker

The act of thinking cannot be doubted by the entity performing it,
because doubt itself is a form of thought.
```

No frontmatter required. This file is a leaf node — an axiom.

### Node with premises

```markdown
---
premises:
  - ./thinking-is-self-evident.md
  - ./doubt-presupposes-a-doubter.md
---

# A thinking entity must exist

If thinking is occurring, and thinking requires a thinker,
then a thinking entity must exist.

From [the self-evidence of thought](./thinking-is-self-evident.md) and
the fact that [doubt presupposes a doubter](./doubt-presupposes-a-doubter.md),
it follows that the doubting entity must exist.
```

### Node disputing an external claim

```markdown
---
disputes: prime://github.com/descartes/meditations/main/cogito.md
premises:
  - ./dreaming-argument.md
  - ./bundle-theory.md
---

# The cogito does not establish a persistent self

The cogito proves only that thinking is occurring, not that a
unified, persistent self exists. From [the dreaming argument](./dreaming-argument.md)
and [bundle theory](./bundle-theory.md), we can see that...
```

The `disputes` field is a single prime URI pointing to the claim being refuted. The node's own `premises` support its counter-argument. The `disputes` link is not a logical dependency — it identifies the target of disagreement.

### Rules

1. The **claim** is the first H1 heading (`# ...`) in the file.
2. The **premises** field is a YAML list of references to other node files. Each entry is either a relative file path or a prime URI.
3. The **body** is free-form markdown. Authors argue in natural language. The body may contain links to premises (for readability) but the frontmatter is the authoritative declaration of logical dependencies.
4. A file with no frontmatter, or with an empty/absent `premises` field, is an axiom.
5. The **disputes** field is a single prime URI identifying a claim this node argues against. The `disputes` link is metadata, not a logical edge in the argument DAG. A node may have `disputes` with or without `premises`.
6. Each file should make exactly one claim. This is a convention, not a parse error.

## URI Scheme

The `prime://` URI scheme addresses nodes across repository boundaries.

### Syntax

```
prime://<host>/<owner>/<repo>/<ref>/<path>
prime://<host>/<owner>/<repo>@<commit>/<path>
prime://@<alias>/<path>
```

**Components:**

| Component | Description |
|-----------|-------------|
| `host` | Git host (e.g., `github.com`, `git.example.org`) |
| `owner` | Repository owner or organization |
| `repo` | Repository name |
| `ref` | Branch or tag name (mutable reference) |
| `commit` | Full or abbreviated commit SHA (immutable reference) |
| `@alias` | Shorthand for a remote declared in `prime.yaml` |
| `path` | Path to the node file relative to the repository root |

### Examples

```
# Mutable — tracks a branch, resolves to latest commit
prime://github.com/descartes/meditations/main/cogito.md

# Immutable — pinned to a specific commit
prime://github.com/descartes/meditations@a1b2c3d/cogito.md

# Alias — resolved via prime.yaml remotes
prime://@descartes/cogito.md
```

### Semantics

**Mutable references** (branch/tag) resolve to the latest commit on that ref at fetch time. They are convenient but non-deterministic — the referenced content may change.

**Immutable references** (commit SHA) resolve to a fixed snapshot. They are deterministic and verifiable. Tooling can verify that the fetched content matches the expected hash.

**Aliases** are expanded by looking up the alias name in the `remotes` section of the local repository's `prime.yaml`. An alias maps to a `host/owner/repo` triple and optionally a default ref or pinned commit.

### Resolution

1. Parse the URI into its components.
2. If the URI uses an `@alias`, expand it using the local `prime.yaml`.
3. Check the local cache (`~/.prime/cache/<host>/<owner>/<repo>/`) for the target repository.
4. If not cached, perform a shallow clone of the target repository.
5. If cached and the reference is mutable, fetch updates.
6. If cached and the reference is immutable, serve from cache without fetching.
7. Resolve the `path` within the repository at the specified ref/commit.

## Node Discovery

A `.md` file in the repository is a **node** unless it is ignored. The following files are ignored:

1. `README.md` (at any depth)
2. Files whose name starts with `_` (e.g., `_notes.md`, `_scratch.md`)

Ignored files are invisible to the argument graph — they are not nodes, not axioms, and cannot be referenced as premises. Node identity is intrinsic — derivable from the filename alone, with no dependency on external configuration.

## Parsing the Graph

To construct the argument graph from a set of prime repositories:

1. **Discover nodes.** Recursively find all `.md` files in the repository. Exclude ignored files (see Node Discovery).
2. **Parse frontmatter.** For each node, extract the `premises` list from YAML frontmatter. Nodes without frontmatter or without a `premises` field are axioms.
3. **Resolve references.** For each premise entry, resolve it to a concrete file — either a local path (relative to the referencing file) or a remote node via prime URI.
4. **Build the graph.** Create a directed edge from each node to each of its premises. The resulting graph must be a DAG.
5. **Validate.** Check for cycles (circular reasoning). Check that all premise references resolve to existing files.

### Frontmatter grammar

```
frontmatter  := "---\n" yaml_body "---\n"
yaml_body    := [disputes_decl] [premise_decl]
disputes_decl := "disputes: " prime_uri "\n"
premise_decl := "premises:\n" premise_list
premise_list := ("  - " reference "\n")*
reference    := relative_path | prime_uri
```

The frontmatter parser should ignore any unrecognized fields. This allows future extension without breaking existing documents.

## Manifest (`prime.yaml`)

Each repository's root may contain a `prime.yaml` file declaring remote aliases and exported claims. The manifest is optional for single-repository argument trees, but is necessary for cross-repository references using aliases.

```yaml
remotes:
  descartes: github.com/descartes/meditations
  gettier: github.com/gettier/original-paper

exports:
  - cogito.md
  - existence-of-god.md
```

### Fields

**`remotes`** — maps alias names to `host/owner/repo` triples. Used to expand `prime://@alias/` URIs.

**`exports`** — lists node files that are available for external reference. Unlisted files are considered internal to the repository. Tooling should warn when an external URI references a non-exported file.
