# Dialectic: Red/Blue Team Argument Drilling

This example demonstrates using Prime's `counters` field to model adversarial argument structures — a dialectic between a **Red Team** (attacking) and a **Blue Team** (defending).

## The `counters` field

Any node can declare that it **counters** another node using the `counters` frontmatter field:

```yaml
---
counters:
  - ../seed.md
---
# This claim challenges the seed
```

A counter-argument is itself a claim. It can have its own premises (supporting evidence) and can itself be countered. This creates a graph with two edge types:

- **Premise edges** (solid): "this claim is supported by..."
- **Counter edges** (dashed red in DOT output): "this claim challenges..."

A node can have both — it counters one claim while being supported by premises of its own.

## Structure of this example

```
seed.md                          Round 0: "LLMs understand language"
  ↑ countered by
red/chinese-room.md              Round 1: Red Team attacks
red/stochastic-parrot.md
  ↑ countered by
blue/behavioral.md               Round 2: Blue Team defends (with premises)
blue/emergence.md
  ↑ countered by
red/benchmark-gaming.md          Round 3: Red Team deepens
red/correlation.md
```

## Visualize

```bash
# Tree view with counter annotations
prime graph . -f tree

# DOT graph (red dashed lines = counter edges)
prime graph . -f dot | dot -Tsvg -o dialectic.svg

# Machine-readable
prime graph . -f json
```

## Automating with Claude agents

The dialectic pattern maps naturally to an agentic loop. Each round:

1. **Read the current graph**: `prime graph . -f json`
2. **Red Team prompt**: "Given this argument graph, identify the weakest claims and write counter-arguments as new `.md` files with `counters:` frontmatter."
3. **Validate**: `prime validate .`
4. **Blue Team prompt**: "Given this argument graph, defend the countered claims by writing responses — either new counter-arguments or new premises that undermine the objection."
5. **Validate**: `prime validate .`
6. **Repeat** for N rounds or until convergence.

### Example Red Team prompt

```
You are a critical philosopher. Read this argument graph (JSON below) and
identify the most vulnerable claim. Write a new .md file that counters it.

The file must have:
- A `counters:` field in YAML frontmatter pointing to the target
- Optionally `premises:` if you need supporting evidence
- An H1 heading stating your counter-claim
- A body explaining your reasoning

Output the file contents and the filename (place it in red/).
```

### Example Blue Team prompt

```
You are a defense advocate. Read this argument graph and the latest
Red Team objections. For each objection, choose one strategy:

1. **Counter-counter**: Write a new .md file that counters the objection
2. **Undermine**: Add new premise nodes that weaken the objection's
   foundations, then write a counter that uses those premises

Output each file's contents and filename (place them in blue/).
```

The graph grows richer with each round, making the dialectic structure explicit and machine-readable.
