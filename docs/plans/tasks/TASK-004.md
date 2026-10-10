# TASK-004: File content endpoint and cited-source viewer

## Goal

`GET /files/{path}` returns the lines of a corpus file, and in live mode a chat citation opens the exact cited lines.

## Acceptance criteria

- [x] `GET /files/{path}?start=&end=` returns `{path, start, end, totalLines, lines, entity}` with 1-based inclusive line numbers over the raw file (frontmatter included).
- [x] An `end` past the file is clamped; `start > end`, a window over 500 lines, traversal, absolute paths, symlink escape, non-`.md` paths and directories are rejected with 422; a missing file is 404.
- [x] The corpus is byte-identical after any request.
- [x] Clicking a source in a live answer or the context panel shows the cited lines, highlighted, with a few lines of context, plus loading and error states.
- [x] `services/apiClient.ts` holds the request and error helpers shared with `liveClient.ts`; the live chat tests still pass.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Entity routes (people, projects, documents, decisions).
- The demo corpus; this task works against `tests/corpus`.
- Changing the conversation routes or the turn/answer shapes.

## Likely files

- `src/decisionos/frontmatter.py`, `src/decisionos/corpus.py`, `src/decisionos/main.py`, `pyproject.toml` (PyYAML)
- `tests/test_files.py`
- `ui/src/services/apiClient.ts`, `ui/src/services/liveClient.ts`, `ui/src/hooks/useUI.tsx`, `ui/src/components/ChatMessage.tsx`, `ui/src/components/SourceDrawer.tsx`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Design: `docs/design/corpus-catalog-api.md`
- ADRs: `docs/adr/0004-corpus-entities-are-markdown-with-frontmatter.md`, `docs/adr/0003-retrieval-is-a-conversation-with-citations.md`
- The docs PR (ADR-0004, the design, these task files) lands first and needs human review; `entity` is `null` until the entity tasks land.
- Done 2026-10-10. `entity` is derived from a file's own frontmatter (`<kind dir>/<id>.md` with a matching `id`); kinds are `person`, `project`, `document`, `decision`. It is `null` for every file in `tests/corpus`.
- A start past the end of a non-empty file is 422; an empty file returns no lines. Only `\n` ends a line (not `splitlines()`), matching the agent's `read`.
- Live check (stub agent over `tests/corpus`, `npm run dev:live`, headless Chrome): cited lines highlighted with 3 lines of context; loading, 404 and 422 states render; the dev proxy serves `/api/files/...`. Not run against the real Pi session.
- `ui/` has no DOM test environment (vitest runs in node), so the viewer is covered by service and window tests plus the manual check above.
