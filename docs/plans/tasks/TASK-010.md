# TASK-010: Render markdown in chat answers

## Goal

Chat answers show headings, lists, bold, italic and code as formatted text instead of literal markdown markers.

## Acceptance criteria

- [x] `##` headings, bullet and numbered lists, `**bold**`, `*italic*` and `` `code` `` render as HTML elements in an answer.
- [x] `DEC-###` and `[ARTIFACT-ID]` citations inside answer text stay clickable.
- [x] Raw HTML in an answer is not rendered.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- Changing the answer shape or the API.
- Markdown in the document viewer (`DocumentBody`).

## Likely files

- `ui/src/components/AnswerMarkdown.tsx`, `ui/src/components/ChatMessage.tsx`, `ui/src/test/answer-markdown.test.tsx`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
```

## Notes

- Uses `react-markdown`. No ADR covers UI libraries.
- Not checked in a browser; covered by a server-render test.
