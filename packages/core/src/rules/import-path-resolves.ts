import { packageBase } from '../workspace-index/index.js';

import type { Rule } from '../domain/types.js';

function isRelative(spec: string): boolean {
  return spec.startsWith('.') || spec.startsWith('/');
}

// Deno/CDN/data URLs and file: specifiers are not npm packages (ADR-0010).
function isUrlSpecifier(spec: string): boolean {
  return /^(?:https?|file|data|npm|jsr):/.test(spec) || spec.includes('://');
}

export const importPathResolves: Rule = {
  id: 'import-path-resolves',
  claimTypes: ['import-path'],
  // Opt-in, off by default (ADR-0010): public READMEs demonstrate integrations
  // with packages the project doesn't depend on, which is indistinguishable from
  // drift in a static snapshot. Useful only for docs that should import real deps.
  defaultSeverity: 'warn',
  verify(claim, ctx) {
    const spec = claim.value;
    // Relative specifiers have no deterministic base dir in doc context (ADR-0008).
    if (isRelative(spec)) return [];
    if (isUrlSpecifier(spec)) return [];
    if (ctx.index.packages.has(spec)) return [];
    return [
      {
        ruleId: 'import-path-resolves',
        message: `Imported package "${packageBase(spec)}" is not a declared dependency.`,
        claim,
      },
    ];
  },
};
