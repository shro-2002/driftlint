// Core domain model. Rule Set v1 (ADR-0008): three high-precision claim types.

export type ClaimType = 'file-path' | 'npm-script' | 'import-path';

export type Confidence = 'exact' | 'likely';

export type Severity = 'error' | 'warn';

export type ClaimSource = 'inline-code' | 'fence';

export interface Location {
  /** Workspace-relative posix path of the doc the claim was found in. */
  file: string;
  line: number;
  column: number;
}

export interface Claim {
  type: ClaimType;
  value: string;
  location: Location;
  confidence: Confidence;
  source: ClaimSource;
}

/** A rule's raw output, before the engine attaches the configured severity. */
export interface RuleViolation {
  ruleId: string;
  message: string;
  claim: Claim;
}

export interface Finding extends RuleViolation {
  severity: Severity;
}

/** Read-only query surface over the scanned repo. Facets built lazily by the engine. */
export interface FacetSet {
  has(key: string): boolean;
}

/** The files facet also answers directory-existence queries (for the parent-dir guard). */
export interface FileFacet extends FacetSet {
  hasDir(dir: string): boolean;
}

export interface WorkspaceIndex {
  files: FileFacet;
  scripts: FacetSet;
  packages: FacetSet;
}

export interface RuleContext {
  index: WorkspaceIndex;
}

export interface Rule {
  id: string;
  claimTypes: readonly ClaimType[];
  defaultSeverity: Severity;
  verify(claim: Claim, ctx: RuleContext): RuleViolation[];
}

/** A parsed `driftlint-ignore` directive (ADR-0009). */
export interface Suppression {
  kind: 'next' | 'file';
  /** Rule ids to suppress, or `null` for all rules. */
  ruleIds: ReadonlySet<string> | null;
  /**
   * For `next`: the inclusive line span of the block the directive precedes
   * (resolved to the next block node, so intervening blank lines a formatter
   * inserts don't break suppression). `null` for `file`.
   */
  range: { start: number; end: number } | null;
}

export interface RunStats {
  filesScanned: number;
  claimsChecked: number;
  durationMs: number;
}

export interface RunResult {
  findings: Finding[];
  stats: RunStats;
}

export interface Config {
  include: string[];
  exclude: string[];
  rules: Record<string, Severity | 'off'>;
}
