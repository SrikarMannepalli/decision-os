# TASK-001: Conversational retrieval loop

## Goal

A multi-turn conversation over a markdown corpus where each turn's answer
cites the paths and line ranges that turn used.

## Acceptance criteria

- [x] `POST /conversations` creates a conversation and returns its id.
- [x] `POST /conversations/{id}/messages` with a question returns an answer
      citing at least one path inside the corpus.
- [x] A follow-up turn that depends on an earlier turn's answer resolves it
      from conversation history, not from the caller restating it.
- [x] A turn whose answer depends on two files cites both.
- [x] After the conversation, every corpus file has the same contents as
      before.
- [x] The agent can only use `read`, `grep`, `find`, and `ls`, rooted at the
      corpus directory.
- [x] `GET /conversations/{id}` returns the full turn history with per-turn
      citations.

## Out of scope

- Persisting conversations beyond process lifetime.
- Streaming responses.
- Writing decision records, a timeline, or a search index.
- Authentication.

## Likely files

- `src/main.py` — FastAPI app and conversation routes
- `src/retrieval.py` — `retrieve(conversation_id, question)` and session
  management
- `agent/` — Node sidecar wrapping the Pi SDK session
- `tests/` — corpus fixture and turn tests

## Verify

```bash
scripts/verify.sh
```

## Notes

- Product: `docs/product/retrieval.md`
- Design: `docs/design/conversational-retrieval.md`
- ADRs: `docs/adr/0001-verify-script-is-the-completion-gate.md`,
  `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Offline tests use a fake agent (`tests/conftest.py`) and a fake sidecar
  (`tests/fake_sidecar.mjs`). A live end-to-end run against the real Pi
  session (turn 1 answer + citations, follow-up from history, corpus
  unchanged) was verified manually on 2026-10-10 with
  `node agent/index.mjs` on `tests/corpus`.
