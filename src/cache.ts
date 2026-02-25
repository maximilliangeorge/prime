import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { simpleGit } from "simple-git";
import type { PrimeUri, PrimeRepoUri } from "./types.js";

interface RepoRef {
  host: string;
  owner: string;
  repo: string;
  immutable: boolean;
}

function getCacheDir(repo: RepoRef): string {
  return path.join(
    os.homedir(),
    ".prime",
    "cache",
    repo.host,
    repo.owner,
    repo.repo
  );
}

function getCloneUrl(repo: RepoRef): string {
  return `https://${repo.host}/${repo.owner}/${repo.repo}.git`;
}

export async function ensureCached(uri: PrimeUri | PrimeRepoUri): Promise<string> {
  const cacheDir = getCacheDir(uri);

  if (fs.existsSync(path.join(cacheDir, "HEAD"))) {
    // Already cloned — fetch if mutable
    if (!uri.immutable) {
      const git = simpleGit(cacheDir);
      await git.fetch(["origin", "+refs/heads/*:refs/heads/*"]);
    }
  } else {
    // Bare clone
    fs.mkdirSync(cacheDir, { recursive: true });
    const git = simpleGit();
    await git.clone(getCloneUrl(uri), cacheDir, ["--bare"]);
  }

  return cacheDir;
}

export async function getDefaultBranch(cacheDir: string): Promise<string> {
  const git = simpleGit(cacheDir);
  // In a bare clone, HEAD is a symbolic ref to the default branch
  const ref = await git.raw(["symbolic-ref", "HEAD"]);
  // Returns e.g. "refs/heads/master\n"
  return ref.trim().replace("refs/heads/", "");
}

export async function readCachedFile(
  uri: PrimeUri,
  cacheDir: string
): Promise<string | null> {
  return readCachedFileByRef(uri.commit || uri.ref, uri.path, cacheDir);
}

export async function readCachedFileByRef(
  ref: string,
  filePath: string,
  cacheDir: string
): Promise<string | null> {
  const git = simpleGit(cacheDir);
  try {
    return await git.show([`${ref}:${filePath}`]);
  } catch {
    return null;
  }
}

export async function listCachedFiles(
  ref: string,
  cacheDir: string
): Promise<string[]> {
  const git = simpleGit(cacheDir);
  const result = await git.raw(["ls-tree", "-r", "--name-only", ref]);
  return result
    .split("\n")
    .filter((line) => line.endsWith(".md"))
    .filter((line) => {
      const basename = path.basename(line);
      return basename !== "README.md" && !basename.startsWith("_");
    })
    .filter((line) => !line.startsWith("node_modules/"));
}
