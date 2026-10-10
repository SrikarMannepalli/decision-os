# TASK-009: Retire the seed and the mock engine

## Goal

The UI has one data source, the API, and the seeded data and keyword mock engine are gone.

## Acceptance criteria

- [x] `ui/src/data/*.ts`, `services/mockRetrieval.ts`, the seeded conversations and the mock-only tests are removed.
- [x] `npm run dev` runs the UI against the API; pages work without a model key and only chat needs `ROUTERPLUS_API_KEY`.
- [x] `ui/README.md`, `SettingsPage` and the README structure section describe the real setup.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

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

- Human decision taken: drop offline `npm run dev` — the seed, mock engine and `VITE_DECISIONOS_MODE` are gone; `dev` always proxies `/api`.
- Also removed with the mock: `AnswerSection`, `SourceDrawer` (excerpt drawer), the mock-only `AssistantAnswer` fields (`sections`, `decisionIds`, `evidence`, `personIds`, `suggestions`) and the `Excerpt`/`SeedDocument` types. `CitationChip` now navigates to the document detail view; chat citations keep opening `CorpusSourceView` (`GET /files/{path}`).
- Suggested prompt chips moved into `ChatView` as a static list and stay visible.
- `scripts/dev-live.sh` no longer sets `VITE_DECISIONOS_MODE`.
- Verified live without a model key: uvicorn over `corpus/finflow` + `npm run dev`; the proxy serves 10 people, 3 projects, 18 documents, 3 decisions; a chat turn without `ROUTERPLUS_API_KEY` 500s and the UI shows its error state with retry.
- Live end-to-end against the real Pi session still not run (no key in this environment); covered by the sidecar/jsonl suites and `live-client.test.ts`.
- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- Needs a human decision before it starts: drop offline `npm run dev` (recommended), or keep the seed and mock for offline use at the cost of two data sources.
