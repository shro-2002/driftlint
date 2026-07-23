import { extractFilePaths } from './file-path.js';
import { extractImportPaths } from './import-path.js';
import { extractNpmScripts } from './npm-script.js';

import type { Claim } from '../domain/types.js';
import type { DocFile } from '../parser/index.js';

export type Extractor = (doc: DocFile) => Claim[];

// Built-in extractors, one per claim source. Plugin extractors register here later (ADR-0005).
export const builtinExtractors: Extractor[] = [
  extractFilePaths,
  extractNpmScripts,
  extractImportPaths,
];

export function extractClaims(doc: DocFile): Claim[] {
  return builtinExtractors.flatMap((extract) => extract(doc));
}
