# Prime (Draft)

A machine-readable graph of truth claims, built on Git and Markdown.

## What is Prime?

What makes a good argument? A _good_ argument is true.

A _valid_ argument is one where the truth of the premises logically guarantees the truth of the conclusion. Validity is purely structural — it has nothing to do with truth.

If a premise is false, the argument is not _invalid_ but it is _unsound_. The structure still holds; the foundation does not.

What makes a premise false? It, in turn, relies on an either _invalid_ argument or _unsound_ premises (or both!). Every claim rests on other claims and the rot can enter at any level. In the world of code we might call this a dependency graph. A graph can be traversed, and indexed by machine. Follow the chain down and you hit bedrock: unsupported claims, e.g. axiomatic truths that can be accepted without argument.

In Prime, we store each claim as a Markdown file in a Git repository. Git already solves the hard problems: versioning, integrity, distribution, attribution. Repositories can reference each other — so an argument in one repo can cite a premise in another, across authors, institutions, and time. The graph is not trapped in one database. It lives where code lives, and it moves the way code moves. And I hope Prime can make reasoning scale the way code scales.

So, what is Prime? At the end of the day, Prime is just a convention for writing arguments in Markdown, stored in Git repositories, and a set of tools that makes it possible to do so collaboratively at scale. Still with me? Keep reading.

## Usage

No installation required – run with `npx`:

```sh
npx prime-md browse https://github.com/maximilliangeorge/prime-demo-cogito
```

```
> The external world exists
  ├─ Clear and distinct perceptions are reliably true
  │  ├─ Clear and distinct perception can serve as a criterion of truth
  │  │  ├─ I exist as a thinking thing
  │  │  │  ├─ Doubt is itself a form of thought [axiom]
  │  │  │  ├─ Thinking is occurring [axiom]
  │  │  │  └─ Thinking requires a thinker [axiom]
  │  │  └─ Clear and distinct perceptions are irresistible [axiom]
  │  └─ God is no deceiver
  │     ├─ God exists
  │     │  ├─ Clear and distinct perception can serve as a criterion of truth (ref)
  │     │  └─ The idea of a perfect being requires a cause with infinite reality
  │     │     ├─ A cause must contain at least as much reality as its effect [axiom]
  │     │     └─ I possess an idea of a supremely perfect being [axiom]
  │     └─ Supreme perfection is incompatible with deception [axiom]
  └─ I clearly and distinctly perceive an external world [axiom]
```

You can also install Prime globally with `npm install -g prime-md`.

## Claims

Every `.md` file in a prime repository represents a claim and a node in the graph. One file, one claim. The H1 heading is the claim itself — the thing being asserted. The body is optional; use it for elaboration, evidence, or context. Prime does not parse or validate the body. It only cares about structure. But whoever is reading your claim will probably want you to elaborate on it.

There are two kinds of claims: axioms and derived claims.

### Axioms

An axiom is a claim with no premises. It stands on its own — accepted without argument. In practice, these are your starting points: definitions, observations, or assumptions you choose not to defend further.

An axiom is just a bare Markdown file:

```markdown
# First principles are self-evident

A first principle is a foundational proposition that cannot be
deduced from any other proposition.
```

No frontmatter. Nothing to resolve. Prime treats any file without a `premises` field as an axiom.

### Derived claims

A derived claim is a conclusion that depends on other claims. Its premises are declared in YAML frontmatter as a list of references — local file paths or remote URIs:

```markdown
---
premises:
  - ./first-principles.md
  - ./another-claim.md
---

# Therefore, something follows

Body text explaining the derivation.
```

The order of premises does not matter. What matters is that every reference resolves to an existing node. If it doesn't, `prime validate` will report a broken reference. Prime will also yell at you for creating circular logic, e.g. premises that reference themselves directly or indirectly.

It is possible to reference claims in other Git repositories. We currently support Github but are exploring other platforms and even our own URI structure.

```markdown
---
premises:
  - https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/thinker.md
  - https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/thinking.md
  - https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/doubt-is-thought.md
---

# I exist as a thinking thing

If thinking is occurring, and thinking requires a thinker, then a thinker exists.
Could a deceiver make me wrong about this? No — doubt is itself thought, so the act of being deceived confirms that I,
the one being deceived, am thinking and therefore exist. _Cogito, ergo sum._
```

You can tidy this up by defining aliases in `prime.yaml`

```markdown
---
premises:
  - @descartes/cogito/thinker.md
  - @descartes/cogito/thinking.md
  - @descartes/cogito/doubt-is-thought.md
---

# I exist as a thinking thing

If thinking is occurring, and thinking requires a thinker, then a thinker exists.
Could a deceiver make me wrong about this? No — doubt is itself thought, so the act of being deceived confirms that I,
the one being deceived, am thinking and therefore exist. _Cogito, ergo sum._
```

### Graph Traversal

- Files prefixed with `_` are ignored (e.g. `_CONTRIBUTORS.md`)
- `README.md` is always ignored
- All other `.md` files are discovered recursively.
- Links to remote repositories are loaded on the fly so that you can explore the entire chain of reasoning.

## Commands

### `npx prime-md init [dir]`

Create a new prime repository. Initializes a Git repo, writes a sample axiom (`first-principles.md`), and creates a `prime.yaml` manifest.

### `npx prime-md browse [dir | url]`

Interactively browse the argument graph. Read an argument with Enter. Switch between modes with Tab.

### `npx prime-md validate [dir | url]`

Check the argument graph for structural errors: cycles, broken references, missing claims. Exits with code 1 if invalid.

### `npx prime-md graph [dir | url]`

Display the argument graph. Supports multiple output formats:

- `-f list` — flat list of nodes (default)
- `-f tree` — indented tree with `--depth` option
- `-f dot` — Graphviz DOT format
- `-f json` — machine-readable JSON

### `npx prime-md show <ref>`

Display a single node. Accepts a local file path or a `prime://` URI. Shows the claim, its type (axiom or derived), premises, and body text.

### `npx prime-md pluck <ref>`

Extract a claim and its full premise structure as a self-contained markdown document. Each premise is expanded inline with its type, body, and sub-premises, using hierarchical numbering (`1:`, `1.1:`, `1.1.1:`, etc.). Use `--depth` to limit how deep premises are expanded.

Designed for handing off a partial view of an argument to an LLM for evaluation.

## Contributing

[CODE BUT ALSO USING THE TOOL AND BUILDING THE GRAPH; CALL TO PHILOSOPHERS AND SCIENTISTS]

## License
