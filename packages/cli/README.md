# driftlint

<!-- driftlint-ignore-file -- usage examples reference paths in the consumer repo -->

> Deterministic linter that fails CI when your docs drift from your code.

driftlint checks that the file paths, npm scripts, and imports your documentation references still exist in your codebase. No AI, no network, no config to start — same repo state always gives the same result.

```sh
npx driftlint check
```

> **Alpha:** `npm install -g driftlint@alpha` or `npx driftlint@alpha`.

## What it catches

- **file-path-exists** — an inline-code path like `` `src/app.ts` `` that no longer exists.
- **npm-script-exists** — `` `npm run build` `` referencing a script not in any `package.json`.
- **import-path-resolves** (opt-in) — a bare import in a fenced code block that isn't a declared dependency.

It reads README, `docs/`, and agent files (`CLAUDE.md`, `AGENTS.md`). Validated to a 0.37% false-positive rate across 122 real repositories.

## Usage

```sh
driftlint check [path]            # scan a directory (default: .)
driftlint check . --reporter github   # GitHub Actions annotations
driftlint check . --reporter json     # machine-readable
driftlint check . --config driftlint.config.json
```

Exit codes: `0` clean, `1` error-severity findings, `2` tool error.

Suppress a finding with a markdown comment:

```markdown
<!-- driftlint-ignore-next-line file-path-exists -- generated at build time -->

Output goes to `dist/bundle.js`.
```

Full documentation, rules, and the GitHub Action: **https://github.com/shro-2002/driftlint**.

MIT licensed.
