# TASK-008: Decisions endpoints and live context panel

## Goal

`GET /decisions` and `/decisions/{id}` serve the demo corpus, and the Decision Log and the context panel read them in live mode.

## Acceptance criteria

- [x] `corpus/finflow/decisions/*.md` holds the 3 seeded decisions (frontmatter lists plus headed body sections); both routes return `Decision`, unknown id is 404.
- [x] The API output deep-equals the seeded `decisions` array (parity check recorded in Notes).
- [x] Demo-corpus integrity tests: every cross-reference resolves; decision and document links agree both ways; DEC-003 is never `Approved`; DEC-001's 25,000-line threshold is marked provisional.
- [x] `DecisionLogPage`, `DecisionFilters`, `DecisionDetail` and `DecisionCard` read the API.
- [x] In live mode the context panel and decision badges derive related decisions, documents and people from the cited paths via `entity`.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

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

- Parity check (2026-10 run): dumped the seeded `decisions` array with vitest and `GET /decisions` from a TestClient over `corpus/finflow`; the two JSON structures deep-equal for all of DEC-001/002/003 (`PARITY`). Optional keys (`technicalOwnerId`, `leadingProposal`, follow-up `dueDate`) are omitted exactly where the seed omits them.
- The decisions seed lives on for the mock engine until TASK-009; `DecisionCard`/`DecisionDetail`/`DecisionLogPage`/`DecisionFilters`, the chat badges, the source drawer and the document detail now read decisions through `useCatalog` (API in live mode, seed offline).
- Live answers cite paths, so `ui/src/lib/relatedEntities.ts` derives decisions/documents/people/projects from the cited paths via the same ids `FileSlice.entity` reports (`entityForPath` in `corpusFiles.ts`); the context panel merges that with `decisionIds`/`evidence` when present.
- Live end-to-end run against the real Pi session: not performed (no `ROUTERPLUS_API_KEY` in this environment); offline suites cover the routes and the JSONL protocol against the fake sidecar.

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Depends on TASK-007. Ports the invariants from `ui/src/test/knowledge-base.test.ts`.
