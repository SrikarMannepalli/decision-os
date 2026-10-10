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

echo "verify: ok"
