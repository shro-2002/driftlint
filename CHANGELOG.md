# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.0] - 2026-07-23

First public alpha of driftlint — a deterministic linter that catches documentation drifting from code.

### Added

- **Engine + `driftlint` CLI** — `driftlint check [path]` with `--reporter pretty|json|github` and `--config <file>`; exit codes `0` clean / `1` error findings / `2` tool error.
- **Rule Set v1** — three deterministic rules:
  - `file-path-exists` — inline-code file paths that no longer exist (parent directory must exist).
  - `npm-script-exists` — inline `npm/pnpm/yarn/bun run <script>` not defined in any `package.json`.
  - `import-path-resolves` — bare imports in JS/TS fences that are not declared dependencies (opt-in, off by default).
- **Suppression directives** — `driftlint-ignore-next-line` and `driftlint-ignore-file` markdown comments.
- **GitHub Action** — composite action wrapping the CLI; emits inline PR annotations; verified on Ubuntu, macOS, and Windows.
- **Precision** — validated to a 0.37% false-positive rate across 122 real-world repositories.

Rules read the repository only through a read-only index and never execute your code; runs are deterministic and offline.
