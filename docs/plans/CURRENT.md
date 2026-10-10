# Current work

- Task: none active. TASK-006 (projects endpoints and catalog read-through) is done and ready for review on `TASK-006/projects-endpoints`.
- Next: `docs/plans/tasks/TASK-007.md` (documents), after TASK-006 merges. Queue: 007 documents, 008 decisions, 009 retire the seed (needs a human decision on offline `npm run dev`).
- For the remaining entity tasks: `catalog.Catalog` (`src/decisionos/catalog.py`) is where each kind's loader goes, and `CatalogSource` in `ui/src/services/catalogApi.ts` plus `CatalogProvider` in `ui/src/hooks/useCatalog.tsx` is where each kind's live fetch goes. `frontmatter.split` is the shared parser.
