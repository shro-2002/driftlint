# driftlint

<!-- driftlint-ignore-file -- README shows illustrative examples of drift -->

**Deterministic linter that fails CI when your documentation drifts from your code.**

Your README says `` `src/app.ts` ``, but you moved it. Your docs say `` `npm run build` ``, but you renamed the script. Your `AGENTS.md` points an AI agent at a file that no longer exists. Nothing fails — until a human or an agent follows the stale doc and wastes an afternoon.

driftlint catches that drift. It verifies that the file paths, npm scripts, and imports your docs reference still exist in the codebase. **No AI, no network, no config to start** — the same repo state always produces the same findings, so it's safe to gate CI on.

> **Status: v0.1.0-alpha.** Public alpha. Rule Set v1 is stable; more rules and surfaces are on the roadmap.

## Install

```sh
npx driftlint@alpha check          # zero-install, one-off
npm install -g driftlint@alpha     # or install the CLI
```

Requires Node.js ≥ 22.

## Quick start

```sh
driftlint check           # scan the current directory
```

Example output:

```text
README.md:12:9   error  Referenced file "src/app.ts" does not exist in the workspace.  [file-path-exists]
docs/setup.md:4:14  error  npm script "bootstrap" is not defined in any package.json in the workspace.  [npm-script-exists]

driftlint: 2 issue(s) found
```

Exit codes: `0` clean · `1` error-severity findings · `2` tool error.

## Use it in CI (GitHub Action)

```yaml
# .github/workflows/docs.yml
name: Docs
on: [pull_request]
permissions:
  contents: read
jobs:
  driftlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shro-2002/driftlint/packages/action@v0.1.0-alpha.0
        with:
          path: .
```

Findings appear as inline PR annotations on the exact line:

```text
::error file=README.md,line=12,col=9,title=driftlint file-path-exists::Referenced file "src/app.ts" does not exist in the workspace.
```

Full Action reference: [packages/action/README.md](packages/action/README.md).

## Rules

| Rule                                                         | Catches                                                      | Default      |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------ |
| [`file-path-exists`](docs/rules/file-path-exists.md)         | inline-code paths that don't exist (parent dir must exist)   | error        |
| [`npm-script-exists`](docs/rules/npm-script-exists.md)       | inline `npm/pnpm/yarn/bun run <script>` not defined anywhere | error        |
| [`import-path-resolves`](docs/rules/import-path-resolves.md) | bare imports in JS/TS fences that aren't declared deps       | off (opt-in) |

driftlint scans `**/*.md`, `**/*.mdx`, and agent files (`CLAUDE.md`, `AGENTS.md`). Rule reference: [docs/rules/](docs/rules/README.md).

**Precision:** validated across 122 real OSS repos to a **0.37% false-positive rate** (report). driftlint prefers a missed finding to a false alarm.

## Suppressing findings

```markdown
<!-- driftlint-ignore-next-line file-path-exists -- generated at build time -->

Output goes to `dist/bundle.js`.

<!-- driftlint-ignore-file import-path-resolves -->
```

## Configuration

Pass a JSON config to change severities or enable the opt-in rule:

```jsonc
// driftlint.config.json
{
  "rules": {
    "import-path-resolves": "warn",
    "npm-script-exists": "off",
  },
}
```

```sh
driftlint check . --config driftlint.config.json
```

Zero-config auto-discovery is coming; today the config is passed explicitly.

## Troubleshooting

| Symptom                                                   | Cause / fix                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A path in a tutorial is flagged, but it's just an example | It sits under a directory your repo also has. Suppress the line, or exclude the tutorial docs. driftlint skips paths whose parent directory doesn't exist.                     |
| An import in a README is flagged                          | `import-path-resolves` is **off by default** for this reason; if you enabled it, integration examples that import non-dependencies will flag — keep it off for public READMEs. |
| `npm run …` in a fenced shell block isn't checked         | By design — only **inline** `` `npm run …` `` is checked; fenced shell commands are usually illustrative.                                                                      |
| Path written relative to the doc isn't found              | driftlint resolves paths relative to the repo root **and** the doc's own directory; if neither exists it's flagged.                                                            |
| Exit code 2                                               | A tool error (e.g. unreadable file), not a finding. Check stderr.                                                                                                              |

## How it works

`discovery → markdown parse (remark) → claim extraction → workspace index → rules → findings`. Rules read the repo only through a read-only index and never execute your code (architecture, ADR-0006).

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report vulnerabilities per [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
