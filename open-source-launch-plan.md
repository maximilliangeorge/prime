# Launch Plan: prime-md

*A machine-readable graph of truth claims, built on Git and Markdown.*

---

## Understanding Your Project & Audience

prime-md sits at a fascinating intersection: it's a developer tool (CLI, npm, markdown-based) that serves a non-typical developer audience — people who care about structured argumentation, epistemology, philosophy, and verifiable reasoning. That's both a challenge and a superpower. The challenge is that there's no obvious existing category to slot into. The superpower is that when the right person sees it, it'll click immediately.

Your most likely early adopters fall into a few camps:

- **Philosophy students and academics** who want to formalize and share arguments
- **Rationalist/LessWrong-adjacent thinkers** who value epistemic rigor
- **Knowledge management enthusiasts** (Obsidian, Roam, Logseq users) who already think in graphs
- **AI/LLM researchers** interested in structured knowledge and reasoning chains
- **Developers building "tools for thought"** as a broader movement

The plan below is tailored to reaching these groups specifically.

---

## Phase 0: Positioning & README (Week 1)

### Sharpen the One-Liner

Your current repo description — "A machine-readable graph of truth claims, built on Git and Markdown" — is accurate but a bit abstract. Consider testing a version that leads with the *why*:

> **prime-md** lets you write arguments as Markdown files and validate them as dependency graphs — so claims have to trace back to their premises, or they break.

Or leaning into the developer angle:

> **prime-md** is version-controlled epistemology: write claims in Markdown, link premises like imports, and let the CLI catch circular logic and broken references.

The key is making someone immediately picture what using it feels like. "Machine-readable graph of truth claims" is what it *is*; the one-liner should communicate what it *does for you*.

### README Improvements

Your README already has good content — the Descartes example is brilliant because it's instantly recognizable and shows the concept working on a real argument. A few suggestions to strengthen it:

