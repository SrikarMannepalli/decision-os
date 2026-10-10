---
id: FOLLOW-001
title: "Threshold clarification"
type: Follow-up
project: PRJ-101
authors:
  - maya-chen
  - arjun-mehta
  - priya-nair
createdAt: 2026-10-08
decisions:
  - DEC-001
summary: "Follow-up clarifying that the 25,000-line threshold is provisional."
---
## Question raised
Is 25,000 invoice lines a real performance boundary?

## Clarification
No. The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs. Invoice line count may not be the best predictor of performance.

## What would change it
The new load-test report from Priya Nair, due October 14, 2026, should show whether line count predicts run time or whether another signal does. Until then the threshold stays as is.

## Owners
- Decision: Maya Chen
- Profiling and load-test report: Priya Nair
