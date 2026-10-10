---
name: open-pr
description: >
  Open a pull request for a finished task. Use when the user asks to commit,
  push, or open a PR after scripts/verify.sh passes.
---

# Open a pull request

1. Confirm `scripts/verify.sh` exits 0.
2. Branch from the default branch as `TASK-NNN/short-description` when the work is not already on that branch.
3. Commit with `type: [TASK-NNN]: why`.
4. Push the branch and open a pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
5. Fill in the task link, the verify result, and any risk on `docs/adr/` or `.github/` paths.
