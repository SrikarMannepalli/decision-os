# TASK-006: Projects endpoints

## Goal

`GET /projects` and `/projects/{id}` serve the demo corpus, and the Projects page reads them in live mode.

## Acceptance criteria

- [ ] `corpus/finflow/projects/*.md` holds the 3 seeded projects (name, owner in frontmatter, description in the body); both routes return `Project`, unknown id is 404.
- [ ] The API output deep-equals the seeded `projects` array (parity check recorded in Notes).
- [ ] `ProjectList` and the project links in `RecordMeta` read the catalog; per-project decision and document counts still join client-side.
- [ ] `scripts/verify.sh` exits 0 and the UI checks pass.

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
