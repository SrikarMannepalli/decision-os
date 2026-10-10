---
id: ZOOM-002
title: "Bulk invoice action safety review"
type: Zoom transcript
project: PRJ-102
authors:
  - maya-chen
  - leo-fischer
  - ethan-cole
  - daniel-okafor
  - priya-nair
  - zoe-park
createdAt: 2026-09-22
decisions:
  - DEC-002
summary: "Product, Design, Security, and Engineering review the usability findings and agree on a review-and-confirm direction for bulk invoice actions."
---
## Attendees

Maya Chen, Leo Fischer, Ethan Cole, Daniel Okafor, Priya Nair, Zoe Park.

## Usability findings

[00:02] Leo: In the synthetic usability study, 4 of 8 participants missed the selected invoice count in the existing prototype. They thought they were acting on a handful of invoices and were actually acting on the whole filtered list.

[00:06] Zoe: That matches what I saw in QA. The count sits in the page header and is easy to miss once a filter is applied.

## Security requirement

[00:11] Ethan: Security requires explicit confirmation for bulk actions above 100 invoices. That is not negotiable for the first release.

## Options discussed

- Execute immediately and show a toast confirming what happened.
- Build a full undo and rollback framework.
- Add a review-and-confirm step before execution.

[00:19] Priya: Undo and rollback need recovery capabilities we do not have for invoices yet. That is a bigger project than this release.

[00:24] Daniel: A toast only tells people what already happened. It does not help them check scope first.

## Direction

[00:31] Maya: So the direction is a review-and-confirm step before execution, with an audit event recorded. We rule out the toast, and we defer undo and rollback.

## Open items

- Should confirmation thresholds vary by action type?
- How should partial permissions affect the exception list?

