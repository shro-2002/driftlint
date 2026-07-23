import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'rules', 'npm-script-exists');

const onlyThisRule: { rules: Record<string, 'off'> } = {
  rules: { 'file-path-exists': 'off', 'import-path-resolves': 'off' },
};

describe('npm-script-exists', () => {
  it('flags an undefined script, ignores defined ones and shorthand', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();

    const values = result.findings.map((f) => f.claim.value);
    expect(values).toContain('deploy');
    expect(values).not.toContain('build'); // defined inline and in a shell block
    expect(values).not.toContain('release'); // undefined but suppressed
  });

  it('extracts from inline code only, not shell fences (ADR-0010)', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();
    // Only the inline `npm run deploy` survives; the fenced script is not extracted.
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].claim.value).toBe('deploy');
  });
});
