---
id: SLACK-001
title: "Large-run latency and rollout flag"
type: Slack thread
project: PRJ-101
authors:
  - maya-chen
  - arjun-mehta
  - priya-nair
  - sam-rivera
createdAt: 2026-09-30
decisions:
  - DEC-001
summary: "Follow-on thread agreeing the feature-flag approach after the peak-load review."
---
#recon-rollout

Maya Chen: Recap of the review: small accounts are good to go, large runs are not. Do we all agree on gating by run size rather than delaying everything?

Arjun Mehta: Yes. I'd rather ship the cohort that passed than hold everyone back. For the big runs I don't want to promise anything until we've profiled.

Priya Nair: Agreed on the flag. Honest caveat: I don't know yet if query-plan changes will get us under 5 seconds at 30,000 lines. I'll know more after profiling.

Sam Rivera: For customer conversations, can I say large accounts are coming later, with no date?

Maya Chen: Yes. Say large-account support follows once we have fresh load-test evidence. Don't commit to a date.

Arjun Mehta: 25,000 lines is where we're drawing the line for now. It's a guardrail, not a measured breakpoint.
