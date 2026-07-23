import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'rules', 'file-path-exists');

// Isolate the rule under test so unrelated tokens in the fixture never interfere.
const onlyThisRule: { rules: Record<string, 'off'> } = {
  rules: { 'npm-script-exists': 'off', 'import-path-resolves': 'off' },
};

describe('file-path-exists', () => {
  it('flags a missing path, ignores existing paths, bare names, and URLs', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();

    const values = result.findings.map((f) => f.claim.value);
    expect(values).toContain('src/gone.ts');
    expect(values).not.toContain('src/exists.ts');
    expect(values).not.toContain('exists.ts');
    expect(values.some((v) => v.startsWith('http'))).toBe(false);
  });

  it('respects a driftlint-ignore-next-line suppression', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();

    expect(result.findings.map((f) => f.claim.value)).not.toContain('src/silenced.ts');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe('error');
  });
});
