import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { parseNode } from "../src/parse.js";
import { buildGraph, detectCycles, validate } from "../src/graph-builder.js";

const fixtures = path.resolve(__dirname, "fixtures");

function parseFixture(dir: string, files: string[]) {
  const rootDir = path.join(fixtures, dir);
  return files.map((f) => parseNode(path.join(rootDir, f), rootDir));
}

describe("buildGraph", () => {
  it("builds graph from nodes with correct edges", () => {
    const nodes = parseFixture("valid-tree", [
      "thinking-is-self-evident.md",
      "doubt-presupposes-a-doubter.md",
      "cogito.md",
    ]);
    const graph = buildGraph(nodes);

    expect(graph.nodes.size).toBe(3);
    expect(graph.edges).toHaveLength(2);

    const edgeTos = graph.edges.map((e) => path.basename(e.to));
    expect(edgeTos).toContain("thinking-is-self-evident.md");
    expect(edgeTos).toContain("doubt-presupposes-a-doubter.md");

    for (const edge of graph.edges) {
      expect(path.basename(edge.from)).toBe("cogito.md");
    }
  });
});

describe("detectCycles", () => {
  it("detects cycle in a→b→a", () => {
    const nodes = parseFixture("cycle", ["a.md", "b.md"]);
    const graph = buildGraph(nodes);
    const cycles = detectCycles(graph);

    expect(cycles.length).toBeGreaterThanOrEqual(1);
    // Each cycle should contain both files
    const flatPaths = cycles.flat().map((p) => path.basename(p));
    expect(flatPaths).toContain("a.md");
    expect(flatPaths).toContain("b.md");
  });

  it("finds no cycles in valid tree", () => {
    const nodes = parseFixture("valid-tree", [
      "thinking-is-self-evident.md",
      "doubt-presupposes-a-doubter.md",
      "cogito.md",
    ]);
    const graph = buildGraph(nodes);
    const cycles = detectCycles(graph);
    expect(cycles).toHaveLength(0);
  });
});

describe("validate", () => {
  it("validates valid tree with no errors", () => {
    const rootDir = path.join(fixtures, "valid-tree");
    const nodes = parseFixture("valid-tree", [
      "thinking-is-self-evident.md",
      "doubt-presupposes-a-doubter.md",
      "cogito.md",
    ]);
    const graph = buildGraph(nodes);
    const result = validate(graph, rootDir);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("reports broken references", () => {
    const rootDir = path.join(fixtures, "broken-ref");
    const nodes = parseFixture("broken-ref", ["a.md"]);
    const graph = buildGraph(nodes);
    const result = validate(graph, rootDir);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    const brokenError = result.errors.find((e) =>
      e.message.includes("Broken reference")
    );
    expect(brokenError).toBeDefined();
    expect(brokenError!.message).toContain("nonexistent.md");
  });

  it("reports cycles as errors", () => {
    const rootDir = path.join(fixtures, "cycle");
    const nodes = parseFixture("cycle", ["a.md", "b.md"]);
    const graph = buildGraph(nodes);
    const result = validate(graph, rootDir);

    expect(result.valid).toBe(false);
    const cycleError = result.errors.find((e) =>
      e.message.includes("Circular dependency")
    );
    expect(cycleError).toBeDefined();
  });

  it("builds counter edges with correct type", () => {
    const rootDir = path.join(fixtures, "counter");
    const nodes = parseFixture("counter", [
      "claim.md",
      "objection.md",
      "evidence.md",
      "supported-objection.md",
    ]);
    const graph = buildGraph(nodes);

    const counterEdges = graph.edges.filter((e) => e.type === "counter");
    const premiseEdges = graph.edges.filter((e) => e.type === "premise");

    expect(counterEdges).toHaveLength(2); // objection→claim, supported-objection→objection
    expect(premiseEdges).toHaveLength(1); // supported-objection→evidence
  });

  it("allows counter-cycles (mutual objection)", () => {
    const rootDir = path.join(fixtures, "counter-cycle");
    const nodes = parseFixture("counter-cycle", ["a.md", "b.md"]);
    const graph = buildGraph(nodes);
    const result = validate(graph, rootDir);

    // Counter-cycles should NOT be errors
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    // But the counter edges should exist
    const counterEdges = graph.edges.filter((e) => e.type === "counter");
    expect(counterEdges).toHaveLength(2);
  });

  it("reports broken counter references", () => {
    const rootDir = path.join(fixtures, "counter");
    const node = {
      filePath: path.join(rootDir, "broken-counter.md"),
      relativePath: "broken-counter.md",
      claim: "Broken counter",
      body: null,
      premises: [],
      counters: [
        {
          kind: "local" as const,
          raw: "./nonexistent.md",
          resolvedPath: path.join(rootDir, "nonexistent.md"),
        },
      ],
      isAxiom: true,
    };
    const graph = buildGraph([node]);
    const result = validate(graph, rootDir);

    expect(result.valid).toBe(false);
    const brokenError = result.errors.find((e) =>
      e.message.includes("Broken reference")
    );
    expect(brokenError).toBeDefined();
    expect(brokenError!.message).toContain("nonexistent.md");
  });

  it("reports missing H1 as warning", () => {
    const rootDir = path.join(fixtures, "valid-tree");
    // Create a node with no claim
    const node = {
      filePath: path.join(rootDir, "no-claim.md"),
      relativePath: "no-claim.md",
      claim: null,
      body: null,
      premises: [],
      counters: [],
      isAxiom: true,
    };
    const graph = buildGraph([node]);
    const result = validate(graph, rootDir);

    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    const warning = result.warnings.find((w) =>
      w.message.includes("Missing H1")
    );
    expect(warning).toBeDefined();
  });
});
