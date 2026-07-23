# file-path-exists fixture

Positive (exists, must not flag): `src/exists.ts`.

Negative (missing, must flag): `src/gone.ts`.

<!-- driftlint-ignore-next-line file-path-exists -->

Suppressed (missing but silenced): `src/silenced.ts`.

Not a path, must be ignored: `exists.ts`, `npm run build`, and the URL
`https://example.com/docs/guide.html`.
