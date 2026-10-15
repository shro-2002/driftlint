# Driftlint GitHub Action

<!-- driftlint-ignore-file -- usage examples reference paths in the consumer repo -->

Run [driftlint](../../docs/rules/README.md) in CI and get inline PR annotations when documentation drifts from code. A thin composite action that invokes the `driftlint` CLI only. It builds the CLI from this repository on the runner, so it does not depend on an npm package; no verification logic lives in the Action.

## Usage

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
      - uses: shro-2002/driftlint/packages/action@main # pin a commit SHA in real use
        with:
          path: .
```

Findings render as annotations on the exact lines. The job fails when any `error`-severity finding is present (exit code 1), matching the CLI.

## Inputs

| Input           | Default                  | Description                                                                                  |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `path`          | `.`                      | Directory to scan.                                                                           |
| `config`        | `''`                     | Path to a driftlint config JSON (optional).                                                  |
| `reporter`      | `github`                 | `github` (annotations), `pretty`, or `json`.                                                 |
| `driftlint-cmd` | `''` (build from source) | Optional command prefix that runs the CLI instead, e.g. a pinned npm version once published. |

## Behavior

- **Annotations:** with `reporter: github` (default), each finding becomes a `::error`/`::warning` workflow command.
- **Exit codes:** `0` clean, `1` error-severity findings, `2` tool error — identical to the CLI.
- **Runners:** written for `bash` on Ubuntu and macOS runners; Windows has not been verified.

## Security

Inputs are passed through environment variables, never interpolated into the shell script, to avoid workflow-command injection. The action requires only `contents: read`.
