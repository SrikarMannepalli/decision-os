# AGENTS.md

## What this repo is

Agent-first repository. Humans write intent and review. Agents implement.

- `src/` — application code
- `tests/` — tests for that code
- `docs/product/` — what to build and how to tell it works
- `docs/design/` — feature designs for the change in progress
- `docs/adr/` — binding decisions
- `docs/plans/` — the active task and the task backlog
- `.agents/skills/` — procedures loaded only when a task matches

## Commands

Verify before you finish:

```bash
scripts/verify.sh
```

CI runs that command. A green local run is the completion gate.

## Definition of done

- Every acceptance criterion in the task file is checked off.
- `scripts/verify.sh` exits 0.
- Tests cover the behavior this change adds or alters.
- The pull request states what changed, the verify command result, and any risk.

## Boundaries

- Do not commit secrets or `.env` files.
- Do not push to the default branch.
- Do not rewrite the decision text of an accepted ADR. Supersede it with a new ADR.
- Changes under `docs/adr/` and `.github/` need a human review.

## How to pick up work

1. Read `docs/plans/CURRENT.md`.
2. Open the task file it names.
3. Read the product docs, design docs, and ADRs that task links.
4. Stay inside that task's scope.

## Decisions

Read `docs/adr/README.md` before choosing a library, a datastore, an API shape, or a workflow. Open a single ADR only when the task touches that decision. New binding decisions go through the `write-adr` skill.

## Git

- Branch: `TASK-000/short-description`
- Commit: `type: [TASK-000]: why`
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

## Where to read more

- Product intent: `docs/product/`
- Feature designs: `docs/design/`
- Decisions: `docs/adr/README.md`
- Active work: `docs/plans/CURRENT.md`
- Skills: `.agents/skills/`
