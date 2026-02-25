# Prime

(THIS IS STILL A DRAFT)

A machine-readable graph of truth claims, built on Git and Markdown.

## What is Prime?

What makes a good argument? A _good_ argument is true.

A _valid_ argument is one where its conclusion follows from its premises. Validity is purely structural — it has nothing to do with truth.

If a premise is false, the argument is not _invalid_ but it is _unsound_. The structure still holds; the foundation does not.

What makes a premise false? It, in turn, relies on an either _invalid_ argument or _unsound_ premises (or both!). Every claim rests on other claims and the rot can enter at any level. In the world of code might call this a dependency graph. A graph can be traversed, and indexed by machine. Follow the chain down and you hit bedrock: unsupported claims, ie. axiomatic truths that can be accepted without argument.

In Prime, we store each claim as a Markdown file in a Git repository. Git already solves the hard problems: versioning, integrity, distribution, attribution. Repositories can reference each other — so an argument in one repo can cite a premise in another, across authors, institutions, and time. The graph is not trapped in one database or one jurisdiction. It lives where code lives, and it moves the way code moves. And I hope Prime can make reason scale the way code scales.

TL;DR: What is Prime? At the end of the day, Prime is just a convention for writing arguments in Markdown, stored in Git repositories + a set of tools that makes it possible to do so at scale. Thank you for coming to my TED talk.

## Usage

No installation required. Run with `npx`:

```sh
npx prime init my-argument
```

Or install globally:

```sh
npm install -g prime
```

## Quick Start

```sh
# Scaffold a new prime repository
npx prime init my-argument
cd my-argument

# Edit the sample axiom or add new .md files
# Then validate the graph
npx prime validate

# View the argument structure
npx prime graph -f tree
```

## Commands

### `prime init [dir]`

Create a new prime repository. Initializes a Git repo, writes a sample axiom (`first-principles.md`), and creates a `prime.yaml` manifest.

### `prime validate [dir]`

Check the argument graph for structural errors: cycles, broken references, missing claims. Exits with code 1 if invalid.

### `prime graph [dir]`

Display the argument graph. Supports multiple output formats:

- `-f list` — flat list of nodes (default)
- `-f tree` — indented tree with `--depth` option
- `-f dot` — Graphviz DOT format
- `-f json` — machine-readable JSON

### `prime show <ref>`

Display a single node. Accepts a local file path or a `prime://` URI. Shows the claim, its type (axiom or derived), premises, and body text.

## Node File Format

An axiom has no frontmatter. It is a bare Markdown file with a single H1 heading:

```markdown
# First principles are self-evident

A first principle is a foundational proposition that cannot be
deduced from any other proposition.
```

A derived claim declares its premises in YAML frontmatter:

```markdown
---
premises:
  - ./first-principles.md
  - ./another-claim.md
---

# Therefore, something follows

Body text explaining the derivation.
```

Premises can be local paths or remote URIs. Each file makes exactly one claim.

## Prime URI Scheme

Remote premises are referenced via `prime://` URIs:

```
prime://github.com/owner/repo/main/path/to/claim.md
```

Pin to a specific commit for immutability:

```
prime://github.com/owner/repo@abc123/path/to/claim.md
```

Define aliases in `prime.yaml` to avoid repeating full URIs:

```yaml
remotes:
  logic: github.com/owner/foundations
```

Then reference as:

```
prime://@logic/axioms/identity.md
```

## License
