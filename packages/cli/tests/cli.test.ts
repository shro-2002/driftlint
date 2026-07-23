import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const cliMain = join(repoRoot, 'packages', 'cli', 'dist', 'main.js');
const sampleRepo = join(repoRoot, 'packages', 'core', 'tests', 'fixtures', 'sample-repo');
const cleanDir = join(repoRoot, 'packages', 'core', 'src');
const offConfig = join(here, 'fixtures', 'file-path-off.json');

function run(args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [cliMain, ...args], { encoding: 'utf8' });
  return { code: r.status ?? -1, stdout: r.stdout, stderr: r.stderr };
}

beforeAll(() => {
  if (!existsSync(cliMain)) {
    execSync('pnpm --filter @driftlint/core --filter driftlint build', {
      cwd: repoRoot,
      stdio: 'ignore',
    });
  }
});

describe('driftlint CLI', () => {
  it('exits 0 with no output on a clean directory', () => {
    const { code, stdout } = run(['check', cleanDir, '--reporter', 'github']);
    expect(code).toBe(0);
    expect(stdout.trim()).toBe('');
  });

  it('exits 1 and prints findings on a repo with drift', () => {
    const { code, stdout } = run(['check', sampleRepo]);
    expect(code).toBe(1);
    expect(stdout).toContain('src/missing.ts');
  });

  it('emits GitHub annotations with --reporter github', () => {
    const { code, stdout } = run(['check', sampleRepo, '--reporter', 'github']);
    expect(code).toBe(1);
    expect(stdout).toContain('::error ');
    expect(stdout).toContain('file=README.md');
    expect(stdout).toContain('line=5');
    expect(stdout).toContain('title=driftlint file-path-exists');
  });

  it('emits a versioned JSON envelope with --reporter json', () => {
    const { stdout } = run(['check', sampleRepo, '--reporter', 'json']);
    const parsed = JSON.parse(stdout) as { formatVersion: number; findings: unknown[] };
    expect(parsed.formatVersion).toBe(1);
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  it('applies --config overrides (file-path-exists off -> exit 0)', () => {
    const { code } = run(['check', sampleRepo, '--config', offConfig]);
    expect(code).toBe(0);
  });

  it('exits 2 on an unknown reporter', () => {
    const { code, stderr } = run(['check', sampleRepo, '--reporter', 'nope']);
    expect(code).toBe(2);
    expect(stderr).toContain('Unknown reporter');
  });
});
