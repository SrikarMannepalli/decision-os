# TASK-002: RouterPlus model routing for the sidecar

## Goal

Pin the retrieval sidecar's Pi sessions to a small, fast model served through
the Anthropic-compatible RouterPlus endpoint, and document how to run and test
the live backend on any machine.

## Acceptance criteria

- [x] The sidecar resolves its model through `ModelRuntime` instead of falling
      back to the first available model, and fails fast with a clear error if
      the model is not registered.
- [x] The model id defaults to `claude-haiku-5-5` (RouterPlus naming) and is
      overridable with `DECISIONOS_AGENT_MODEL` without code changes.
- [x] Extended thinking is off for retrieval turns.
- [x] The RouterPlus provider setup (endpoint, auth style, model ids) is
      documented, with no secrets in the repo — the key arrives only via the
      `ROUTERPLUS_API_KEY` environment variable.
- [x] A runbook explains offline tests, live setup, smoke tests, and
      troubleshooting on a fresh machine.
- [x] `scripts/verify.sh` passes; offline tests are unaffected.

## Out of scope

- Changing the API shape, turn/answer contracts, or the sidecar JSONL
  protocol.
- Search indexes, streaming, persistence.
- Choosing models per conversation or per turn.

## Likely files

- `agent/index.mjs` — model resolution and session creation
- `AGENTS.md` — live-run prerequisites
- `docs/runbooks/testing-the-backend.md` — the runbook

## Verify

```bash
scripts/verify.sh
```

## Notes

- Product: `docs/product/retrieval.md`
- Design: `docs/design/conversational-retrieval.md`
- ADRs: `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- RouterPlus provider config is machine-local (`~/.pi/agent/models.json`);
  the runbook carries its contents so a fresh machine can recreate it.
- Live verification (manual, per AGENTS.md): run the runbook smoke test
  against `tests/corpus` on a machine with `ROUTERPLUS_API_KEY` and record
  the result here — pending; no RouterPlus credentials on the authoring
  machine, offline gate is green.
