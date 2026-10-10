# TASK-005: People endpoints and catalog provider

## Goal

`GET /people` and `/people/{id}` serve the demo corpus, and the People page and every person link read them in live mode.

## Acceptance criteria

- [x] `corpus/finflow/people/*.md` holds the 10 seeded people; `GET /people` and `GET /people/{id}` return `Employee`, unknown id is 404.
- [x] The API output deep-equals the seeded `employees` array (parity check recorded in Notes).
- [x] `tests/test_demo_corpus.py` parses `corpus/finflow` and fails on a malformed or duplicate-id person.
- [x] `CatalogProvider` and `useCatalog()` expose people with loading and error state; live mode reads the API, mock mode the seed.
- [x] `PeopleDirectory`, `PersonAvatar`, `RecordMeta` and `AnswerSection` use the catalog; `lib/richText.ts` and `answerToPlainText` take lookups as parameters.
- [x] `scripts/dev-live.sh` defaults to `corpus/finflow`.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Projects, documents, decisions.
- Server-side filtering or search.

## Likely files

- `corpus/finflow/people/`, `src/decisionos/catalog.py`, `src/decisionos/main.py`
- `tests/test_people.py`, `tests/test_demo_corpus.py`
- `ui/src/hooks/useCatalog.tsx`, `ui/src/services/apiClient.ts`, the components above

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Depends on TASK-004. The one-off seed-to-markdown conversion script is deleted after use.
- Done 2026-10-10. People files are frontmatter only (`id`, `name`, `role`, `department`, `email`); the one-off seed-to-markdown conversion ran inline and was not committed. `Catalog` (`src/decisionos/catalog.py`) scans per request, lists sorted by id, and skips a malformed person (bad YAML, missing or non-string field, `id` not matching the file name) with a warning. Strict checking of the demo corpus is in `tests/test_demo_corpus.py`.
- Parity check (one-off, API over `corpus/finflow` against the `employees` array in `ui/src/data/employees.ts`): all 10 records equal, and `GET /people/{id}` equals each. The list is ordered by id, so the seed's order differs; the People page sorts nothing itself, so live mode lists A-Z while mock mode keeps seed order.
- UI: `CatalogProvider` takes a `CatalogSource` (`services/catalogApi.ts`): live loads over the API with loading and error state, mock is ready immediately from the seed. `RecordMeta` reads people through `PersonAvatar`/`PersonName`. Also moved onto the catalog, because they resolved names from the seed: `DecisionFilters`, `DecisionCard`, `DecisionLogPage`, `DocumentLibrary`, `ContextPanel`. `initials` moved to `lib/format.ts`. `tokenizeRichText` takes `RichTextLookups` and `answerToPlainText` takes a name lookup; documents and decisions still come from the seed through the catalog until TASK-007 and TASK-008. The mock engine keeps reading the seed until TASK-009.
- `scripts/dev-live.sh` defaults to `corpus/finflow`, and its default smoke question changed to one the people files can answer, since `corpus/finflow` has no decisions yet. Revisit when TASK-008 lands.
- Live check (real uvicorn over `corpus/finflow`, `npm run dev:live`, headless Chrome): `#/people/ethan-cole` lists 10 people from the API and highlights Ethan Cole; with the API stopped the page shows "Couldn't load people". Mock mode lists the seed in seed order. Not run against the real Pi session.
