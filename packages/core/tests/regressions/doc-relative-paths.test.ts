import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'regressions', 'doc-relative-paths');

// Dogfooding driftlint on its own docs surfaced false positives on paths written
// relative to the doc's own directory and on paths into node_modules. Locked in here.
describe('regression: doc-relative and ignored-dir path resolution', () => {
  it('resolves paths relative to the doc, skips ignored dirs, flags only real misses', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const result = await driftlint.run();

    const values = result.findings.map((f) => f.claim.value);
    expect(values).not.toContain('./local.ts'); // resolves via doc-relative path
    expect(values).not.toContain('node_modules/pkg/index.js'); // ignored dir, skipped
    expect(values).toContain('./ghost.ts'); // genuine miss
    expect(result.findings).toHaveLength(1);
  });
});
