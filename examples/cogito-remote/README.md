# Cogito Remote

Demonstrates cross-repository references. This repo contains a single derived claim (`external-world.md`) whose premises point to nodes in an external repository (`prime-demo-cogito` on GitHub).

## Structure

`external-world.md` declares two remote premises:

```yaml
premises:
  - https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/reliable-truth.md
  - https://github.com/maximilliangeorge/prime-demo-cogito/blob/main/perception-of-world.md
```

When resolved, Prime clones the remote repository into its local cache and recursively validates the full argument graph across both repos.

## Usage

```sh
# Validate (resolves remote premises)
npx prime-md validate .

# View the full resolved graph
npx prime-md graph . -f tree
```
