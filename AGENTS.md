# AGENTS.md

## What this repo is

DecisionOS answers questions about past product decisions by reading a file corpus. Humans write intent and review. Agents implement.

- `src/` — FastAPI application
- `agent/` — Node sidecar: one Pi session per conversation, implements `retrieve`
- `tests/` — pytest suite and the fixture corpus
- `docs/product/` — what to build and how to tell it works
- `docs/design/` — feature designs for the change in progress
- `docs/adr/` — binding decisions
- `docs/plans/` — the active task and the task backlog
- `.agents/skills/` — procedures loaded only when a task matches

The HTTP API is Python and FastAPI. The retrieval loop is a Pi session per conversation. Follow [ADR-0003](docs/adr/0003-retrieval-is-a-conversation-with-citations.md).

Prerequisites: Python ≥ 3.11 (with `venv`) and Node ≥ 22. The verify script
creates `.venv` itself. The live sidecar needs one-time `npm install` in
`agent/`, a `ROUTERPLUS_API_KEY` in the environment (models route through the
Anthropic-compatible RouterPlus provider in `~/.pi/agent/models.json`), and
runs on the haiku model id listed there; offline tests do not need any of it.

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
- The Pi session tools for retrieval are `read`, `grep`, `find`, and `ls`. Its working directory is the corpus root.
- `retrieve(conversation_id, question)` is the seam FastAPI calls. Search indexes, when they exist, sit inside that function.

## How to pick up work

1. Read `docs/plans/CURRENT.md`.
2. Open the task file it names.
3. Read the product docs, design docs, and ADRs that task links.
4. Stay inside that task's scope.

## Decisions

Read `docs/adr/README.md` before choosing a library, a datastore, an API shape, or a workflow. Open a single ADR only when the task touches that decision. New binding decisions go through the `write-adr` skill.

## Testing

- **Red → green.** Write the failing test first, watch it fail, then implement.
  A test ships in the same commit as the code that makes it pass; commits never
  land red on the default branch.
- Every bug fix starts with a failing test that reproduces the bug.
- Tests run offline: no model credentials, no network. The Pi sidecar is faked
  at the `Agent` seam (`tests/conftest.py`); the JSONL protocol is tested
  against a fake Node sidecar (`tests/fake_sidecar.mjs`).
- Live end-to-end runs against the real Pi session are manual verification,
  recorded in the task file's Notes.

## Code conventions

- Route handlers in `src/decisionos/main.py` stay thin: parse, validate,
  delegate to `retrieval.py`.
- External systems enter only through a seam (`sidecar.Agent`); tests inject
  fakes at those seams, never at route handlers.
- A module that needs something takes it as a parameter; nothing reaches for
  globals or singletons.
- Conversation history and session state live in `retrieval.py`; the API shape
  and the turn/answer shapes are contracts — changing them is a new task, not
  a refactor.

## Branches, PRs & process

- **No direct commits to the default branch.** All work — including docs —
  lands via pull request.
- Workflow: branch from the default branch as `TASK-NNN/short-description` →
  commit → push → `gh pr create` → squash-merge → delete branch
  (`gh pr merge --squash --delete-branch`). Squash-only keeps one green commit
  per PR and a linear history.
- CI (`scripts/verify.sh`) must be green on the PR before merging.
- The PR body uses `.github/PULL_REQUEST_TEMPLATE.md`: task link, verify
  result, and risk. Follow the `open-pr` skill.
- When a task is ambiguous, ask in the session — don't improvise scope.

### Git

- Branch: `TASK-NNN/short-description`
- Commit: `type: [TASK-NNN]: why`
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

## Where to read more

- Product intent: `docs/product/`
- Feature designs: `docs/design/`
- Decisions: `docs/adr/README.md`
- Active work: `docs/plans/CURRENT.md`
- Skills: `.agents/skills/`
