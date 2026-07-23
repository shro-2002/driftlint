import { eachInlineCode } from './shared.js';

import type { Claim } from '../domain/types.js';
import type { DocFile } from '../parser/index.js';

// Strong signal only: explicit `<pm> run <script>`. Shorthand like `pnpm build`
// is skipped to avoid confusing scripts with package-manager builtins (ADR-0008).
// Inline code only, NOT shell fences: `npm run build` in a bash tutorial fence is
// usually illustrative, not a reference to this repo's scripts (ADR-0010).
const RUN_RE = /\b(?:npm|pnpm|yarn|bun)\s+run\s+([A-Za-z0-9:_.-]+)/g;

export function extractNpmScripts(doc: DocFile): Claim[] {
  const claims: Claim[] = [];
  for (const hit of eachInlineCode(doc)) {
    RUN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RUN_RE.exec(hit.value)) !== null) {
      const script = m[1];
      if (script === undefined) continue;
      claims.push({
        type: 'npm-script',
        value: script,
        confidence: 'exact',
        source: 'inline-code',
        location: { file: doc.path, line: hit.line, column: hit.column },
      });
    }
  }
  return claims;
}
