import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createDriftlint, pretty } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, 'fixtures', 'sample-repo');

describe('walking skeleton end-to-end', () => {
  it('flags the missing file reference and ignores the existing one', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const result = await driftlint.run();

    expect(result.findings).toHaveLength(1);
    const [finding] = result.findings;
    expect(finding.ruleId).toBe('file-path-exists');
    expect(finding.claim.value).toBe('src/missing.ts');
    expect(finding.severity).toBe('error');
    expect(finding.claim.location.file).toBe('README.md');
  });

  it('does not flag the existing path, the URL, or the bare prose mention', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const result = await driftlint.run();

    const values = result.findings.map((f) => f.claim.value);
    expect(values).not.toContain('src/app.ts');
    expect(values).not.toContain('app.ts');
    expect(values.some((v) => v.startsWith('http'))).toBe(false);
  });

  it('is deterministic across runs', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const a = await driftlint.run();
    const b = await driftlint.run();
    expect(a.findings).toEqual(b.findings);
  });

  it('renders a stable pretty report', async () => {
    const driftlint = await createDriftlint({ cwd: fixture });
    const result = await driftlint.run();
    expect(pretty(result)).toContain('src/missing.ts');
    expect(pretty(result)).toContain('[file-path-exists]');
  });
});
