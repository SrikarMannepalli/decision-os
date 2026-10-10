# TASK-005: People endpoints and catalog provider

## Goal

`GET /people` and `/people/{id}` serve the demo corpus, and the People page and every person link read them in live mode.

## Acceptance criteria

- [ ] `corpus/finflow/people/*.md` holds the 10 seeded people; `GET /people` and `GET /people/{id}` return `Employee`, unknown id is 404.
- [ ] The API output deep-equals the seeded `employees` array (parity check recorded in Notes).
- [ ] `tests/test_demo_corpus.py` parses `corpus/finflow` and fails on a malformed or duplicate-id person.
- [ ] `CatalogProvider` and `useCatalog()` expose people with loading and error state; live mode reads the API, mock mode the seed.
- [ ] `PeopleDirectory`, `PersonAvatar`, `RecordMeta` and `AnswerSection` use the catalog; `lib/richText.ts` and `answerToPlainText` take lookups as parameters.
- [ ] `scripts/dev-live.sh` defaults to `corpus/finflow`.
- [ ] `scripts/verify.sh` exits 0 and the UI checks pass.

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
