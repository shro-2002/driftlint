# npm-script-exists fixture

Positive (defined, must not flag): run `npm run build`.

Negative (undefined, must flag): run `npm run deploy`.

<!-- driftlint-ignore-next-line npm-script-exists -->

Suppressed (undefined but silenced): run `pnpm run release`.

Shorthand is not checked, must be ignored: `pnpm build`.

Undefined script in a shell block — must NOT be extracted (inline-only, ADR-0010):

```sh
npm run fenced-only
```
