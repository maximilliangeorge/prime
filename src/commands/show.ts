import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import ora from "ora";
import matter from "gray-matter";
import { parseNodeFromContent } from "../parse.js";
import { parseUri, expandAlias } from "../uri.js";
import { ensureCached, readCachedFile } from "../cache.js";
import { loadManifest } from "../manifest.js";
import { isAliasUri } from "../types.js";
import type { PrimeNode } from "../types.js";

export async function showCommand(reference: string): Promise<void> {
  let content: string;
  let node: PrimeNode;

  if (reference.startsWith("prime://") || reference.startsWith("https://")) {
    // Remote URI
    const parsed = parseUri(reference);
    if (!parsed) {
      console.error(chalk.red(`Invalid prime URI: ${reference}`));
      process.exit(1);
    }

    let uri;
    if (isAliasUri(parsed)) {
      const manifest = loadManifest(process.cwd());
      const expanded = expandAlias(parsed, manifest);
      if (!expanded) {
        console.error(chalk.red(`Unknown alias: @${parsed.alias}`));
        process.exit(1);
      }
      uri = expanded;
    } else {
      uri = parsed;
    }

    const spinner = ora(`Fetching ${uri.owner}/${uri.repo}…`).start();
    try {
      const cacheDir = await ensureCached(uri);
      const result = await readCachedFile(uri, cacheDir);
      if (result === null) {
        spinner.fail(`Remote file not found: ${uri.path}`);
        process.exit(1);
      }
      content = result;
      spinner.succeed("Fetched remote node");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      spinner.fail(`Failed to fetch remote: ${msg}`);
      process.exit(1);
    }

    const syntheticPath = `prime://${uri.host}/${uri.owner}/${uri.repo}/${uri.ref}/${uri.path}`;
    node = parseNodeFromContent(content, syntheticPath, syntheticPath);
  } else {
    // Local path
    const filePath = path.resolve(reference);
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`File not found: ${filePath}`));
      process.exit(1);
    }

    content = fs.readFileSync(filePath, "utf-8");
    const rootDir = process.cwd();
    node = parseNodeFromContent(content, filePath, rootDir);
  }

  // Pretty-print
  console.log(chalk.bold(`Claim: ${node.claim ?? "(none)"}`));

  if (node.isAxiom) {
    console.log(`Type: ${chalk.cyan("axiom")} (no premises)`);
  } else {
    console.log(
      `Type: ${chalk.cyan("derived")} (${node.premises.length} premise${node.premises.length === 1 ? "" : "s"})`
    );
    console.log("Premises:");
    for (let i = 0; i < node.premises.length; i++) {
      const p = node.premises[i];
      console.log(`  ${i + 1}. ${p.raw}`);
    }
  }

  // Print body (content after frontmatter, excluding H1)
  const { content: body } = matter(content);
  const bodyWithoutH1 = body.replace(/^#\s+.+\n?/, "").trim();
  if (bodyWithoutH1) {
    console.log("---");
    console.log(bodyWithoutH1);
  }
}
