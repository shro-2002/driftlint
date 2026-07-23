// Benchmark: generate a synthetic docs tree and time a cold driftlint run.
// Usage: node scripts/bench.mjs [docCount]
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createDriftlint } from '../packages/core/dist/index.js';

const DOC_COUNT = Number(process.argv[2] ?? 1000);
const CLAIMS_PER_DOC = 5;

function docBody(i) {
  // Mix of resolving and drifting claims so rules do real work.
  return [
    `# Doc ${i}`,
    '',
    'See `src/real.ts` and `src/missing-${i}.ts`.',
    'Run `npm run build` and `npm run ghost-${i}`.',
    '',
    '```ts',
    "import _ from 'lodash';",
    `import x from 'ghost-pkg-${i}';`,
    '```',
    '',
  ].join('\n');
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), 'driftlint-bench-'));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src', 'real.ts'), 'export const x = 1;\n');
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ name: 'bench', scripts: { build: 'tsc' }, dependencies: { lodash: '^4' } }),
    );
    for (let i = 0; i < DOC_COUNT; i++) {
      await writeFile(join(root, `doc-${i}.md`), docBody(i));
    }

    const driftlint = await createDriftlint({ cwd: root });
    const t0 = performance.now();
    const result = await driftlint.run();
    const ms = performance.now() - t0;

    console.log(
      JSON.stringify(
        {
          docCount: DOC_COUNT,
          approxClaims: DOC_COUNT * CLAIMS_PER_DOC,
          findings: result.findings.length,
          runMs: Math.round(ms),
          msPerDoc: +(ms / DOC_COUNT).toFixed(3),
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main();
