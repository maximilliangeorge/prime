# Prime

A machine-readable graph of truth claims, built on Git and Markdown.

## What is Prime?

What makes a good argument? A _good_ argument is true.

A _valid_ argument is one where the truth of the premises logically guarantees the truth of the conclusion. Validity is purely structural — it has nothing to do with truth.

If a premise is false, the argument is not _invalid_ but it is _unsound_. The structure still holds; the foundation does not.

What makes a premise false? It, in turn, relies on an argument that is either _invalid_ or _unsound_ (_unsound_, as in one that relies on premises that are themselves false). Notice the recusion – every claim rests on other claims and the rot can enter at any level. In the world of code we might call this a dependency graph. A graph can be traversed, and indexed by machine. Follow the chain down and you hit bedrock: unsupported claims, e.g. axiomatic truths that can be accepted without argument.

In Prime, we store each claim as a Markdown file in a Git repository. Git already solves the hard problems: versioning, integrity, distribution, attribution. Repositories can reference each other — so an argument in one repo can cite a premise in another, across authors, institutions, and time. The graph is not trapped in one database. It lives where code lives, and it moves the way code moves. And I hope Prime can make deductive reasoning scale the way code scales.

So, what is Prime? At the end of the day, Prime is just a convention for writing arguments in Markdown, stored in Git repositories, and a set of tools that makes it possible to do so collaboratively at scale with LLMs.

Further reading:

