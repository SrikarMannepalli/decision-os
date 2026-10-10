# ADR-0004: Corpus entities are markdown with YAML frontmatter

- Status: accepted
- Date: 2026-10-10
- Supersedes: none
- Superseded by: none

## Context

The corpus is markdown on disk, and ADR-0003 keeps it read-only. The UI shows
decisions, documents, projects and people, and today it reads them from seeded
TypeScript data. The backend has no endpoint for any of them, and none for the
content of a cited `{path, lines}` range. The existing corpus under
`tests/corpus/` is unstructured prose with no ids, owners, status or links.

## Decision

Structured entities live in the corpus as markdown files with a YAML
frontmatter block, in one directory per kind: `people/`, `projects/`,
`documents/`, `decisions/`. Each file's frontmatter carries a unique `id`; the
file name is `<id>.md`. Prose lives in the markdown body. The backend reads
these files to serve `GET` routes for each kind and for file content. It never
writes the corpus, and it never derives entities with a model.

The retrieval agent keeps reading the same files through `read`, `grep`,
`find` and `ls`. Line numbers in file-content responses count lines of the raw
file, frontmatter included, so they match the agent's citations.

PyYAML is the one new dependency, for frontmatter parsing.

## Consequences

- Ids are stable references between entities. A reference to a missing id is a
  corpus error, caught by the demo-corpus integrity tests.
- A malformed entity file is skipped with a logged warning rather than failing
  the whole listing.
- Unstructured files like `tests/corpus/decisions/*.md` remain valid corpus
  content for retrieval; they are simply not entities.
- A search index or database may later cache entities. It must not become the
  source of truth, and it sits behind the same routes.
- Changing the frontmatter fields of a kind is a change to a public contract
  and needs a design update.
