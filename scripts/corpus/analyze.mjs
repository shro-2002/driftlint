// Run driftlint across the cloned corpus, aggregate findings, and auto-cluster
// every finding by a root-cause category so false positives can be triaged.
// Usage: node scripts/corpus/analyze.mjs <corpusDir>
import { readdir, writeFile } from 'node:fs/promises';
import { join, basename, posix, sep } from 'node:path';

import { createDriftlint } from '../../packages/core/dist/index.js';

const corpusDir = process.argv[2];
if (!corpusDir) {
  console.error('usage: node scripts/corpus/analyze.mjs <corpusDir>');
  process.exit(1);
}

const PLACEHOLDER_RE = /[{}$<>*[\]|`]/;

function stripDotSlash(p) {
  return p.startsWith('./') ? p.slice(2) : p;
}
function candidatePaths(value, docFile) {
  const rootRel = stripDotSlash(value.replace(/^\/+/, ''));
  const dir = posix.dirname(docFile);
  const docRel = stripDotSlash(posix.normalize(posix.join(dir === '.' ? '' : dir, value)));
  return [rootRel, docRel];
}

async function repoFileIndex(root) {
  const all = await readdir(root, { recursive: true, withFileTypes: true });
  const entries = [];
  for (const d of all) {
    if (!d.isFile()) continue;
    const rel = posix.normalize(
      join(d.parentPath ?? d.path, d.name)
        .slice(root.length + 1)
        .split(sep)
        .join('/'),
    );
    if (rel.includes('node_modules/') || rel.startsWith('.git/')) continue;
    entries.push(rel);
  }
  const exact = new Set(entries);
  const lower = new Set(entries.map((e) => e.toLowerCase()));
  const base = new Set(entries.map((e) => basename(e).toLowerCase()));
  return { exact, lower, base };
}

function categorizeFilePath(value, docFile, idx) {
  const cands = candidatePaths(value, docFile);
  if (PLACEHOLDER_RE.test(value)) return 'file:placeholder-or-glob';
  if (value.endsWith('/')) return 'file:directory-ref';
  if (cands.some((c) => idx.lower.has(c.toLowerCase()))) return 'file:case-mismatch';
  if (idx.base.has(basename(value).toLowerCase())) return 'file:exists-elsewhere';
  return 'file:genuine-or-unknown';
}
function categorizeScript(value) {
  if (PLACEHOLDER_RE.test(value)) return 'script:placeholder';
  return 'script:not-found';
}
function categorizeImport(value) {
  if (/[!?:]/.test(value.replace(/^node:/, '')) || /^[^a-zA-Z@.]/.test(value))
    return 'import:special-specifier';
  return 'import:undeclared';
}

function categorize(finding, docFile, idx) {
  if (finding.ruleId === 'file-path-exists')
    return categorizeFilePath(finding.claim.value, docFile, idx);
  if (finding.ruleId === 'npm-script-exists') return categorizeScript(finding.claim.value);
  return categorizeImport(finding.claim.value);
}

async function main() {
  const dirs = (await readdir(corpusDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const categories = new Map(); // cat -> { count, examples[] }
  const perRepo = [];
  let totalFindings = 0;
  let totalFiles = 0;
  let totalClaims = 0;
  let totalMs = 0;
  let maxRssMb = 0;
  let analyzed = 0;

  for (const name of dirs) {
    const root = join(corpusDir, name);
    let result;
    try {
      const idx = await repoFileIndex(root);
      const driftlint = await createDriftlint({ cwd: root });
      const t0 = performance.now();
      result = await driftlint.run();
      const ms = performance.now() - t0;
      analyzed++;
      totalMs += ms;
      totalFindings += result.findings.length;
      totalFiles += result.stats.filesScanned;
      totalClaims += result.stats.claimsChecked;
      maxRssMb = Math.max(maxRssMb, process.memoryUsage().rss / 1024 / 1024);

      perRepo.push({
        repo: name,
        findings: result.findings.length,
        docs: result.stats.filesScanned,
        claims: result.stats.claimsChecked,
        ms: Math.round(ms),
      });

      for (const f of result.findings) {
        const cat = categorize(f, f.claim.location.file, idx);
        const entry = categories.get(cat) ?? { count: 0, examples: [] };
        entry.count++;
        if (entry.examples.length < 8) {
          entry.examples.push(
            `${name}/${f.claim.location.file}:${f.claim.location.line} "${f.claim.value}"`,
          );
        }
        categories.set(cat, entry);
      }
    } catch (err) {
      perRepo.push({ repo: name, error: String(err.message ?? err) });
    }
  }

  const catSummary = [...categories.entries()]
    .map(([cat, v]) => ({ category: cat, count: v.count, examples: v.examples }))
    .sort((a, b) => b.count - a.count);

  const summary = {
    reposAnalyzed: analyzed,
    totalDocs: totalFiles,
    totalClaims: totalClaims,
    totalFindings,
    findingsPerRepo: +(totalFindings / analyzed).toFixed(2),
    totalRuntimeMs: Math.round(totalMs),
    msPerRepo: +(totalMs / analyzed).toFixed(1),
    maxRssMb: Math.round(maxRssMb),
    categories: catSummary,
  };

  await writeFile(join(corpusDir, 'summary.json'), JSON.stringify({ summary, perRepo }, null, 2));

  console.log(`repos analyzed: ${analyzed}`);
  console.log(
    `docs: ${totalFiles}  claims: ${totalClaims}  findings: ${totalFindings} (${summary.findingsPerRepo}/repo)`,
  );
  console.log(
    `runtime: ${summary.totalRuntimeMs}ms total, ${summary.msPerRepo}ms/repo  maxRSS: ${summary.maxRssMb}MB`,
  );
  console.log('\ncategory                         count');
  for (const c of catSummary) console.log(`${c.category.padEnd(32)} ${c.count}`);
  console.log('\n--- examples per category ---');
  for (const c of catSummary) {
    console.log(`\n[${c.category}] (${c.count})`);
    for (const ex of c.examples) console.log('  ' + ex);
  }
}

main();
