# TASK-006: Projects endpoints

## Goal

`GET /projects` and `/projects/{id}` serve the demo corpus, and the Projects page reads them in live mode.

## Acceptance criteria

- [x] `corpus/finflow/projects/*.md` holds the 3 seeded projects (name, owner in frontmatter, description in the body); both routes return `Project`, unknown id is 404.
- [x] The API output deep-equals the seeded `projects` array (parity check recorded in Notes).
- [x] `ProjectList` and the project links in `RecordMeta` read the catalog; per-project decision and document counts still join client-side.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Documents, decisions.
- Server-side joins or counts.

## Likely files

- `corpus/finflow/projects/`, `src/decisionos/catalog.py`, `src/decisionos/main.py`
- `tests/test_projects.py`
- `ui/src/hooks/useCatalog.tsx`, `ui/src/components/ProjectList.tsx`, `ui/src/components/RecordMeta.tsx`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Depends on TASK-005.
- Done: project files are frontmatter (`id`, `name`, `ownerId`) plus the description as the body; `Catalog.projects()`/`project()` mirror the people loader and skip a malformed project with a warning. Strict checking of the demo corpus lives in `tests/test_demo_corpus.py` alongside the people checks.
- Parity check (one-off, API over `corpus/finflow` against the `projects` array in `ui/src/data/projects.ts`): all 3 records deep-equal, and `GET /projects/{id}` equals each. The API lists sorted by id, which happens to match the seed's order, so live and mock modes render identically.
- UI: `CatalogSource` gained `initialProjects`/`loadProjects`; `CatalogProvider` loads people and projects together (one shared loading/error state), and `useCatalog()` exposes `projects`, `projectById`, `projectName`. `ProjectList` renders from the catalog with loading and error states; per-project decision/artifact counts still join client-side against the seed decisions and documents. Also moved onto the catalog, because they resolved project names from the seed: `RecordMeta` (`ProjectLink`), `DecisionCard`, `DecisionFilters`, `DecisionLogPage`, `DocumentLibrary`. The mock engine keeps reading the seed until TASK-009.
