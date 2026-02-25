import type { PrimeUri, PrimeAliasUri, PrimeRepoUri, ParsedUri, PrimeManifest } from "./types.js";

// prime://host/owner/repo/ref/path...
const MUTABLE_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/]+)\/([^/@]+)\/(.+)$/;

// prime://host/owner/repo@commit/path...
const IMMUTABLE_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/@]+)@([^/]+)\/(.+)$/;

// prime://@alias/path...
const ALIAS_RE = /^prime:\/\/@([^/]+)\/(.+)$/;

// https://github.com/owner/repo/blob/ref/path...
const GITHUB_URL_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

// Repo-level URLs (no file path)
// https://github.com/owner/repo (optionally with .git)
const GITHUB_REPO_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;

// https://github.com/owner/repo@ref (branch or commit pinned with @)
const GITHUB_REPO_AT_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/@]+)@([^/]+)\/?$/;

// https://github.com/owner/repo/tree/ref
const GITHUB_TREE_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+(?:\/[^/]+)*)$/;

// prime://host/owner/repo/ref (no trailing path — only 4 segments)
const PRIME_REPO_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/@]+)\/([^/]+)\/?$/;

// prime://host/owner/repo@commit (immutable, no file path)
const PRIME_REPO_IMMUTABLE_RE =
  /^prime:\/\/([^/]+)\/([^/]+)\/([^/@]+)@([^/]+)\/?$/;

export function parseUri(raw: string): ParsedUri | null {
  let match: RegExpMatchArray | null;

  match = raw.match(ALIAS_RE);
  if (match) {
    return { alias: match[1], path: match[2] };
  }

  match = raw.match(IMMUTABLE_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: match[4],
      path: match[5],
      immutable: true,
    };
  }

  match = raw.match(MUTABLE_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: null,
      path: match[5],
      immutable: false,
    };
  }

  match = raw.match(GITHUB_URL_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      path: match[4],
      immutable: false,
    };
  }

  return null;
}

export function expandAlias(
  aliasUri: PrimeAliasUri,
  manifest: PrimeManifest
): PrimeUri | null {
  const remote = manifest.remotes[aliasUri.alias];
  if (!remote) return null;

  // remote is "host/owner/repo" or "host/owner/repo@commit" or "host/owner/repo/ref"
  const commitMatch = remote.match(/^([^/]+)\/([^/]+)\/([^/@]+)@(.+)$/);
  if (commitMatch) {
    return {
      host: commitMatch[1],
      owner: commitMatch[2],
      repo: commitMatch[3],
      ref: commitMatch[4],
      commit: commitMatch[4],
      path: aliasUri.path,
      immutable: true,
    };
  }

  const refMatch = remote.match(/^([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (refMatch) {
    return {
      host: refMatch[1],
      owner: refMatch[2],
      repo: refMatch[3],
      ref: refMatch[4],
      commit: null,
      path: aliasUri.path,
      immutable: false,
    };
  }

  // Default: host/owner/repo — use "main" as default ref
  const parts = remote.split("/");
  if (parts.length === 3) {
    return {
      host: parts[0],
      owner: parts[1],
      repo: parts[2],
      ref: "main",
      commit: null,
      path: aliasUri.path,
      immutable: false,
    };
  }

  return null;
}

export function parseRepoUri(raw: string): PrimeRepoUri | null {
  let match: RegExpMatchArray | null;

  match = raw.match(GITHUB_TREE_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      immutable: false,
    };
  }

  match = raw.match(GITHUB_REPO_AT_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: match[3],
      commit: null,
      immutable: false,
    };
  }

  match = raw.match(GITHUB_REPO_RE);
  if (match) {
    return {
      host: "github.com",
      owner: match[1],
      repo: match[2],
      ref: "main",
      commit: null,
      immutable: false,
      defaultRef: true,
    };
  }

  match = raw.match(PRIME_REPO_IMMUTABLE_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: match[4],
      immutable: true,
    };
  }

  match = raw.match(PRIME_REPO_RE);
  if (match) {
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      ref: match[4],
      commit: null,
      immutable: false,
    };
  }

  return null;
}

export function isRemoteUrl(input: string): boolean {
  return input.startsWith("prime://") || input.startsWith("https://");
}
