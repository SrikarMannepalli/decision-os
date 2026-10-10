# ADR-0002: Retrieval is a read-only Pi session behind FastAPI

- Status: accepted
- Date: 2026-10-10
- Supersedes: none
- Superseded by: none

## Context

V1 answers a question by reading a markdown corpus. The model has to choose the next file itself: list a directory, search contents, read a span, then stop with citations.

The HTTP API is Python. The Pi SDK that already implements this tool loop is Node (`@earendil-works/pi-coding-agent`). Pi's default tool set also includes `bash`, `edit`, and `write`. Embeddings and hybrid search are a later way to choose files, once reading the tree is no longer enough.

## Decision

FastAPI is the product API. `retrieve(question)` starts one in-memory Pi session whose working directory is the corpus root. The session tools are `read`, `grep`, `find`, and `ls`. FastAPI returns the session's answer and the file paths it opened.

Pi runs as a Node sidecar invoked by FastAPI. The tool loop stays in Pi.

## Consequences

- A retrieval change goes through `retrieve(question)`. The HTTP route and the cited-answer shape stay put.
- The session working directory is the corpus root, so every path resolves inside that tree.
- The retrieval tool set is `read`, `grep`, `find`, and `ls`.
- A future search index changes file selection inside `retrieve`. It does not replace the Pi session or the route.
- Language-specific test and lint commands, once they exist, are added inside `scripts/verify.sh` (ADR-0001).
