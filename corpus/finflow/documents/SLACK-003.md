---
id: SLACK-003
title: "Cash-flow forecast explanations"
type: Slack thread
project: PRJ-103
authors:
  - nadia-brooks
  - sam-rivera
  - leo-fischer
  - maya-chen
createdAt: 2026-10-07
decisions:
  - DEC-003
summary: "Slack recap of the forecast explanation discussion, including the open question of whether a confidence score should appear."
---
## #proj-cashflow-forecast

Nadia Brooks (10:12): Recap of yesterday's forecast explanation review. Leading proposal: show the three largest forecast drivers with source labels and last-updated dates. Alternative: lead with a forecast confidence score and put the drivers underneath. Nothing is decided yet.

Sam Rivera (10:20): From the customer side, the first question is usually "can I trust this number?" A confidence score speaks to that directly.

Maya Chen (10:31): Agreed that's a real need, but I don't want us to ship a score we can't explain. What would sit behind it?

Nadia Brooks (10:34): That is exactly the open question: should a confidence score appear at all? I don't have enough evidence to say yes or no.

Leo Fischer (10:41): I'll prototype both so we can put them in front of the next interviewees instead of debating in the abstract.

Sam Rivera (10:45): Works for me. Happy to introduce a couple of customers for the extra interviews.

Nadia Brooks (10:47): Thanks. To be clear for anyone catching up on this thread: the drivers-first version is the leading proposal, not an approved decision.
