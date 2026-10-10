---
name: debug-ci
description: >
  Fix a failing CI check. Use when a pull request check fails, ci.yml fails,
  or scripts/verify.sh fails in GitHub Actions.
---

# Debug CI

1. Read the failing check log and identify the command.
2. Run that command locally. CI's verify job runs `scripts/verify.sh`.
3. Fix the cause. Do not weaken the script to hide a real failure.
4. Re-run `scripts/verify.sh` until it exits 0.
