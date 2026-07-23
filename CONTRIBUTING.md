# Contributing

Thanks for considering a contribution. This project optimizes for low maintenance, so the bar for added complexity is deliberately high.

## Setup

```sh
corepack enable
pnpm install
pnpm lint
pnpm test
```

Node.js >= 22 required (`.nvmrc`).

## Workflow

1. Open an issue before non-trivial changes; agree on the approach first.
2. Branch from `main`: `feature/short-description`, `fix/short-description`, etc.
3. Keep PRs under ~400 lines of diff and focused on one concern.
4. Write or update tests for any changed logic. Coverage must not decrease.
5. Run `pnpm lint && pnpm test` before pushing.
6. Fill in the PR template, including a test plan.

## Commit messages

Conventional commits: `type(scope): subject`

- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
- Imperative mood, lowercase, no trailing period, ≤ 72 chars
- Body explains _why_, not _what_
- Reference issues: `Closes #123`

## Code standards

- TypeScript, strict mode. No `any` without a comment justifying it.
- Prettier formats, ESLint lints — both run in CI; don't hand-format.
- One exported concept per file; keep files under ~300 lines.
- Core logic lives in `packages/core`; distribution packages stay thin.
- No new runtime dependencies without justification in the PR description.

## What gets merged

- CI green (lint, typecheck, tests).
- At least one maintainer approval.
- No unresolved review comments.
- Squash merge; branch deleted after merge.

## What likely won't get merged

- Features requiring servers, accounts, or recurring operations.
- Dependencies duplicating stdlib or existing functionality.
- Speculative abstractions ("we might need this later").

## Questions

Open a discussion or issue. Response time target: within a few business days (solo maintainer).
