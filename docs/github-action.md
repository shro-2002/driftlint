# GitHub Action

driftlint ships as a composite GitHub Action that wraps the CLI. Full reference and inputs: [packages/action/README.md](../packages/action/README.md).

Quick start:

```yaml
- uses: actions/checkout@v4
- uses: shro-2002/driftlint/packages/action@main # pin a commit SHA in real use
  with:
    path: .
```

The Action is intentionally thin — it runs `driftlint check` and lets the CLI's exit code and the `github` reporter's workflow commands do the rest. Everything the Action can do, the CLI can do; the Action adds no behavior of its own.

CI verifies the Action end-to-end on Ubuntu, macOS, and Windows (`.github/workflows/ci.yml`, `action` job): a clean directory passes, a directory with drift fails.
