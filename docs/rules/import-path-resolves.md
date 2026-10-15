# import-path-resolves

<!-- driftlint-ignore-file -- illustrative examples of drift -->

Flags bare/package import specifiers in JS/TS code fences that are not declared dependencies.

- **Signal:** `import`/`export … from`/`require()`/dynamic `import()` syntax in a JS/TS fenced block (`ts`, `tsx`, `js`, `jsx`, `mjs`, `cjs`, `mts`, `cts`, `javascript`, `typescript`). The syntax makes it unambiguous that the string is a module specifier.
- **Ground truth:** declared dependencies (`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`) ∪ workspace package names ∪ Node builtins.
- **Default: `off` (opt-in).** Corpus runs showed public READMEs routinely import packages the project doesn't depend on (integration examples), which is indistinguishable from drift in a static snapshot. Enable it (`"import-path-resolves": "warn"`) for internal docs that should only reference real dependencies. When enabled it flags at `warn`.
- **Skips URL/protocol specifiers** (`https:`, `file:`, `npm:`, `jsr:`, `data:`) — Deno/CDN imports are not npm packages.

## What is checked

- **Bare specifiers** (`lodash`, `@scope/pkg`, `pkg/subpath`) → resolved to their package name and checked against declared dependencies.
- **Node builtins** (`node:fs`, `fs`) → always allowed.
- **Relative specifiers** (`./util`, `../lib`) → **skipped**. A doc has no deterministic base directory to resolve them against.

## Examples

````markdown
```ts
import _ from 'lodash'; // ok if lodash is a dependency
import x from 'ghost-pkg'; // flagged if not declared
import y from './local'; // relative; skipped
import { readFile } from 'node:fs'; // builtin; ok
```
````

## Suppression

Claims inside fences are suppressed at file level (a comment cannot live inside a fence):

```markdown
<!-- driftlint-ignore-file import-path-resolves -->
```

## Performance

O(claims) with O(1) set membership. Package manifests are read once. Specifier → package-name reduction is a single string split.
