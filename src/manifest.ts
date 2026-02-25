import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";
import type { PrimeManifest } from "./types.js";
import { readCachedFileByRef } from "./cache.js";

const EMPTY_MANIFEST: PrimeManifest = { remotes: {}, exports: [] };

export function parseManifestContent(content: string): PrimeManifest {
  const data = yaml.load(content) as Record<string, unknown> | null;

  if (!data || typeof data !== "object") {
    return { ...EMPTY_MANIFEST };
  }

  const remotes: Record<string, string> = {};
  if (data.remotes && typeof data.remotes === "object") {
    for (const [key, value] of Object.entries(
      data.remotes as Record<string, unknown>
    )) {
      remotes[key] = String(value);
    }
  }

  const exports: string[] = Array.isArray(data.exports)
    ? data.exports.map(String)
    : [];

  return { remotes, exports };
}

export function loadManifest(rootDir: string): PrimeManifest {
  const manifestPath = path.join(rootDir, "prime.yaml");

  if (!fs.existsSync(manifestPath)) {
    return { ...EMPTY_MANIFEST };
  }

  const content = fs.readFileSync(manifestPath, "utf-8");
  return parseManifestContent(content);
}

export async function loadManifestFromCache(
  ref: string,
  cacheDir: string
): Promise<PrimeManifest> {
  const content = await readCachedFileByRef(ref, "prime.yaml", cacheDir);
  if (!content) return { ...EMPTY_MANIFEST };
  return parseManifestContent(content);
}
