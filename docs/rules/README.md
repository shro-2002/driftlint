# Rules

<!-- driftlint-ignore-file -- illustrative examples of drift -->

driftlint ships three deterministic rules in v1. Each has a **strong signal** (it is unambiguous that the token is the kind of thing the rule checks) and **exact ground truth** (a definitive source to check against). Rules never execute repo code and read the repo only through the workspace index.

| Rule                                            | Checks                                         | Ground truth           | Default          |
| ----------------------------------------------- | ---------------------------------------------- | ---------------------- | ---------------- |
| [file-path-exists](file-path-exists.md)         | inline-code file paths (parent dir must exist) | workspace file set     | error            |
| [npm-script-exists](npm-script-exists.md)       | inline `<pm> run <script>`                     | package.json `scripts` | error            |
| [import-path-resolves](import-path-resolves.md) | bare imports in JS/TS fences                   | declared dependencies  | **off** (opt-in) |

Defaults were tightened after running the rules over a corpus of real repositories ([harness](../../scripts/corpus/README.md)); a precision report has not been published yet. `import-path-resolves` is opt-in because public READMEs routinely import packages the project doesn't depend on.

Three planned rules — `symbol-exists`, `env-var-declared`, `cli-flag-exists` — are **deferred** because they cannot meet the precision bar deterministically today.

## Severity

Configure per rule: `"off" | "warn" | "error"`. Exit code is `1` only when an `error`-severity finding is present; `warn` findings report but exit `0`.

## Suppression

Two forms, both written as markdown comments in prose (never inside a code fence):

```markdown
<!-- driftlint-ignore-next-line file-path-exists -- reason -->

The `src/generated.ts` file is created at build time.

<!-- driftlint-ignore-file import-path-resolves -->
```

Omitting rule ids suppresses all rules for the scope. `-next-line` targets the next block; `-file` targets the whole file (the only way to suppress a claim inside a code fence).
