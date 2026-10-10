---
name: write-adr
description: >
  Record a binding architecture decision. Use when choosing a library,
  datastore, API shape, or workflow that later sessions must follow, or when
  superseding an accepted ADR.
---

# Write an ADR

1. Read `docs/adr/README.md` and any ADR this decision would overturn.
2. If an accepted ADR already covers the choice, follow it and stop.
3. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-title.md` using the next number.
4. Set status to `accepted` when the human has agreed. Otherwise leave it `proposed` and stop before coding against it.
5. When this ADR replaces an older one, set `Supersedes` on the new record and set the old record's status to `superseded by ADR-NNNN`. Leave the old decision text in place.
6. Add a row to `docs/adr/README.md` in the same change.
7. Link the ADR from the task file.