- **Lead with the tree visualization.** That ASCII argument tree (`> The external world exists ├─ ...`) is your best hook. Consider putting it right after the one-liner, before any installation instructions. It's the "demo GIF" equivalent for this project.
- **Add a "Why?" section early on.** Before the technical details, briefly answer: what's wrong with writing arguments in plain prose? Why would someone want machine-readable argument structure? This bridges the gap for people who are intrigued but not yet convinced.
- **Quickstart that shows the full loop.** Create a 3-step quickstart: (1) `npx prime-md browse` on the demo repo to see a working graph, (2) create a simple 2-claim argument, (3) run `prime validate` to see it pass. Under 2 minutes from install to "aha."
- **Comparison to adjacent tools.** A short section explaining how prime-md relates to Obsidian (not a note-taking app — it's about formal argument structure), to knowledge graphs (focused specifically on logical derivation, not general linking), and to proof assistants (human-readable, not formal logic syntax).

### Record a Demo

A short terminal recording (using asciinema or similar) showing: create two markdown files with premises, run `prime validate`, see it pass, break a reference, see it fail, then `prime graph` to visualize. This 30-second loop demonstrates the core value proposition better than any description.

---

## Phase 1: Seeding — Finding Your People (Weeks 2–4)

### Your Specific Watering Holes

These are the communities most likely to care about prime-md, roughly ranked by expected fit:

1. **Hacker News (Show HN)** — The rationalist-adjacent, tools-for-thought crowd is heavily represented here. This is probably your single highest-leverage post. Frame it around the *idea* (version-controlled argumentation) not just the tool.

2. **r/ObsidianMD and r/PKMS** — The personal knowledge management community already thinks in graphs and linked notes. prime-md extends that thinking into formal argument structure. Position it as "what if your linked notes had to be logically valid?"

3. **LessWrong / Rationalist community** — This audience literally values formalized reasoning. A post on LessWrong about "what if arguments had CI/CD" or "treating epistemology like code" would resonate deeply.

4. **r/philosophy and philosophy forums** — Especially the analytic philosophy crowd. The Descartes example is perfect bait. Frame it as: "I built a tool that lets you write Meditations-style arguments as code and validate the logical structure."

5. **Tools for Thought community** — People following Bret Victor, Andy Matuschak, the Ink & Switch crowd. They'll appreciate the idea of machine-readable argument structure.

6. **r/git and developer tooling communities** — The "Git as a platform for X" angle is interesting to developers even outside the philosophy use case. "What if Git tracked not just code changes but argument changes?"

7. **AI/LLM Twitter/X** — The structured reasoning angle connects to current conversations about chain-of-thought prompting, reasoning traces, and knowledge graphs for LLMs.

8. **Obsidian and Logseq Discord servers** — Active communities with people building plugins and custom workflows around linked thinking.

### Content Angles That Will Work

Instead of just announcing the tool, write pieces that demonstrate the thinking behind it:

- **"What if arguments had unit tests?"** — A blog post or HN essay exploring the idea that logical arguments are like software: they have dependencies, they can have circular references, they can break. prime-md is the test suite. This is your strongest Show HN angle.

- **"Descartes' Meditations as a dependency graph"** — Walk through formalizing a famous philosophical argument using prime-md. You already have this as an example; turn it into a standalone blog post or tutorial. Philosophy people will share this.

- **"Why I built version-controlled epistemology"** — A personal narrative post. What problem were you actually trying to solve? What breaks when arguments live in prose? What does it feel like to `git diff` an argument?

- **"Structured argumentation for the AI era"** — Connect prime-md to the current moment: LLMs generate plausible-sounding arguments that may be logically incoherent. prime-md provides a format for arguments that *must* trace back to their foundations. This angle will travel on AI Twitter.

### Launch Day Strategy

- **Show HN post:** Title something like "Show HN: Prime-MD – Write arguments as Markdown, validate them like code." In your comment, share the personal motivation, the Descartes example, and an honest "here's what's next." Post Tuesday–Thursday, 8–10 AM ET.
- **Same day:** Post the "arguments as unit tests" piece on your blog or dev.to/Hashnode
- **Same week:** Tailored posts to r/ObsidianMD and r/philosophy, each framed for that audience
- **Within 2 weeks:** LessWrong post exploring the epistemological implications

---

## Phase 2: Building Momentum (Months 2–3)

### Killer Integration: Obsidian Plugin

If you build one thing to drive adoption, it should be an Obsidian plugin. The Obsidian community is huge, they already work in Markdown, they already think in graphs, and they actively seek out new ways to structure knowledge. An Obsidian plugin that lets you write prime-md claims and see the argument graph rendered in the sidebar would be a massive growth lever. Even a basic version would generate significant interest.

### Example Repositories That Sell the Concept

The cogito example is excellent. Build 2–3 more that demonstrate different use cases:

- **A policy argument** — e.g., formalizing the case for/against a specific policy, showing how the same axioms lead to different conclusions depending on additional premises
- **A scientific reasoning chain** — e.g., the argument for plate tectonics from its foundational observations
- **A product decision** — e.g., "Why we chose Postgres over MongoDB" as a formal argument graph, showing this isn't just for philosophy

Each example repo expands the perceived audience.

### Content Rhythm

You don't need to publish constantly, but showing up regularly matters:

- **Weekly:** One tweet/post showing an interesting argument formalized in prime-md (famous philosophical arguments, historical debates, even pop culture reasoning)
- **Biweekly:** One longer piece — tutorial, integration guide, or exploration of a use case
- **Monthly:** A changelog post showing what's new in prime-md

### Community Seeding

- Open GitHub Discussions on the repo for "Argument Showcase" — invite people to share arguments they've formalized
- Create a `good first issue` label with approachable tasks (improve an example, add a CLI flag, improve error messages)
- If there's traction, start a small Discord for people building argument graphs

---

## Phase 3: Sustaining Growth (Month 4+)

### Documentation That Converts

- **"Getting Started" guide** that goes beyond the README: walk someone from zero to a 5-node argument graph with cross-repo references
- **"Cookbook"** with recipes: how to model different types of arguments (deductive, inductive, abductive), how to handle disagreement between two graphs, how to use prime-md in a classroom
- **Concept explainer:** a page that explains the data model (nodes, axioms, derived claims, premises) with diagrams

### Talks and Visibility

prime-md is a *great* conference talk because it bridges two worlds. Pitch talks to:

- **Developer conferences** (JSConf, local meetups) — "Building a logic engine in Markdown and Git"
- **Philosophy/digital humanities conferences** — "Machine-readable argumentation for philosophical analysis"
- **Tools for Thought meetups** — "Beyond note-linking: enforcing logical structure in your knowledge graph"

### The AI Angle (Biggest Growth Opportunity)

This is where prime-md could genuinely break out. As LLMs become more capable at generating arguments, the need for *verifiable argument structure* grows. Consider:

- Writing a blog post on using prime-md to validate LLM-generated reasoning chains
- Building a simple integration where an LLM outputs prime-md format and the CLI validates it
- Positioning prime-md as infrastructure for "trustworthy AI reasoning"

This angle connects to real funding, real research, and real urgency in the industry right now.

### Metrics to Watch

| Metric | Why It Matters |
|--------|---------------|
| npm weekly installs | Actual usage, not just curiosity |
| Example repos created by others | Shows the concept is resonating |
| Issues from non-maintainers | People care enough to engage |
| Cross-repo references | The "network effect" — people linking arguments across repos |
| Mentions in PKM/rationalist communities | Organic word-of-mouth in your target audience |

---

## Quick-Reference: Highest-Impact Actions

If you're short on time, focus here — roughly in priority order:

1. **Rewrite the one-liner** to communicate what it *does for you*, not just what it is
2. **Put the ASCII tree at the top of the README** — it's your best visual hook
3. **Write the "arguments as unit tests" essay** and post it as a Show HN
4. **Record a 30-second terminal demo** showing validate → pass → break → fail
5. **Post to r/ObsidianMD** framing it as structured reasoning for linked notes
6. **Post to LessWrong** exploring the epistemological angle
7. **Build an Obsidian plugin** (even a minimal one) — this is your biggest growth lever
8. **Create 2–3 example repos** covering non-philosophy use cases
9. **Write the AI/LLM angle piece** connecting prime-md to reasoning verification
10. **Respond to every issue and question quickly** — at this stage, every user matters

---

*The core insight: prime-md's biggest challenge is that people don't know they want it yet. You're not competing with other tools — you're introducing a new idea. That means your "marketing" is really about making the concept click. Once someone gets it, the tool sells itself. Every piece of content you write should be optimized for that "aha" moment.*
