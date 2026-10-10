# TASK-003: Chat UI over the conversational backend

## Goal

Add a React frontend (`ui/`) for FinFlow's DecisionOS whose chat answers through the existing conversation endpoints, with a one-command local runner.

## Acceptance criteria

- [x] `ui/` runs offline on typed mock data (`npm run dev`) with chat, citations drawer, Decision Log, Documents, Projects, People and Settings views.
- [x] `npm run dev:live` sends chat questions to `POST /conversations` and `POST /conversations/{id}/messages`, one backend conversation per UI conversation, and lists the returned `{path, lines}` citations as sources.
- [x] An answer without citations is shown as "not enough evidence".
- [x] `scripts/dev-live.sh` sets up and starts API and UI given only `ROUTERPLUS_API_KEY`.
- [x] UI unit tests pass offline (`cd ui && npm test`).
- [x] `scripts/verify.sh` exits 0.
- [ ] Live model turn recorded in Notes (pending: needs a real RouterPlus key).

## Out of scope

- Backend changes: `src/`, `agent/`, API shape and turn/answer shapes are untouched.
- Backend endpoints for decisions, documents, projects, people or file content; those pages stay on seeded data.
- A CI job for `ui/` (a `.github/` change that needs human review).

## Likely files

- `ui/` — the frontend
- `scripts/dev-live.sh` — local runner

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Branch is `ui-changes` at the requester's direction, not `TASK-003/...`.
- `scripts/verify.sh` does not cover `ui/`.
- Cited sources show path and line range only; the backend has no endpoint that returns file content.
- Live verification against the real sidecar is manual (per AGENTS.md): run `scripts/dev-live.sh --smoke` with a key and record the result here — pending. Offline, the live client was exercised against the real FastAPI app with a scripted fake agent.
