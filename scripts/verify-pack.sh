#!/usr/bin/env bash
# Clean-machine install simulation: pack the publishable packages, then `npm
# install` them into a fresh consumer project (deps resolved from the registry,
# cli -> core via a file override) and run the CLI. Verifies the published
# artifacts install and work end to end. Requires network access to npm.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$ROOT"
pnpm --filter @driftlint/core build >/dev/null
pnpm --filter driftlint build >/dev/null

( cd "$WORK" && npm pack "$ROOT/packages/core" --silent >/dev/null && npm pack "$ROOT/packages/cli" --silent >/dev/null )
CORE_TGZ="$(cd "$WORK" && ls driftlint-core-*.tgz)"
CLI_TGZ="$(cd "$WORK" && ls driftlint-0*.tgz)"

echo "== packaged cli contents =="
tar -tzf "$WORK/$CLI_TGZ" | sed 's#^package/##' | sort

CONSUMER="$WORK/consumer"
mkdir -p "$CONSUMER"
cat >"$CONSUMER/package.json" <<JSON
{
  "name": "consumer",
  "private": true,
  "dependencies": { "driftlint": "file:../$CLI_TGZ" },
  "overrides": { "@driftlint/core": "file:../$CORE_TGZ" }
}
JSON

echo "== npm install from tarballs =="
( cd "$CONSUMER" && npm install --silent --no-audit --no-fund )

# Clean doc (no drift) -> exit 0
printf '# Clean\n\nNothing to reference.\n' >"$CONSUMER/README.md"
set +e
( cd "$CONSUMER" && npx driftlint check . >/dev/null 2>&1 ); CLEAN=$?
set -e
echo "clean run exit=$CLEAN"; test "$CLEAN" -eq 0

# Doc with drift -> exit 1 + reports the missing path.
# src/ must exist for the parent-directory guard to check src/missing.ts.
mkdir -p "$CONSUMER/src"
printf 'export const real = true;\n' >"$CONSUMER/src/real.ts"
printf '# Demo\n\nSee `src/missing.ts`.\n' >"$CONSUMER/README.md"
set +e
OUT="$(cd "$CONSUMER" && npx driftlint check .)"; DRIFT=$?
set -e
echo "drift run exit=$DRIFT"
echo "$OUT"
test "$DRIFT" -eq 1
echo "$OUT" | grep -q "src/missing.ts"
echo "OK: installed CLI runs clean (0) and reports drift (1) from a registry install"
