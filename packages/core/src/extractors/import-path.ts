import { eachCodeBlock, scanBlockLines } from './shared.js';

import type { Claim } from '../domain/types.js';
import type { DocFile } from '../parser/index.js';

const JS_LANGS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'mts',
  'cts',
  'javascript',
  'typescript',
]);

// import syntax is an unambiguous signal that the string is a module specifier.
const IMPORT_RES: RegExp[] = [
  /\bimport\s+[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

export function extractImportPaths(doc: DocFile): Claim[] {
  const claims: Claim[] = [];
  for (const block of eachCodeBlock(doc)) {
    if (!JS_LANGS.has(block.lang)) continue;
    for (const regex of IMPORT_RES) {
      scanBlockLines(block, regex, (spec, line, column) => {
        claims.push({
          type: 'import-path',
          value: spec,
          confidence: 'exact',
          source: 'fence',
          location: { file: doc.path, line, column },
        });
      });
    }
  }
  return claims;
}
