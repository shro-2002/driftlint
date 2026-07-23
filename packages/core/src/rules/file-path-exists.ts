import { posix } from 'node:path';

import type { Rule } from '../domain/types.js';

// Paths into conventionally generated / gitignored / editor-local dirs are not
// source-of-truth; their absence is expected, not drift. Skip them. `.vscode`/
// `.idea` added after the corpus showed docs instructing users to create files
// there (e.g. `.vscode/launch.json`) — ADR-0010.
const IGNORED_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.cache',
  '.vscode',
  '.idea',
]);

function stripDotSlash(p: string): string {
  return p.startsWith('./') ? p.slice(2) : p;
}

// A doc reference may be relative to the repo root OR to the doc's own directory
// (e.g. `adr/x.md` inside docs/README.md means docs/adr/x.md). Accept either.
function candidatePaths(value: string, docFile: string): string[] {
  const rootRelative = stripDotSlash(value.replace(/^\/+/, ''));
  const docDir = posix.dirname(docFile);
  const docRelative = stripDotSlash(
    posix.normalize(posix.join(docDir === '.' ? '' : docDir, value)),
  );
  return [rootRelative, docRelative];
}

function pointsIntoIgnoredDir(paths: string[]): boolean {
  return paths.some((p) => p.split('/').some((segment) => IGNORED_SEGMENTS.has(segment)));
}

export const filePathExists: Rule = {
  id: 'file-path-exists',
  claimTypes: ['file-path'],
  defaultSeverity: 'error',
  verify(claim, ctx) {
    const paths = candidatePaths(claim.value, claim.location.file);
    if (pointsIntoIgnoredDir(paths)) return [];
    if (paths.some((p) => ctx.index.files.has(p))) return [];
    // Parent-directory guard (ADR-0010): only flag a missing file if its parent
    // directory exists in the repo. A reference into a directory the repo does
    // not have is illustrative/external (tutorial paths, MIME types, cross-repo).
    if (!paths.some((p) => ctx.index.files.hasDir(posix.dirname(p)))) return [];
    return [
      {
        ruleId: 'file-path-exists',
        message: `Referenced file "${claim.value}" does not exist in the workspace.`,
        claim,
      },
    ];
  },
};
