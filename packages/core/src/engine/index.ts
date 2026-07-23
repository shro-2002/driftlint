import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { loadConfig } from '../config/index.js';
import { discoverDocs } from '../discovery/index.js';
import { extractClaims } from '../extractors/index.js';
import { builtinRules } from '../rules/index.js';
import { parseDoc } from '../parser/index.js';
import { createIndex, type IndexPlan } from '../workspace-index/index.js';

import type { DocFile } from '../parser/index.js';
import type {
  Claim,
  ClaimType,
  Config,
  Finding,
  Rule,
  RuleViolation,
  RunResult,
  Severity,
  Suppression,
} from '../domain/types.js';

export interface CreateOptions {
  cwd: string;
  config?: Partial<Config>;
}

export interface Driftlint {
  run(): Promise<RunResult>;
}

const CLAIM_FACET: Record<ClaimType, keyof IndexPlan> = {
  'file-path': 'files',
  'npm-script': 'scripts',
  'import-path': 'packages',
};

// Composition root: the one place allowed to depend on every module (ADR-0001).
export async function createDriftlint(opts: CreateOptions): Promise<Driftlint> {
  const config = loadConfig(opts.config);
  const root = opts.cwd;

  return {
    async run(): Promise<RunResult> {
      const start = Date.now();

      const enabledRules = builtinRules.filter((rule) => severityFor(config, rule) !== 'off');

      const docPaths = await discoverDocs(root, config);
      const parsed: Array<{ doc: DocFile; claims: Claim[] }> = [];
      let claimsChecked = 0;
      for (const rel of docPaths) {
        const content = await readFile(join(root, rel), 'utf8');
        const doc = parseDoc(rel, content);
        const claims = extractClaims(doc);
        claimsChecked += claims.length;
        parsed.push({ doc, claims });
      }

      const index = await createIndex(root, planFacets(enabledRules));

      const findings: Finding[] = [];
      for (const { doc, claims } of parsed) {
        for (const rule of enabledRules) {
          const severity = severityFor(config, rule) as Severity;
          for (const claim of claims) {
            if (!rule.claimTypes.includes(claim.type)) continue;
            for (const violation of rule.verify(claim, { index })) {
              if (isSuppressed(doc.directives, violation)) continue;
              findings.push({ ...violation, severity });
            }
          }
        }
      }
      findings.sort(byLocation);

      return {
        findings,
        stats: {
          filesScanned: docPaths.length,
          claimsChecked,
          durationMs: Date.now() - start,
        },
      };
    },
  };
}

function severityFor(config: Config, rule: Rule): Severity | 'off' {
  return config.rules[rule.id] ?? rule.defaultSeverity;
}

function planFacets(rules: Rule[]): IndexPlan {
  const plan: IndexPlan = { files: false, scripts: false, packages: false };
  for (const rule of rules) {
    for (const claimType of rule.claimTypes) plan[CLAIM_FACET[claimType]] = true;
  }
  return plan;
}

function isSuppressed(directives: Suppression[], violation: RuleViolation): boolean {
  const line = violation.claim.location.line;
  return directives.some((d) => {
    if (d.ruleIds && !d.ruleIds.has(violation.ruleId)) return false;
    if (d.kind === 'file') return true;
    return d.range !== null && line >= d.range.start && line <= d.range.end;
  });
}

function byLocation(a: Finding, b: Finding): number {
  return (
    a.claim.location.file.localeCompare(b.claim.location.file) ||
    a.claim.location.line - b.claim.location.line ||
    a.claim.location.column - b.claim.location.column ||
    a.ruleId.localeCompare(b.ruleId)
  );
}
