# Architecture decision records

Read this index before choosing a library, a datastore, an API shape, or a workflow. Open a record only when the task touches that decision.

Accepted records stay as written. A later change is a new ADR that supersedes the old one.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-verify-script-is-the-completion-gate.md) | `scripts/verify.sh` is the completion gate | accepted |
| [0002](0002-retrieval-is-a-read-only-pi-session.md) | Retrieval is a read-only Pi session behind FastAPI | superseded by [0003](0003-retrieval-is-a-conversation-with-citations.md) |
| [0003](0003-retrieval-is-a-conversation-with-citations.md) | Retrieval is a conversation with citations | accepted |
| [0004](0004-corpus-entities-are-markdown-with-frontmatter.md) | Corpus entities are markdown with YAML frontmatter | accepted |

Copy [template.md](template.md) when you add a record. Number files `NNNN-kebab-title.md` and add a row to this table in the same change.
