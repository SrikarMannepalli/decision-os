---
id: SLACK-002
title: "Bulk action confirmation and exception list"
type: Slack thread
project: PRJ-102
authors:
  - ethan-cole
  - leo-fischer
  - maya-chen
  - daniel-okafor
createdAt: 2026-09-23
decisions:
  - DEC-002
summary: "Follow-up thread confirming the 100-invoice confirmation rule, the exception list on the review screen, and two open questions."
---
## #bulk-invoice-actions

Ethan Cole: Confirming for the record: anything above 100 invoices needs an explicit confirmation, not just a button click through the review screen.

Daniel Okafor: Understood. I will gate the confirm button on that rule in the review screen.

Leo Fischer: The review screen will include a downloadable exception list so operators can see which invoices will not be touched before they confirm.

Daniel Okafor: Does the exception list cover invoices the operator lacks permission to act on?

Maya Chen: Good question, and I do not have a final answer yet.

Maya Chen: Two things I do not want to lose: should confirmation thresholds vary by action type, and how do partial permissions affect the exception list? Not blocking for first release, but they are open.

Ethan Cole: Agreed that neither blocks the first release, as long as the 100-invoice rule holds for every action type.

