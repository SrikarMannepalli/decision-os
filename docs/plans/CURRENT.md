# Current work

- Task: none active. TASK-005 (people endpoints and catalog provider) is done and in review on `TASK-005/people-endpoints`.
- Next: `docs/plans/tasks/TASK-006.md` (projects), after TASK-005 merges. Queue: 006 projects, 007 documents, 008 decisions, 009 retire the seed (needs a human decision on offline `npm run dev`).
- For the remaining entity tasks: `catalog.Catalog` (`src/decisionos/catalog.py`) is where each kind's loader goes, and `CatalogSource` in `ui/src/services/catalogApi.ts` plus `CatalogProvider` in `ui/src/hooks/useCatalog.tsx` is where each kind's live fetch goes. `frontmatter.split` is the shared parser.
