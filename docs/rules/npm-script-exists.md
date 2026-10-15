# npm-script-exists

<!-- driftlint-ignore-file -- illustrative examples of drift -->

Flags `npm run <script>` (and `pnpm`/`yarn`/`bun`) references to scripts that are not defined in any package.json.

- **Signal:** the explicit `<pm> run <script>` form in **inline code** (not shell fences — a `npm run build` inside a bash tutorial fence is usually illustrative). Shorthand like `pnpm build` is **not** checked — it is ambiguous with package-manager builtins.
- **Ground truth:** the union of `scripts` keys across every package.json in the workspace (monorepo-aware).
- **Default severity:** `error`.

## Examples

````markdown
Run `npm run build`. <!-- ok if a "build" script exists -->
Run `npm run deploy`. <!-- flagged if no "deploy" script -->
Run `pnpm build`. <!-- shorthand; not checked -->

```sh
npm run test                # checked (shell fence)
```
````

## Suppression

```markdown
<!-- driftlint-ignore-next-line npm-script-exists -- script lives in a submodule -->

Run `npm run integration`.
```

## Performance

O(claims) with O(1) set membership. All package.json files are read once (one glob pass) to build the script-name set.
