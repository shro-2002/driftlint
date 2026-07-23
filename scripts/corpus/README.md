# Validation corpus

Reproducible precision-measurement harness (Phase 4C). Runs Rule Set v1 against 100+ real OSS repos and clusters every finding by root cause so false positives can be triaged.

## Usage

```sh
# 1. Clone the corpus into a scratch dir (not committed)
CORPUS=/tmp/driftlint-corpus
mkdir -p "$CORPUS"
while read -r slug; do
  case "$slug" in \#*|'') continue;; esac
  git clone --depth 1 --quiet "https://github.com/$slug.git" "$CORPUS/${slug##*/}" || true
done < scripts/corpus/repos.txt

# 2. Build core, then analyze
pnpm --filter @driftlint/core build
node scripts/corpus/analyze.mjs "$CORPUS"
```

`analyze.mjs` prints per-category counts + examples and writes `summary.json`. Latest results: research/precision/.

- `repos.txt` — the curated repo list (the reproducible definition; clones are never committed).
- `analyze.mjs` — runs driftlint per repo, aggregates findings, auto-categorizes, measures runtime + peak RSS.

Clones are disposable. To make this a CI gate (TD-012), pin commit SHAs and cache the clones.
