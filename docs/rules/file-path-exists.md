# file-path-exists

<!-- driftlint-ignore-file -- illustrative examples of drift -->

Flags inline-code file paths referenced in docs that do not exist in the workspace.

- **Signal:** an inline-code token containing a `/` and a trailing extension (e.g. `` `src/app.ts` ``). Bare names (`` `app.ts` ``) and URLs are ignored — too ambiguous.
- **Ground truth:** the workspace file set (all files except `node_modules`, `.git`).
- **Default severity:** `error`.

## Resolution

A referenced path is considered present if it exists **either** relative to the repo root **or** relative to the doc's own directory. So `` `adr/0000-template.md` `` inside `docs/README.md` resolves to `docs/adr/0000-template.md`.

Two precision guards (corpus-validated, [ADR-0010](../adr/0010-corpus-driven-precision-tightening.md)):

- **Parent-directory guard:** a missing path is flagged only if its parent directory exists in the repo. A reference into a directory the repo doesn't have is treated as illustrative/external (tutorial paths, MIME types like `application/json`, cross-repo references) and skipped.
- **Ignored directories:** paths into `node_modules`, `dist`, `build`, `coverage`, `.git`, `.cache`, `.vscode`, `.idea` are skipped — generated or editor-local, their absence is expected.

## Examples

```markdown
See `src/app.ts`. <!-- ok if the file exists -->
The old `src/gone.ts`. <!-- flagged if missing -->
Run `npm run build`. <!-- not a path; ignored -->
```

## Suppression

```markdown
<!-- driftlint-ignore-next-line file-path-exists -- generated at build time -->

Output goes to `dist/bundle.js`.
```

## Performance

O(claims) with O(1) set membership per claim. The file set is one glob pass built once per run. No per-claim filesystem access.
