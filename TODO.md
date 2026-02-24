# Resilient Remote Resolution

Issues and considerations for making `prime://` remote resolution work reliably across GitHub, GitLab, Gitea, Codeberg, self-hosted Git, and other providers.

## Fixed

- [x] **Bare clone ref mismatch** — `readCachedFile` used `origin/<ref>` but bare clones store refs under `refs/heads/*`, not `refs/remotes/origin/*`. Fixed by using `uri.ref` directly.
- [x] **Fetch refspec** — `git fetch origin` in a bare clone doesn't update `refs/heads/*` by default. Fixed with explicit `+refs/heads/*:refs/heads/*` refspec.

## URI Scheme

- [ ] **`owner/repo` assumption** — `PrimeUri` assumes `host/owner/repo` structure (GitHub, GitLab, Codeberg). Self-hosted Git or flat hosting (e.g. `git.example.com/repo.git`) may not have an owner segment. Consider making the path between host and ref flexible rather than fixed to two segments.
- [ ] **Repo names with slashes** — GitLab supports nested groups (`gitlab.com/org/subgroup/repo`). The current regex `([^/]+)/([^/]+)` can't capture this. May need a different delimiter strategy or require explicit separators.
- [ ] **Default branch name** — Alias expansion defaults to `main` when no ref is given. Not all repos use `main` (could be `master`, `trunk`, etc.). Consider querying `HEAD` from the bare clone or requiring the ref explicitly.

## Clone URL Construction

- [ ] **HTTPS-only** — `getCloneUrl` hardcodes `https://`. Some self-hosted servers use SSH-only, non-standard ports, or custom URL patterns (e.g. `https://git.example.com:3000/owner/repo.git`). Consider supporting `ssh://` or making the clone URL configurable per-host.
- [ ] **`.git` suffix** — Some providers require `.git`, others reject it. Currently always appended. May need to try both or make it configurable.

## Authentication

- [ ] **Private repos** — Currently no auth support. `simple-git` clone/fetch will fail silently on private repos. Consider supporting Git credential helpers, SSH keys, or `GIT_ASKPASS` so the user's existing Git auth setup is respected.
- [ ] **Rate limiting** — GitHub and others rate-limit unauthenticated HTTPS requests. Repeated `fetch` calls during validation could hit limits. Consider respecting auth tokens or adding fetch throttling.

## Cache Robustness

- [ ] **Corrupted cache** — If a bare clone is interrupted (e.g. network drop during `git clone --bare`), the cache dir exists but is broken. `ensureCached` checks for `HEAD` but a partial clone may have `HEAD` without valid objects. Add a health check or recovery (delete and re-clone).
- [ ] **Cache invalidation** — Mutable refs are re-fetched every time. For `prime validate` on a large graph with many remotes pointing to the same repo, this means redundant fetches. Consider a short TTL or per-session fetch-once cache.
- [ ] **Tag refs** — `ref` could be a tag (`v1.0.0`), but we only fetch `refs/heads/*`. Need to also fetch `refs/tags/*` or detect the ref type.
- [ ] **Concurrent access** — Multiple `prime` processes could clone/fetch the same cache dir simultaneously, causing corruption. Consider file locking.

## Error Handling

- [ ] **Network errors vs. not-found** — `readCachedFile` returns `null` for both "file doesn't exist" and "ref doesn't exist". `ensureCached` throws on clone failure. Distinguish between: network unreachable, repo not found (404), ref not found, file not found within ref. Each needs a different error message.
- [ ] **Offline mode** — If the network is down but the cache exists, mutable ref fetch fails and the whole resolution fails. Consider falling back to stale cache with a warning.
- [ ] **Timeout** — No timeout on `git clone` or `git fetch`. A slow or hanging server blocks the entire process. Add configurable timeouts to `simple-git` calls.

## URI Parsing Edge Cases

- [ ] **Paths with special characters** — Spaces, unicode, `#`, `?` in file paths could break parsing or `git show`.
- [ ] **Trailing slashes** — `prime://host/owner/repo/main/dir/` (pointing at a directory, not a file) is not handled.
- [ ] **Case sensitivity** — Some Git hosts are case-insensitive for owner/repo but case-sensitive for paths. Cache dir naming should normalize host/owner/repo but preserve path case.
