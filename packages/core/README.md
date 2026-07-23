# @driftlint/core

Deterministic doc-vs-code drift engine. Every driftlint surface (CLI, VS Code, MCP, GitHub Action) is a thin adapter over this package (ADR-0001).

> **Status: Rule Set v1 (Phase 4B).** Three deterministic rules. See [docs/rules/](../../docs/rules/README.md).

## Programmatic usage

```ts
import { createDriftlint, pretty } from '@driftlint/core';

const driftlint = await createDriftlint({ cwd: process.cwd() });
const result = await driftlint.run();
console.log(pretty(result));
```

`result` is a `RunResult`: `{ findings, stats }`. Findings are sorted by `(file, line, column, ruleId)` — the same repo state always yields byte-identical findings (ADR-0006, D-014).

## Pipeline

`discovery → parser (remark/mdast) → extractors → workspace-index → rules → findings`

Rules read the repository only through `WorkspaceIndex`; they never touch the filesystem or network (ADR-0002). The engine never executes the scanned repo's code (ADR-0006).

## Rules

- **`file-path-exists`** — inline-code file paths that don't exist in the workspace.
- **`npm-script-exists`** — `npm|pnpm|yarn|bun run <script>` references to undefined scripts.
- **`import-path-resolves`** — bare imports in JS/TS fences that aren't declared dependencies.

Suppress with `<!-- driftlint-ignore-next-line <ruleId> -->` or `<!-- driftlint-ignore-file <ruleId> -->`.
