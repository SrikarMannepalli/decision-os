# TASK-008: Decisions endpoints and live context panel

## Goal

`GET /decisions` and `/decisions/{id}` serve the demo corpus, and the Decision Log and the context panel read them in live mode.

## Acceptance criteria

- [ ] `corpus/finflow/decisions/*.md` holds the 3 seeded decisions (frontmatter lists plus headed body sections); both routes return `Decision`, unknown id is 404.
- [ ] The API output deep-equals the seeded `decisions` array (parity check recorded in Notes).
- [ ] Demo-corpus integrity tests: every cross-reference resolves; decision and document links agree both ways; DEC-003 is never `Approved`; DEC-001's 25,000-line threshold is marked provisional.
- [ ] `DecisionLogPage`, `DecisionFilters`, `DecisionDetail` and `DecisionCard` read the API.
- [ ] In live mode the context panel and decision badges derive related decisions, documents and people from the cited paths via `entity`.
- [ ] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Retiring the seed and the mock engine (TASK-009).
- Changing the answer shape returned by the conversation routes.

## Likely files

- `corpus/finflow/decisions/`, `src/decisionos/catalog.py`, `src/decisionos/main.py`
- `tests/test_decisions.py`, `tests/test_demo_corpus.py`
- `ui/src/pages/DecisionLogPage.tsx`, `ui/src/components/DecisionDetail.tsx`, `ui/src/components/ContextPanel.tsx`, `ui/src/components/ChatMessage.tsx`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Depends on TASK-007. Ports the invariants from `ui/src/test/knowledge-base.test.ts`.
