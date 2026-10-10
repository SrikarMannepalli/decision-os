# TASK-009: Retire the seed and the mock engine

## Goal

The UI has one data source, the API, and the seeded data and keyword mock engine are gone.

## Acceptance criteria

- [ ] `ui/src/data/*.ts`, `services/mockRetrieval.ts`, the seeded conversations and the mock-only tests are removed.
- [ ] `npm run dev` runs the UI against the API; pages work without a model key and only chat needs `ROUTERPLUS_API_KEY`.
- [ ] `ui/README.md`, `SettingsPage` and the README structure section describe the real setup.
- [ ] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- New features.

## Likely files

- `ui/src/data/`, `ui/src/services/`, `ui/src/hooks/useChat.tsx`, `ui/src/test/`, `ui/README.md`, `ui/src/pages/SettingsPage.tsx`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Needs a human decision before it starts: drop offline `npm run dev` (recommended), or keep the seed and mock for offline use at the cost of two data sources.
