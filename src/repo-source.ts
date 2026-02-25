import * as path from "node:path";
import type { PrimeNode, PrimeManifest, PrimeRepoUri } from "./types.js";
import { isRemoteUrl, parseRepoUri } from "./uri.js";
import { discoverNodes } from "./discover.js";
import { parseNode, parseNodeFromContent } from "./parse.js";
import { loadManifest, loadManifestFromCache } from "./manifest.js";
import { resolveAllPremises, hasRemotePremises } from "./resolve.js";
import { ensureCached, listCachedFiles, readCachedFileByRef, getDefaultBranch } from "./cache.js";

export interface RepoSourceResult {
  nodes: PrimeNode[];
  remoteNodes: PrimeNode[];
  manifest: PrimeManifest;
  label: string;
  hasRemotes: boolean;
}

export async function loadRepoSource(
  input: string
): Promise<RepoSourceResult> {
  if (isRemoteUrl(input)) {
    return loadRemoteRepoSource(input);
  }
  return loadLocalRepoSource(input);
}

async function loadLocalRepoSource(
  directory: string
): Promise<RepoSourceResult> {
  const rootDir = path.resolve(directory);
  const files = discoverNodes(rootDir);
  const nodes = files.map((f) => parseNode(f, rootDir));
  const manifest = loadManifest(rootDir);
  const hasRemotes = hasRemotePremises(nodes);
  const remoteNodes = await resolveAllPremises(nodes, rootDir, manifest);

  return { nodes, remoteNodes, manifest, label: rootDir, hasRemotes };
}

async function loadRemoteRepoSource(
  url: string
): Promise<RepoSourceResult> {
  const repoUri = parseRepoUri(url);
  if (!repoUri) {
    throw new Error(`Cannot parse as a repository URL: ${url}`);
  }

  const cacheDir = await ensureCached(repoUri);

  // Resolve actual default branch if no explicit ref was given
  if (repoUri.defaultRef) {
    repoUri.ref = await getDefaultBranch(cacheDir);
  }

  const manifest = await loadManifestFromCache(repoUri.ref, cacheDir);

  // Determine which files to load: exports or all .md files
  const filePaths =
    manifest.exports.length > 0
      ? manifest.exports
      : await listCachedFiles(repoUri.ref, cacheDir);

  const nodes: PrimeNode[] = [];
  const syntheticRoot = `prime://${repoUri.host}/${repoUri.owner}/${repoUri.repo}/${repoUri.ref}`;

  for (const filePath of filePaths) {
    const content = await readCachedFileByRef(
      repoUri.ref,
      filePath,
      cacheDir
    );
    if (content === null) continue;

    const syntheticFilePath = `${syntheticRoot}/${filePath}`;
    const node = parseNodeFromContent(content, syntheticFilePath, syntheticRoot);
    node.relativePath = filePath;

    // Rewrite local premises as remote URIs within the same repo
    rewriteLocalPremises(node, repoUri, filePath);

    nodes.push(node);
  }

  // Resolve any remote premises (cross-repo references)
  const hasRemotes = hasRemotePremises(nodes);
  const remoteNodes = await resolveAllPremises(
    nodes,
    syntheticRoot,
    manifest
  );

  const label = `${repoUri.owner}/${repoUri.repo}@${repoUri.ref}`;
  return { nodes, remoteNodes, manifest, label, hasRemotes };
}

function rewriteLocalPremises(
  node: PrimeNode,
  repoUri: PrimeRepoUri,
  filePath: string
): void {
  for (const premise of node.premises) {
    if (premise.kind !== "local") continue;

    const localPath = premise.raw.replace(/^\.\//, "");
    const baseDir = filePath.includes("/")
      ? filePath.substring(0, filePath.lastIndexOf("/") + 1)
      : "";
    const resolvedPath = baseDir + localPath;
    const syntheticUri = `prime://${repoUri.host}/${repoUri.owner}/${repoUri.repo}/${repoUri.ref}/${resolvedPath}`;

    premise.kind = "remote";
    premise.raw = syntheticUri;
    premise.resolvedPath = syntheticUri;
    premise.uri = {
      host: repoUri.host,
      owner: repoUri.owner,
      repo: repoUri.repo,
      ref: repoUri.ref,
      commit: repoUri.commit,
      path: resolvedPath,
      immutable: repoUri.immutable,
    };
  }
}
