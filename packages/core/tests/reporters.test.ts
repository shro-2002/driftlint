import { describe, expect, it } from 'vitest';

import { github, json, pretty } from '../src/index.js';

import type { RunResult } from '../src/index.js';

const empty: RunResult = {
  findings: [],
  stats: { filesScanned: 3, claimsChecked: 7, durationMs: 0 },
};

const withFinding: RunResult = {
  findings: [
    {
      ruleId: 'file-path-exists',
      severity: 'error',
      message: 'Referenced file "src/gone.ts" does not exist in the workspace.',
      claim: {
        type: 'file-path',
        value: 'src/gone.ts',
        confidence: 'exact',
        source: 'inline-code',
        location: { file: 'README.md', line: 5, column: 9 },
      },
    },
  ],
  stats: { filesScanned: 1, claimsChecked: 2, durationMs: 0 },
};

describe('reporters', () => {
  it('pretty reports a clean run', () => {
    expect(pretty(empty)).toContain('no issues found');
  });

  it('pretty reports a finding with location and rule id', () => {
    const out = pretty(withFinding);
    expect(out).toContain('README.md:5:9');
    expect(out).toContain('[file-path-exists]');
    expect(out).toContain('1 issue(s) found');
  });

  it('json emits a stable, versioned envelope', () => {
    const parsed = JSON.parse(json(withFinding)) as {
      formatVersion: number;
      findings: unknown[];
    };
    expect(parsed.formatVersion).toBe(1);
    expect(parsed.findings).toHaveLength(1);
  });

  it('github emits a workflow-command annotation; empty on a clean run', () => {
    expect(github(empty)).toBe('');
    const out = github(withFinding);
    expect(out).toBe(
      '::error file=README.md,line=5,col=9,title=driftlint file-path-exists::' +
        'Referenced file "src/gone.ts" does not exist in the workspace.',
    );
  });
});
