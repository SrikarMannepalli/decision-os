---
name: implement-task
description: >
  Implement one task file from docs/plans/tasks. Use when the user asks to
  start work, pick up the current task, or implement TASK-NNN.
---

# Implement a task

1. Read `docs/plans/CURRENT.md` and the task file it names.
2. Read `docs/adr/README.md`. Open an ADR only when this task touches that decision.
3. Read the product and design docs linked from the task.
4. Implement only the acceptance criteria. Leave out-of-scope items unchanged.
5. Add or update tests for the behavior you changed.
6. Run `scripts/verify.sh` and fix failures until it exits 0.
7. Check off the acceptance criteria in the task file.
8. Update `docs/plans/CURRENT.md` with anything the next session must know.
