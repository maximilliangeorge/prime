# What if arguments had unit tests?

Software engineers have spent decades building tools to answer one question: does this code do what it claims to do? We have type checkers, linters, test suites, dependency graphs, CI pipelines. We treat "it works on my machine" as a punchline, not a standard.

But when it comes to *arguments* — the thing we use to make decisions, form beliefs, set policy, and understand the world — we're still in the "it works on my machine" era. Arguments live in prose. They hide their dependencies. They assert conclusions without tracing them back to anything checkable. And when they break, nobody gets a failing test.

I think we can do better.

## Arguments are software

If you squint, an argument has the same structure as a program:

- **Axioms** are like constants or config values — things you accept as given without further justification.
- **Derived claims** are like functions — they take inputs (premises) and produce outputs (conclusions).
- **The premise chain** is a dependency graph — claim A depends on claims B and C, which depend on claims D, E, and F, all the way down to axioms.
- **Circular reasoning** is a circular dependency — and it's just as fatal.

And just like software, arguments fail in predictable ways. A premise references something that doesn't exist. A conclusion depends on an unstated assumption. Two people think they agree but are actually working from different axioms. The structure looks fine on the surface but collapses when you trace the chain.

These aren't exotic failure modes. They're the *default* state of most arguments in the wild.

## The problem with prose

Natural language is a terrible format for arguments, for the same reasons it's a terrible format for code: it's ambiguous, it hides structure, and it makes dependencies implicit.

Consider a simple policy argument: "We should invest in public transit because it reduces emissions, and reducing emissions is urgent because of climate change." That sounds fine. But what's actually going on?

There are at least three distinct claims here, two of which are derived and one of which is doing the heavy lifting as an unstated axiom (that urgency justifies public investment). In prose, all of this is invisible. You'd have to read carefully and reconstruct the logical structure in your head. Most people don't.

Now imagine that argument gets debated by ten people, forked into different versions, extended over months. In prose, you get a mess. In a structured format, you get a diff.

## What a test suite for arguments would look like

Here's what I think the minimum viable "argument linter" needs to do:

**1. Every claim is a node.** It has a human-readable statement and an explicit list of premises it depends on. No hidden assumptions.

**2. Every premise chain resolves.** If claim A says it depends on claim B, claim B has to exist. Broken references are caught automatically, just like a missing import.

**3. Circular logic is detected.** If A depends on B and B depends on A — directly or through any chain — that's flagged. No begging the question allowed.

**4. Axioms are explicit.** Some claims are foundational: you accept them without further justification. That's fine, but they have to be *labeled* as axioms. No sneaking in unexamined assumptions as if they were derived conclusions.

**5. The graph is inspectable.** You should be able to visualize the full dependency tree of any conclusion — see exactly what it rests on, all the way down.

That's it. Notice what's *not* on the list: evaluating whether any claim is *true*. That's not the tool's job. The tool's job is structural integrity — making sure the argument is internally consistent and fully traceable. Truth is your responsibility. Validity is the machine's.

## What this looks like in practice

I built this. It's called prime-md, and it works the way you'd expect if you've ever used a linter or a build tool.

Every claim is a Markdown file. The YAML frontmatter lists its premises — relative paths to other Markdown files, or URLs to files in other Git repos. The heading is the claim. The body is your reasoning.

```
---
premises:
  - ./thinking.md
  - ./thinker.md
  - ./doubt-is-thought.md
---
# I exist as a thinking thing

If thinking is occurring, and thinking requires a thinker,
then a thinker exists.
```

Run `prime validate` and it checks every reference, detects cycles, and tells you if your argument graph is structurally sound. Run `prime graph` and you see the full tree:

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
│     └─ Supreme perfection is incompatible with deception [axiom]
└─ I clearly and distinctly perceive an external world [axiom]
```

That's Descartes' *Meditations* — one of the most important philosophical arguments in Western history — rendered as a dependency graph. Every derived claim traces back to explicit axioms. Every connection is checkable.

You can agree or disagree with the axioms. You can challenge whether the derivations follow. But you can't hide the structure.

## Why Git?

Arguments change. People revise their positions, discover new evidence, encounter counterarguments. Prose handles this terribly — you either overwrite the old version and lose history, or you end up with a tangle of crossed-out paragraphs and margin notes.

Git handles this natively. Every revision is tracked. You can diff two versions of an argument and see exactly what changed: which premises were added, which axioms were revised, which conclusions shifted. You can fork someone's argument, modify a single axiom, and see how the downstream conclusions change.

And because prime-md supports cross-repository references, arguments can build on each other across projects. Your axiom can be my premise. If you change it, my `prime validate` breaks — and I know about it.

## Where this gets interesting

I built prime-md because I was frustrated with how hard it is to have productive disagreements. Most arguments-in-prose devolve into people talking past each other because they can't see where they actually diverge. Is it the axioms? The derivation? A missing premise?

But the use cases that excite me go further:

**Collaborative reasoning.** A team formalizing a strategic decision as a prime-md graph, so everyone can see the full premise chain and pinpoint exactly where they disagree.

**Education.** Students learning logic and argumentation by building and validating real argument graphs, rather than doing abstract exercises.

**AI verification.** LLMs are increasingly good at generating plausible-sounding arguments. prime-md gives you a format to make those arguments *auditable* — trace every conclusion back to its foundations and check the structure.

## The catch

This approach has real limitations, and I want to be honest about them.

It only checks *structure*, not *truth*. A perfectly valid prime-md graph can contain entirely false axioms and lead to absurd conclusions — and the linter won't complain. Garbage in, garbage out, just like any test suite.

It also can't evaluate whether a derivation actually follows from its premises. "Thinking is occurring" plus "thinking requires a thinker" is marked as leading to "I exist as a thinking thing" — but whether that inference is actually sound is a judgment call the tool leaves to you.

And formalizing arguments takes effort. Most people won't do it for casual debates, and that's fine. This is for the arguments that matter enough to get right.

## Try it

```
npx prime-md browse https://github.com/maximilliangeorge/prime-demo-cogito
```

That command pulls down the Descartes example and lets you explore it interactively. From there, you can create your own argument graph in a few minutes — just Markdown files with YAML frontmatter.

The repo is at github.com/maximilliangeorge/prime-md. It's open source, it's a single npm package, and I'd genuinely love to hear what people try to model with it.

Because I think the arguments that shape our world deserve at least as much rigor as the software that runs it.
