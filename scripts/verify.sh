#!/usr/bin/env bash
# Completion gate for agents and CI. Extend this script with lint and tests
# once the repo has a language toolchain. Keep this file as the single command
# AGENTS.md and CI both run.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

required=(
  AGENTS.md
  README.md
  CLAUDE.md
  docs/adr/README.md
  docs/adr/template.md
  docs/plans/CURRENT.md
)

for file in "${required[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "verify: missing or empty: $file" >&2
    exit 1
  fi
done

index="docs/adr/README.md"
shopt -s nullglob
adr_files=(docs/adr/[0-9][0-9][0-9][0-9]-*.md)
for adr in "${adr_files[@]}"; do
  base="$(basename "$adr")"
  if ! grep -q "$base" "$index"; then
    echo "verify: $base is not listed in $index" >&2
    exit 1
  fi
done

echo "verify: python"
if command -v python3 >/dev/null 2>&1; then
  python3 -m venv .venv >/dev/null 2>&1 || true
  .venv/bin/pip install -q -e '.[dev]' >/dev/null 2>&1 || pip install -q -e '.[dev]'
  .venv/bin/python -m pytest -q || python3 -m pytest -q
else
  echo "verify: python3 not found" >&2
  exit 1
fi

echo "verify: agent"
if command -v node >/dev/null 2>&1; then
  node --check agent/index.mjs
else
  echo "verify: node not found" >&2
  exit 1
fi

echo "verify: ok"
