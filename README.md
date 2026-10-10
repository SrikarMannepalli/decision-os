# DecisionOS

DecisionOS answers why a product decision was made, what was assumed, and how it changed, by reading a file corpus.

A person asks a question. A read-only agent lists, searches, and reads the files, then answers with the paths and lines it used.

## V1

The corpus is markdown on disk. Python and FastAPI expose the API. [Pi](https://pi.dev) runs the agent loop. The session may use `read`, `grep`, `find`, and `ls`, with its working directory set to the corpus.

```text
POST /ask
    │
    ▼
FastAPI
    │  question + corpus path
    ▼
Pi session
    tools: ls, find, grep, read
    │
    ▼
answer + cited file paths
```

`retrieve(question)` is the function FastAPI calls. A later search index can change how the next file is chosen inside that function. The route and the answer shape stay the same.

Writing decision records, a timeline, and embeddings come after this loop can open the right file and quote it.

## Repo

Intent lives in `docs/product/`. Binding choices live in `docs/adr/`. The active task lives in `docs/plans/`.

```bash
scripts/verify.sh
```
