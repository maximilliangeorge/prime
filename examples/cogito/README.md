# Cogito

Descartes' *Meditations on First Philosophy* encoded as a Prime argument graph. Starting from the bare fact that thinking is occurring, the argument builds through the *cogito*, a criterion of truth, proofs of God's existence and veracity, and finally concludes that the external world exists.

## Structure

The graph has 15 nodes forming a DAG with `external-world.md` as the root conclusion:

- **Axioms** (no premises): `thinking.md`, `thinker.md`, `doubt-is-thought.md`, `clarity.md`, `idea-of-perfection.md`, `causal-adequacy.md`, `perfection-entails-truthfulness.md`, `perception-of-world.md`
- **Derived claims**: `cogito.md` -> `criterion-of-truth.md` -> `god-exists.md` -> `god-is-no-deceiver.md` -> `reliable-truth.md` -> `external-world.md`

## Usage

```sh
# Validate the argument graph
npx prime-md validate .

# View as a tree
npx prime-md graph . -f tree

# Export as DOT for visualization
npx prime-md graph . -f dot
```

## Exports

`prime.yaml` exports `external-world.md`, making it available as a premise for other repositories via `prime://` URIs.
