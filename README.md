# DecisionOS

An agent that answers why a product decision was made, what was assumed, and how that decision changed, by reading a file corpus.

## V1

Sources live on disk. An extractor writes one markdown decision record per decision. An answer agent reads those records first and opens a source file only to cite the supporting lines.

```text
sources/meetings/2026-01-12-q1-roadmap.md
sources/slack/2026-03-02-invoicing-thread.md
sources/docs/2026-01-customer-research.md
decisions/2026-01-12-deprioritize-invoice-automation.md
```

Retrieval is list, text search, and read behind one function, `retrieve(question)`. Embeddings and hybrid search can replace that implementation later. The answer shape stays the same.

## Layout

This repo follows the agent-first template. Intent goes in `docs/product/`, binding choices in `docs/adr/`, and the active task in `docs/plans/`.

```bash
scripts/verify.sh
```
