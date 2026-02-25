import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import type { PrimeNode, PremiseRef } from "./types.js";

const H1_REGEX = /^#\s+(.+)$/m;

function parsePremiseRef(raw: string): PremiseRef {
  if (raw.startsWith("prime://") || raw.startsWith("https://")) {
    return { kind: "remote", raw, resolvedPath: null };
  }
  return { kind: "local", raw, resolvedPath: null };
}

export function parseNodeFromContent(
  content: string,
  filePath: string,
  rootDir: string
): PrimeNode {
  const { data, content: body } = matter(content);

  const h1Match = content.match(H1_REGEX);
  const claim = h1Match ? h1Match[1].trim() : null;

  const bodyWithoutH1 = body.replace(/^#\s+.+\n?/, '').trim() || null;

  const rawPremises: string[] = Array.isArray(data.premises)
    ? data.premises
    : [];

  const premises = rawPremises.map((raw: string) => {
    const ref = parsePremiseRef(String(raw));
    if (ref.kind === "local") {
      ref.resolvedPath = path.resolve(path.dirname(filePath), ref.raw);
    }
    return ref;
  });

  const relativePath = path.relative(rootDir, filePath);

  return {
    filePath,
    relativePath,
    claim,
    body: bodyWithoutH1,
    premises,
    isAxiom: premises.length === 0,
  };
}

export function parseNode(filePath: string, rootDir: string): PrimeNode {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseNodeFromContent(content, filePath, rootDir);
}
