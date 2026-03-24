import type { PrimeNode, PrimeManifest, PremiseRef, PrimeUri } from "./types.js";
import { isAliasUri } from "./types.js";
import { parseUri, expandAlias, canonicalUrl } from "./uri.js";
import { ensureCached, readCachedFile } from "./cache.js";
import { parseNodeFromContent } from "./parse.js";

function resolveUriFromRaw(
  raw: string,
  manifest: PrimeManifest
): PrimeUri | string {
  const parsed = parseUri(raw);
  if (!parsed) {
    return `Invalid remote reference: ${raw}`;
  }

  if (isAliasUri(parsed)) {
    const expanded = expandAlias(parsed, manifest);
    if (!expanded) {
      return `Unknown alias: @${parsed.alias}`;
    }
    return expanded;
  }

  return parsed;
}

export function hasRemotePremises(nodes: PrimeNode[]): boolean {
  return nodes.some((n) =>
    n.premises.some((p) => p.kind === "remote") ||
    n.counters.some((p) => p.kind === "remote")
  );
}

export async function resolveAllPremises(
  nodes: PrimeNode[],
  rootDir: string,
  manifest: PrimeManifest,
  maxDepth: number = -1
): Promise<PrimeNode[]> {
  const visited = new Set<string>();
  const remoteNodes: PrimeNode[] = [];

  for (const node of nodes) {
    for (const premise of node.premises) {
      if (premise.kind === "remote") {
        await resolveRemotePremise(
          premise,
          manifest,
          visited,
          remoteNodes,
          0,
          maxDepth
        );
      }
    }
    for (const counter of node.counters) {
      if (counter.kind === "remote") {
        await resolveRemotePremise(
          counter,
          manifest,
          visited,
          remoteNodes,
          0,
          maxDepth
        );
      }
    }
  }

  return remoteNodes;
}

async function resolveRemotePremise(
  premise: PremiseRef,
  manifest: PrimeManifest,
  visited: Set<string>,
  remoteNodes: PrimeNode[],
  currentDepth: number,
  maxDepth: number
): Promise<void> {
  const result = resolveUriFromRaw(premise.raw, manifest);
  if (typeof result === "string") {
    premise.error = result;
    return;
  }

  const uri = result;
  premise.uri = uri;
  const canonical = canonicalUrl(uri);
  premise.resolvedPath = canonical;

  if (visited.has(canonical)) {
    return;
  }
  visited.add(canonical);

  try {
    const cacheDir = await ensureCached(uri);
    const content = await readCachedFile(uri, cacheDir);
    if (content === null) {
      premise.error = `Remote file not found: ${uri.path} in ${uri.host}/${uri.owner}/${uri.repo}@${uri.ref}`;
      return;
    }

    // Parse the remote content into a node
    const remoteNode = parseNodeFromContent(content, canonical, canonical);
    // Fix relativePath to be the URI path component
    remoteNode.relativePath = uri.path;

    // Resolve premises and counters within the remote node
    for (const remotePremise of [...remoteNode.premises, ...remoteNode.counters]) {
      if (remotePremise.kind === "remote") {
        if (maxDepth === -1 || currentDepth + 1 < maxDepth) {
          await resolveRemotePremise(
            remotePremise,
            manifest,
            visited,
            remoteNodes,
            currentDepth + 1,
            maxDepth
          );
        }
      } else if (remotePremise.kind === "local") {
        // Local premise within a remote repo — rewrite as a remote URI in the same repo
        const localPath = remotePremise.raw.replace(/^\.\//, "");
        const basePath = uri.path.includes("/")
          ? uri.path.substring(0, uri.path.lastIndexOf("/") + 1)
          : "";
        const resolvedPath = basePath + localPath;

        const syntheticUri: PrimeUri = {
          host: uri.host,
          owner: uri.owner,
          repo: uri.repo,
          ref: uri.ref,
          commit: uri.commit,
          path: resolvedPath,
          immutable: uri.immutable,
        };

        const syntheticCanonical = canonicalUrl(syntheticUri);
        remotePremise.resolvedPath = syntheticCanonical;
        remotePremise.kind = "remote";
        remotePremise.uri = syntheticUri;

        if (!visited.has(syntheticCanonical)) {
          if (maxDepth === -1 || currentDepth + 1 < maxDepth) {
            const syntheticPremise: PremiseRef = {
              kind: "remote",
              raw: syntheticCanonical,
              resolvedPath: null,
              uri: syntheticUri,
            };

            await resolveRemotePremise(
              syntheticPremise,
              manifest,
              visited,
              remoteNodes,
              currentDepth + 1,
              maxDepth
            );
          }
        }
      }
    }

    remoteNodes.push(remoteNode);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    premise.error = `Failed to resolve remote: ${premise.raw} — ${msg}`;
  }
}
