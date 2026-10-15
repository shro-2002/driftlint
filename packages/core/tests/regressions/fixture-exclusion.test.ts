import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

describe('regression: test-fixture docs are not scanned by default', () => {
  let root = '';
  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('ignores drift inside tests/fixtures but still reports drift elsewhere', async () => {
    root = await mkdtemp(join(tmpdir(), 'driftlint-fixtures-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'tests/fixtures/sample/src'), { recursive: true });
    await writeFile(join(root, 'src/app.ts'), 'export {};\n');
    await writeFile(join(root, 'tests/fixtures/sample/README.md'), 'See `src/missing.ts`.\n');
    await writeFile(join(root, 'README.md'), 'See `src/app.ts` and `src/gone.ts`.\n');

    const result = await (await createDriftlint({ cwd: root })).run();

    expect(result.findings.map((f) => f.claim.location.file)).toEqual(['README.md']);
    expect(result.findings).toHaveLength(1);
  });
});
