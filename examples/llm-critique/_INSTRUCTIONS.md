1. Read the docs
   `https://github.com/maximilliangeorge/prime-md`

2. Get all refs inside this directory
   `npx prime-md graph ./claims -f refs`

3. Go through one ref at a time, using the `pluck` command and a depth of 1:
   `npx prime-md pluck <path/to/ref> --depth 1`

4. Spawn a subagent to critically analyse each ref. Summarise the findings in `critiques/_<ref>_critique.md`

5. Write an overall summary in `critiques/__critique-summary.md`
