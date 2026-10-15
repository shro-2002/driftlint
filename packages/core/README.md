# @driftlint/core

Deterministic doc-vs-code drift engine. The CLI and the GitHub Action are thin adapters over this package.

> **Status: Rule Set v1 (Phase 4B).** Three deterministic rules. See [docs/rules/](../../docs/rules/README.md).

## Programmatic usage

```ts
import { createDriftlint, pretty } from '@driftlint/core';

const driftlint = await createDriftlint({ cwd: process.cwd() });
const result = await driftlint.run();
console.log(pretty(result));
```

`result` is a `RunResult`: `{ findings, stats }`. Findings are sorted by `(file, line, column, ruleId)` — the same repo state always yields byte-identical findings.

## Pipeline

`discovery → parser (remark/mdast) → extractors → workspace-index → rules → findings`

Rules read the repository only through `WorkspaceIndex`; they never touch the filesystem or network. The engine never executes the scanned repo's code.

## Rules

- **`file-path-exists`** — inline-code file paths that don't exist in the workspace.
- **`npm-script-exists`** — `npm|pnpm|yarn|bun run <script>` references to undefined scripts.
- **`import-path-resolves`** — bare imports in JS/TS fences that aren't declared dependencies.

Suppress with `<!-- driftlint-ignore-next-line <ruleId> -->` or `<!-- driftlint-ignore-file <ruleId> -->`.
