# Rules

<!-- driftlint-ignore-file -- illustrative examples of drift -->

driftlint ships three deterministic rules in v1. Each has a **strong signal** (it is unambiguous that the token is the kind of thing the rule checks) and **exact ground truth** (a definitive source to check against). Rules never execute repo code and read the repo only through the workspace index (ADR-0002, ADR-0006).

| Rule                                            | Checks                                         | Ground truth           | Default          |
| ----------------------------------------------- | ---------------------------------------------- | ---------------------- | ---------------- |
| [file-path-exists](file-path-exists.md)         | inline-code file paths (parent dir must exist) | workspace file set     | error            |
| [npm-script-exists](npm-script-exists.md)       | inline `<pm> run <script>`                     | package.json `scripts` | error            |
| [import-path-resolves](import-path-resolves.md) | bare imports in JS/TS fences                   | declared dependencies  | **off** (opt-in) |

Defaults are corpus-validated for precision ([ADR-0010](../adr/0010-corpus-driven-precision-tightening.md), precision report): a 0.37% false-positive rate across 122 real repos. `import-path-resolves` is opt-in because public READMEs routinely import packages the project doesn't depend on.

Three planned rules — `symbol-exists`, `env-var-declared`, `cli-flag-exists` — are **deferred** because they cannot meet the precision bar deterministically today. See [ADR-0008](../adr/0008-rule-set-v1-precision-scope.md) for each rule's specific blocker.

## Severity

Configure per rule: `"off" | "warn" | "error"`. Exit code is `1` only when an `error`-severity finding is present; `warn` findings report but exit `0`.

## Suppression

See [ADR-0009](../adr/0009-suppression-model.md). Two forms, both written as markdown comments in prose (never inside a code fence):

```markdown
<!-- driftlint-ignore-next-line file-path-exists -- reason -->

The `src/generated.ts` file is created at build time.

<!-- driftlint-ignore-file import-path-resolves -->
```

Omitting rule ids suppresses all rules for the scope. `-next-line` targets the next block; `-file` targets the whole file (the only way to suppress a claim inside a code fence).
