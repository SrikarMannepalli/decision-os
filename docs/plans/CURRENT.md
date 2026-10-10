# Current work

- Task: none active. TASK-007 (documents endpoints and live documents UI) is done and ready for review on `TASK-007/documents-endpoints`.
- Next: `docs/plans/tasks/TASK-008.md` (decisions), after TASK-007 merges. Queue: 008 decisions, 009 retire the seed (needs a human decision on offline `npm run dev`).
- For the remaining entity tasks: `catalog.Catalog` (`src/decisionos/catalog.py`) is where each kind's loader goes, and `CatalogSource` in `ui/src/services/catalogApi.ts` plus `CatalogProvider` in `ui/src/hooks/useCatalog.tsx` is where each kind's live fetch goes. `frontmatter.split` is the shared parser.
