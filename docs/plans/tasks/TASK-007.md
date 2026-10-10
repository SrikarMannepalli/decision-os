# TASK-007: Documents endpoints

## Goal

`GET /documents` and `/documents/{id}` serve the demo corpus, and the Documents page and source drawer read them in live mode.

## Acceptance criteria

- [ ] `corpus/finflow/documents/*.md` holds the 18 seeded documents; the list omits `content`, the detail adds `content` and `bodyStartLine`; unknown id is 404.
- [ ] The API output matches the seeded documents apart from the dropped `excerpts` (parity check recorded in Notes).
- [ ] `GET /files/documents/<ID>.md` returns `entity: {kind: "document", id}`.
- [ ] `DocumentLibrary`, `DocumentDetail` (fetches the detail on open) and `DocumentsPage` read the API; the key-excerpts section is hidden when absent.
- [ ] A cited document path in the source drawer links to its document through `entity`.
- [ ] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Decisions.
- Full-text search on the server.

## Likely files

- `corpus/finflow/documents/`, `src/decisionos/catalog.py`, `src/decisionos/corpus.py`, `src/decisionos/main.py`
- `tests/test_documents.py`
- `ui/src/components/DocumentLibrary.tsx`, `ui/src/components/DocumentDetail.tsx`, `ui/src/components/SourceDrawer.tsx`, `ui/src/types/index.ts`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Depends on TASK-006. Documents reference decisions that arrive in TASK-008, so cross-reference integrity is checked there.
