# Corpus catalog API

## Summary

Add read-only routes that serve structured entities (people, projects,
documents, decisions) and file content from the corpus, and move the UI pages
from seeded TypeScript data onto them. Follows
[ADR-0004](../adr/0004-corpus-entities-are-markdown-with-frontmatter.md) and
[ADR-0003](../adr/0003-retrieval-is-a-conversation-with-citations.md). The
conversation routes and the turn/answer shapes do not change.

## Why

In live mode the UI lists a citation's path and line range but cannot show the
lines, and four pages plus the context panel still run on seed data. The
backend has nothing to serve them from.

## Corpus layout

A checked-in demo corpus at `corpus/finflow/`, converted from the UI seed. Ids
match the seed (`maya-chen`, `PRJ-101`, `ZOOM-001`, `DEC-001`).

```text
people/<id>.md      id, name, role, department, email
projects/<id>.md    id, name, owner                  body: description
documents/<ID>.md   id, title, type, project, authors[], createdAt,
                    decisions[], summary             body: content
decisions/<ID>.md   id, title, project, status, owner, technicalOwner,
                    contributors[], approvers[], decidedAt, createdAt,
                    updatedAt, supersedes[], supersededBy[], artifacts[],
                    alternatives[{title, disposition, rationale, artifacts[]}],
                    followUps[{id, description, owner, dueDate, status, artifacts[]}]
                    body: ## Problem, ## Decision | ## Leading proposal,
                          ## Rationale (bullets), ## Caveats, ## Open questions
```

`tests/corpus/` is untouched; it is the retrieval fixture. The seed's
per-document `excerpts` are dropped: a cited line range replaces them.

## Routes

JSON keys are camelCase so `ui/src/types` is the contract.

| Route | Response |
|---|---|
| `GET /files/{path}?start=&end=` | `{path, start, end, totalLines, lines: [{n, text}], entity: {kind, id} \| null}` |
| `GET /people`, `/people/{id}` | `Employee` |
| `GET /projects`, `/projects/{id}` | `Project` |
| `GET /documents`, `/documents/{id}` | list omits `content`; detail adds `content`, `bodyStartLine` |
| `GET /decisions`, `/decisions/{id}` | `Decision` |

Errors: unknown id or file → 404; bad range, over-large window, or a path that
escapes the corpus, is absolute, is not `.md`, or is a directory → 422 (a
missing file inside the corpus is 404). `start` defaults to 1, `end` to
`start` + window. `end` past the file is clamped. The window cap is 500 lines.
Filtering and search stay client-side.

## Modules

- `frontmatter.py` — split the YAML block from the body, return the body's
  first line number.
- `corpus.py` — `read_slice(corpus, path, start, end)`; resolves under the
  corpus root, rejects traversal and symlink escape, typed errors.
- `catalog.py` — `Catalog(corpus)`; dataclasses with `to_dict`; scans per
  request; skips malformed files with a warning.
- `main.py` — thin handlers over `app.state.catalog`, built in `create_app`.

## UI

- `services/apiClient.ts` holds the shared request and error helpers extracted
  from `liveClient.ts`.
- `CatalogProvider` / `useCatalog()` expose the lists and lookups with loading
  and error state. In live mode each resource comes from the API as its task
  lands; in mock mode everything comes from the seed until TASK-009.
- A citation opens the source drawer with the real cited lines. The file
  response's `entity` links a cited file to its document or decision, which
  lets the context panel show related decisions, documents and people for live
  answers.

## Task order

TASK-004 file content, 005 people, 006 projects, 007 documents, 008
decisions, 009 retire the seed and mock engine. Each is one PR.

## Risks

- Per-request scanning is fine at demo size; an index belongs behind these
  routes later.
- Cross-references between kinds only fully resolve once decisions land in
  TASK-008; the integrity tests run then.
