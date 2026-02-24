# Network Spec

How Prime repos discover, reference, and curate each other across the network.

## Manifest Fields

`prime.yaml` gains identity and discovery fields:

```yaml
# Identity
title: "Meditations on First Philosophy"
description: "A reconstruction of Descartes' six meditations"
author: "René Descartes"
license: CC-BY-4.0
tags: [epistemology, rationalism, foundationalism]

# Discovery
peers:
  - github.com/leibniz/monadology
  - github.com/spinoza/ethics

# Existing fields
remotes:
  gettier: github.com/gettier/original-paper@abc123
exports:
  - cogito.md
  - existence-of-god.md
```

### Identity

- `title` — human-readable name for the repo
- `description` — short summary of the argument(s) contained
- `author` — person or organisation
- `license` — license for the content
- `tags` — lightweight topic taxonomy for search/filtering

### Discovery

- `peers` — repos this author vouches for as related or relevant. Distinct from `remotes` (which are premise dependencies). Peers are recommendations; remotes are logical requirements.

### Visibility

- `exports` — only exported nodes are visible to external consumers. A repo that exports nothing is effectively private: still usable via direct reference, but invisible to crawlers.

## Trust Model

Trust operates at two levels:

### Repo-level (public)

Defined in `prime.yaml`. The `peers` field is a public recommendation: "the author of this repo vouches for these other repos." It's versioned and travels with the repo. It provides the edges that crawlers follow.

### Client-level (private)

Defined in `~/.prime/config.yaml`. The user's trust roots — the starting points for discovery:

```yaml
trust:
  - github.com/descartes/meditations
  - github.com/stanford-phil/*
```

### How they compose

Client trust roots are the seeds. Repo-level peers are the edges traversed from there. A repo is only visible if it's reachable from the user's trust roots within their configured depth. A repo with no inbound links from the trust graph simply doesn't exist to that user.

There is no global "trusted" vs "untrusted" — trust is always relative to the viewer.

## Discovery

`prime discover <repo> [--depth N]` — starting from a repo, recursively fetch manifests from `remotes` and `peers`, building a catalog of known repos with their metadata.

Depth controls how far from trust roots the user is willing to go. A repo 4 hops away is visible at `--depth 5` but not `--depth 3`.

## Collection Nodes

A node can serve as a curated index using `refs` instead of `premises`:

```markdown
---
refs:
  - prime://github.com/descartes/meditations/main/cogito.md
  - prime://github.com/hume/treatise/main/induction.md
tags: [epistemology, foundationalism]
---
# Key arguments in epistemology
A curated list of...
```

### Node types by frontmatter

| Frontmatter | Role | In argument DAG? |
|---|---|---|
| `premises` | Argument node — logical dependency | Yes |
| `disputes` + `premises` | Refutation node — counter-argument | Yes (premises only) |
| `refs` | Collection node — curation/linking | No |
| neither | Axiom — leaf node | Yes |

- `premises` = "this claim is supported by these"
- `disputes` = "this claim argues against that claim"
- `refs` = "this collection points to these"

Collection nodes are excluded from argument validation (cycle detection, broken ref checks) but participate in discovery crawling.

## Disputes

A node can declare that it disputes a claim in another repository using the `disputes` frontmatter field:

```markdown
---
disputes: prime://github.com/descartes/meditations/main/cogito.md
premises:
  - ./dreaming-argument.md
  - ./bundle-theory.md
---
# The cogito does not establish a persistent self
```

The `disputes` field takes a single prime URI. It is metadata — not a logical edge in the argument DAG. The node's `premises` carry the argumentative weight and participate in validation as normal.

Discoverability of disputes is left to social mechanisms: the disputing party can contact the original author using identity fields in `prime.yaml` (author, etc.), and the two parties can link their repos via `peers` if they choose to.
