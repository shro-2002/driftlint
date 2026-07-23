import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint } from '../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'rules', 'import-path-resolves');

// import-path-resolves is off by default (ADR-0010); enable it explicitly here.
const onlyThisRule: { rules: Record<string, 'off' | 'warn'> } = {
  rules: { 'file-path-exists': 'off', 'npm-script-exists': 'off', 'import-path-resolves': 'warn' },
};

describe('import-path-resolves', () => {
  it('flags undeclared packages; ignores deps, builtins, own name, and relative paths', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();

    const messages = result.findings.map((f) => f.message);
    expect(messages).toContain('Imported package "ghost-package" is not a declared dependency.');
    // lodash (dep), node:fs (builtin), import-fixture (own), ./local (relative) all silent.
    expect(result.findings.every((f) => f.claim.value !== 'lodash')).toBe(true);
    expect(result.findings.every((f) => f.claim.value !== 'node:fs')).toBe(true);
    expect(result.findings.every((f) => f.claim.value !== './local')).toBe(true);
  });

  it('defaults to warn severity and honors file-level suppression', async () => {
    const driftlint = await createDriftlint({ cwd: fixture, config: onlyThisRule });
    const result = await driftlint.run();

    expect(result.findings).toHaveLength(1); // suppressed.md contributes nothing
    expect(result.findings[0].severity).toBe('warn');
    expect(result.findings.map((f) => f.claim.value)).not.toContain('another-ghost-package');
  });
});
