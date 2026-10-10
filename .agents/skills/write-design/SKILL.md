---
name: write-design
description: >
  Write a feature design before coding. Use when a change crosses a module
  boundary, changes a public contract, or needs a new architecture decision.
---

# Write a design

1. Read the task file and the linked product doc.
2. Read `docs/adr/README.md` and follow every accepted ADR that applies.
3. Add `docs/design/<feature>.md` with the approach, the files it will touch, and links to those ADRs.
4. Link the design from the task file.
5. Stop for a human to read the design before editing `src/` when the task says the design needs approval.
