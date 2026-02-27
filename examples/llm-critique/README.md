# LLM Critique

A quick experiment with Claude to critique each claim in a graph.

The idea is to methodically go through each claim one by one, critiquing only each conclusion and nearest premise using `npx prime-md graph ./claims -f refs` and `npx prime-md pluck <path/to/ref> --depth 1`.

Use this directory as the working directory (to make the subagent available) and pass `\_INSTRUCTIONS.md` to Claude.

See example output in [`critique`](./critique).
