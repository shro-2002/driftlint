import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'regressions', 'corpus-precision');

describe('regression: corpus-derived precision fixes (ADR-0010)', () => {
  it('default config flags only real misses; skips illustrative paths, MIME types, and fenced scripts', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const result = await driftlint.run();
    const values = result.findings.map((f) => f.claim.value).sort();

    // file-path: parent-dir guard skips illustrative + MIME; real miss flags.
    expect(values).not.toContain('reducers/todos.js');
    expect(values).not.toContain('application/x-amz-json-1.1');
    expect(values).not.toContain('.vscode/launch.json'); // editor-local, ignored
    expect(values).toContain('src/missing.ts');
    // npm-script: inline flags, shell fence does not.
    expect(values).toContain('ghost-inline');
    expect(values).not.toContain('ghost-fence');
    // import-path is off by default: no import findings at all.
    expect(values).not.toContain('ghost-pkg');
    expect(values).toEqual(['ghost-inline', 'src/missing.ts']);
  });

  it('opt-in import-path-resolves skips URL specifiers, flags undeclared packages', async () => {
    const driftlint = await createDriftlint({
      cwd: fixture,
      config: {
        rules: {
          'file-path-exists': 'off',
          'npm-script-exists': 'off',
          'import-path-resolves': 'warn',
        },
      },
    });
    const result = await driftlint.run();
    const values = result.findings.map((f) => f.claim.value);

    expect(values).toContain('ghost-pkg');
    expect(values).not.toContain('lodash'); // declared dependency
    expect(values).not.toContain('https://esm.sh/ky'); // URL specifier skipped
  });
});
