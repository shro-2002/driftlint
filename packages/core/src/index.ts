export { createDriftlint } from './engine/index.js';
export type { CreateOptions, Driftlint } from './engine/index.js';
export { pretty, json, github } from './reporters/index.js';
export { DEFAULT_CONFIG, loadConfig } from './config/index.js';
export { builtinRules } from './rules/index.js';
export type {
  Claim,
  ClaimType,
  ClaimSource,
  Config,
  Confidence,
  Finding,
  Location,
  Rule,
  RuleContext,
  RuleViolation,
  RunResult,
  RunStats,
  Severity,
  Suppression,
  WorkspaceIndex,
} from './domain/types.js';
