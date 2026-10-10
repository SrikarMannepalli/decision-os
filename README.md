# DecisionOS

DecisionOS answers why a product decision was made, what was assumed, and how it changed, by reading a file corpus.

A person asks a question, then follows up. A read-only agent lists, searches, and reads the files, then answers with the paths and lines it used — remembering the conversation so far.

## V1

The corpus is markdown on disk. Python and FastAPI expose the API. [Pi](https://pi.dev) runs the agent loop. Each conversation is one Pi session that may use `read`, `grep`, `find`, and `ls`, with its working directory set to the corpus.

```text
POST /conversations
    │
    ▼
FastAPI
    │  conversation id
    ▼
POST /conversations/{id}/messages
    │  question
    ▼
Pi session (one per conversation)
    tools: ls, find, grep, read
    │
    ▼
answer + cited file paths for that turn
```

`retrieve(conversation_id, question)` is the function FastAPI calls. A later search index can change how the next file is chosen inside that function. The routes and the answer shape stay the same.

Writing decision records, a timeline, and embeddings come after this loop can open the right file and quote it.

## Repo

Intent lives in `docs/product/`. Binding choices live in `docs/adr/`. The active task lives in `docs/plans/`.

```bash
scripts/verify.sh
```
