export interface PrimeUri {
  host: string;
  owner: string;
  repo: string;
  ref: string;
  commit: string | null;
  path: string;
  immutable: boolean;
}

export interface PrimeAliasUri {
  alias: string;
  path: string;
}

export interface PrimeRepoUri {
  host: string;
  owner: string;
  repo: string;
  ref: string;
  commit: string | null;
  immutable: boolean;
  /** true when ref was not explicitly specified and should be resolved from HEAD */
  defaultRef?: boolean;
}

export type ParsedUri = PrimeUri | PrimeAliasUri;

export function isAliasUri(uri: ParsedUri): uri is PrimeAliasUri {
  return "alias" in uri;
}

export interface PremiseRef {
  kind: "local" | "remote";
  raw: string;
  resolvedPath: string | null;
  uri?: PrimeUri;
  error?: string;
}

export interface PrimeNode {
  filePath: string;
  relativePath: string;
  claim: string | null;
  body: string | null;
  premises: PremiseRef[];
  isAxiom: boolean;
}

export interface PrimeManifest {
  remotes: Record<string, string>;
  exports: string[];
}

export interface ArgumentGraph {
  nodes: Map<string, PrimeNode>;
  edges: { from: string; to: string }[];
}

export interface ValidationError {
  file: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  valid: boolean;
}
