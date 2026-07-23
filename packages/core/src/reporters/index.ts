import type { RunResult } from '../domain/types.js';

export function pretty(result: RunResult): string {
  const { filesScanned, claimsChecked } = result.stats;
  if (result.findings.length === 0) {
    return `driftlint: no issues found (${filesScanned} files, ${claimsChecked} claims checked)`;
  }
  const lines = result.findings.map((f) => {
    const { file, line, column } = f.claim.location;
    return `${file}:${line}:${column}  ${f.severity}  ${f.message}  [${f.ruleId}]`;
  });
  lines.push('', `driftlint: ${result.findings.length} issue(s) found`);
  return lines.join('\n');
}

export function json(result: RunResult): string {
  return JSON.stringify(
    { formatVersion: 1, findings: result.findings, stats: result.stats },
    null,
    2,
  );
}

// GitHub Actions workflow-command escaping.
function escapeData(s: string): string {
  return s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
function escapeProp(s: string): string {
  return escapeData(s).replace(/,/g, '%2C').replace(/:/g, '%3A');
}

/**
 * GitHub Actions annotations. Each finding becomes a `::error`/`::warning`
 * workflow command that the runner renders as a PR annotation on the exact line.
 * Empty when there are no findings.
 */
export function github(result: RunResult): string {
  return result.findings
    .map((f) => {
      const level = f.severity === 'error' ? 'error' : 'warning';
      const { file, line, column } = f.claim.location;
      const props = `file=${escapeProp(file)},line=${line},col=${column},title=driftlint ${escapeProp(f.ruleId)}`;
      return `::${level} ${props}::${escapeData(f.message)}`;
    })
    .join('\n');
}
