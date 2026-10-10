# TASK-007: Documents endpoints

## Goal

`GET /documents` and `/documents/{id}` serve the demo corpus, and the Documents page and source drawer read them in live mode.

## Acceptance criteria

- [x] `corpus/finflow/documents/*.md` holds the 18 seeded documents; the list omits `content`, the detail adds `content` and `bodyStartLine`; unknown id is 404.
- [x] The API output matches the seeded documents apart from the dropped `excerpts` (parity check recorded in Notes).
- [x] `GET /files/documents/<ID>.md` returns `entity: {kind: "document", id}`.
- [x] `DocumentLibrary`, `DocumentDetail` (fetches the detail on open) and `DocumentsPage` read the API; the key-excerpts section is hidden when absent.
- [x] A cited document path in the source drawer links to its document through `entity`.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

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
- Done: document files are frontmatter (`id`, `title`, `type`, `project`, `authors[]`, `createdAt`, `decisions[]`, `summary`) plus the content as the body; YAML parses bare dates, so `createdAt` accepts a YAML date or a string and is served as ISO text. `Catalog.documents()`/`document()` mirror the other loaders and skip a malformed document with a warning; the list omits `content`, the detail adds `content` and `bodyStartLine`. Strict checking of the demo corpus lives in `tests/test_demo_corpus.py`.
- Parity check (one-off, API over `corpus/finflow` against `ui/src/data/documents/*.ts`): all 18 list records deep-equal the seed minus `excerpts`, all 18 detail contents equal the seed, and the API's id-sorted order matches the seed's order. The only textual difference is a trailing newline on six `dec-002` contents, which the loader trims.
- UI: `CatalogSource` gained `initialDocuments`/`loadDocuments`/`loadDocument(id)`; `CatalogProvider` loads people, projects and documents together and exposes `documents`, `documentById` and `loadDocument`; `richTextLookups.isArtifact` now resolves against the loaded documents (seed ids still included) so live-mode citation chips link. `DocumentLibrary` renders from the catalog with loading/error states — full-text search covers `content` only where present (seed/mock; the live list omits it). `DocumentsPage` fetches the detail on open (`GET /documents/{id}`) and closes the drawer when the id is unknown; the key-excerpts section is hidden when a document has none. `CorpusSourceView` adds an "Open document" link when the file response's `entity` names a document. The mock engine and the remaining seed readers (decisions context, `SourceDrawer`) stay on the seed until TASK-008/009.