- [Deductive Reasoning](https://en.wikipedia.org/wiki/Deductive_reasoning)
- [Validity and Soundness](https://iep.utm.edu/val-snd/)

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

There are two kinds of claims: axiomatic claims and derived claims.

### Axiomatic Claims

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
- Directories starting with `.` are ignored (e.g. `.claude`, `.git`)
- Paths matched by `.gitignore` files are ignored (at any directory level)
- All other `.md` files are discovered recursively.
- Links to remote repositories are loaded on the fly so that you can explore the entire chain of reasoning.

## Commands

### `npx prime-md init [dir]`

Create a new prime repository. Initializes a Git repo, writes a sample axiom (`first-principles.md`), and creates a `prime.yaml` manifest.

<details>
<summary>Example</summary>

```bash
npx prime-md init
```

```
Initialized git repository.
Created first-principles.md
Created prime.yaml

prime repository initialized.
```

</details>

### `npx prime-md browse [dir | url]`

Interactively browse the argument graph. Read an argument with Enter. Switch between modes with Tab.

<details>
<summary>Example</summary>

```bash
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

</details>

### `npx prime-md pluck <ref>`

Extract a claim and its full premise structure as self-contained markdown. Each premise is expanded inline with its type, body, and sub-premises, using hierarchical numbering (`1:`, `1.1:`, `1.1.1:`, etc.). Use `--depth` to limit how deep premises are expanded.

Useful for looping through partial views of an argument with an LLM.

<details>
<summary>Example</summary>

```bash
npx prime-md pluck https://github.com/maximilliangeorge/prime-md/blob/main/examples/cogito-remote/external-world.md --depth 1
```

```
# The external world exists

**Type:** derived

[Clear and distinct perceptions are reliably true](./reliable-truth.md), and
[I clearly and distinctly perceive an external world](./perception-of-world.md) —
a world of extended, figured, moving bodies that is the source of my sensory
experience. Since my faculty of clear perception is guaranteed by a
non-deceiving God, the external world as I perceive it must genuinely exist.

## Premise 1: Clear and distinct perceptions are reliably true

**Type:** derived

The [criterion of truth](./criterion-of-truth.md) — clear and distinct
perception — was initially only provisional: perhaps a deceiver could make
even irresistible perceptions false. But now we know that
[God is no deceiver](./god-is-no-deceiver.md). A non-deceiving God would not
endow me with a faculty that systematically misleads. Therefore, what I
clearly and distinctly perceive is not merely irresistible but genuinely true.

*2 premises not expanded (depth limit reached)*

## Premise 2: I clearly and distinctly perceive an external world

**Type:** axiom

I have vivid, involuntary sensory experiences — of extension, figure, motion,
and resistance — that present themselves as originating outside my mind. These
perceptions are clear (fully present to attention) and distinct (not confused
with any other idea). I perceive with maximal clarity that corporeal objects
exist as the source of these experiences.
```

</details>

### `npx prime-md graph [dir | url]`

Display the argument graph. Supports multiple output formats:

- `-f list` — flat list of nodes (default)
- `-f tree` — indented tree with `--depth` option
- `-f dot` — Graphviz DOT format
- `-f json` — machine-readable JSON

<details>
<summary>Example</summary>

```bash
npx prime-md graph https://github.com/maximilliangeorge/prime-demo-cogito -f json
```

```json
{
  "nodes": {
    "external-world.md": {
      "claim": "The external world exists",
      "isAxiom": false,
      "premises": [
        "https://github.com/maximilliangeorge/prime-demo-cogito/blob/master/reliable-truth.md",
        "https://github.com/maximilliangeorge/prime-demo-cogito/blob/master/perception-of-world.md"
      ]
    },
    "clarity.md": {
      "claim": "Clear and distinct perceptions are irresistible",
      "isAxiom": true,
      "premises": []
    },
    "thinking.md": {
      "claim": "Thinking is occurring",
      "isAxiom": true,
      "premises": []
    },
    "thinker.md": {
      "claim": "Thinking requires a thinker",
      "isAxiom": true,
      "premises": []
    },
    "doubt-is-thought.md": {
      "claim": "Doubt is itself a form of thought",
      "isAxiom": true,
      "premises": []
    },
    "cogito.md": {
      "claim": "I exist as a thinking thing",
      "isAxiom": false,
      "premises": ["./thinking.md", "./thinker.md", "./doubt-is-thought.md"]
    },
    "criterion-of-truth.md": {
      "claim": "Clear and distinct perception can serve as a criterion of truth",
      "isAxiom": false,
      "premises": ["./clarity.md", "./cogito.md"]
    },
    "perfection-entails-truthfulness.md": {
      "claim": "Supreme perfection is incompatible with deception",
      "isAxiom": true,
      "premises": []
    },
    "idea-of-perfection.md": {
      "claim": "I possess an idea of a supremely perfect being",
      "isAxiom": true,
      "premises": []
    },
    "causal-adequacy.md": {
      "claim": "A cause must contain at least as much reality as its effect",
      "isAxiom": true,
      "premises": []
    },
    "causal-argument.md": {
      "claim": "The idea of a perfect being requires a cause with infinite reality",
      "isAxiom": false,
      "premises": ["./idea-of-perfection.md", "./causal-adequacy.md"]
    },
    "god-exists.md": {
      "claim": "God exists",
      "isAxiom": false,
      "premises": ["./criterion-of-truth.md", "./causal-argument.md"]
    },
    "god-is-no-deceiver.md": {
      "claim": "God is no deceiver",
      "isAxiom": false,
      "premises": ["./perfection-entails-truthfulness.md", "./god-exists.md"]
    },
    "reliable-truth.md": {
      "claim": "Clear and distinct perceptions are reliably true",
      "isAxiom": false,
      "premises": ["./criterion-of-truth.md", "./god-is-no-deceiver.md"]
    },
    "perception-of-world.md": {
      "claim": "I clearly and distinctly perceive an external world",
      "isAxiom": true,
      "premises": []
    }
  },
  "edges": [
    {
      "from": "external-world.md",
      "to": "reliable-truth.md"
    },
    {
      "from": "external-world.md",
      "to": "perception-of-world.md"
    },
    {
      "from": "cogito.md",
      "to": "thinking.md"
    },
    {
      "from": "cogito.md",
      "to": "thinker.md"
    },
    {
      "from": "cogito.md",
      "to": "doubt-is-thought.md"
    },
    {
      "from": "criterion-of-truth.md",
      "to": "clarity.md"
    },
    {
      "from": "criterion-of-truth.md",
      "to": "cogito.md"
    },
    {
      "from": "causal-argument.md",
      "to": "idea-of-perfection.md"
    },
    {
      "from": "causal-argument.md",
      "to": "causal-adequacy.md"
    },
    {
      "from": "god-exists.md",
      "to": "criterion-of-truth.md"
    },
    {
      "from": "god-exists.md",
      "to": "causal-argument.md"
    },
    {
      "from": "god-is-no-deceiver.md",
      "to": "perfection-entails-truthfulness.md"
    },
    {
      "from": "god-is-no-deceiver.md",
      "to": "god-exists.md"
    },
    {
      "from": "reliable-truth.md",
      "to": "criterion-of-truth.md"
    },
    {
      "from": "reliable-truth.md",
      "to": "god-is-no-deceiver.md"
    }
  ]
}
```

</details>

### `npx prime-md validate [dir | url]`

Check the argument graph for structural errors: cycles, broken references, missing claims. Exits with code 1 if invalid.

<details>
<summary>Example</summary>

```bash
npx prime-md validate https://github.com/maximilliangeorge/prime-demo-cogito
```

```
✔ Loaded from maximilliangeorge/prime-demo-cogito@master (14 remote nodes)
Valid. 15 nodes, 15 edges.
```

</details>

### `npx prime-md show <ref>`

Display a single node. Accepts a ref. Shows the claim, its type (axiom or derived), premises, and body text.

<details>
<summary>Example</summary>

```bash
npx prime-md show ./external-world.md
```

```
✔ Fetched remote node
Claim: The external world exists
Type: derived (2 premises)
Premises:
  1. https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/reliable-truth.md
  2. https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/perception-of-world.md
---
# The external world exists

[Clear and distinct perceptions are reliably true](./reliable-truth.md), and
[I clearly and distinctly perceive an external world](./perception-of-world.md) —
a world of extended, figured, moving bodies that is the source of my sensory
experience. Since my faculty of clear perception is guaranteed by a
non-deceiving God, the external world as I perceive it must genuinely exist.
```

</details>

## Examples

Check out the examples in the [examples](examples) directory.

- [Cogito ergo sum in a single directory](examples/cogito/README.md)
- [Cogito ergo sum with remote refs](examples/cogito-remote/README.md)
- [Experiment with automated LLM critique](examples/llm-critique/README.md)

## Contributing

Prime needs two kinds of contribution: better tooling and better arguments.

**Build the graph.** The tools are only as valuable as the ecosystem it powers. If you work in philosophy, science, law, theology, economics, or any field where conclusions depend on premises — write them down. Run `npx prime-md init`, break a claim into its premises, and commit. No code required.

**Improve the tools.** Bug reports, feature ideas, and pull requests are welcome. See the [open issues](https://github.com/maximilliangeorge/prime-md/issues).

## License

[MIT](LICENSE)
