import { eachInlineCode } from './shared.js';

import type { Claim } from '../domain/types.js';
import type { DocFile } from '../parser/index.js';

// A path-shaped token: optional ./ or ../ prefix, segments, and a real extension.
const FILE_PATH_RE = /^(\.\.?\/)?([\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]+$/;

// Precision over recall (ADR-0008): only inline-code tokens with a slash and a
// trailing extension count. Bare `index.ts` is too ambiguous; URLs are excluded.
function looksLikePath(value: string): boolean {
  if (value.includes(' ')) return false;
  if (!value.includes('/')) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return false;
  return FILE_PATH_RE.test(value);
}

export function extractFilePaths(doc: DocFile): Claim[] {
  const claims: Claim[] = [];
  for (const hit of eachInlineCode(doc)) {
    const value = hit.value.trim();
    if (!looksLikePath(value)) continue;
    claims.push({
      type: 'file-path',
      value,
      confidence: 'exact',
      source: 'inline-code',
      location: { file: doc.path, line: hit.line, column: hit.column },
    });
  }
  return claims;
}
