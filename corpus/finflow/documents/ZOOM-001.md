---
id: ZOOM-001
title: "Reconciliation rollout and peak-load review"
type: Zoom transcript
project: PRJ-101
authors:
  - maya-chen
  - arjun-mehta
  - priya-nair
  - zoe-park
  - sam-rivera
createdAt: 2026-09-30
decisions:
  - DEC-001
summary: "Review of load-test results that led to a phased rollout of large-account reconciliation."
---
## Attendees
Maya Chen, Arjun Mehta, Priya Nair, Zoe Park, Sam Rivera

## Load-test results
Zoe Park: The 30,000-line run came back with p95 latency of 8.4 seconds. Our target is below 5 seconds.
Zoe Park: For small accounts we ran 12 test runs and p95 stayed at or below 3.2 seconds every time.
Priya Nair: I haven't profiled the query plan yet, so I can't say whether optimization closes that gap for large runs.

## Product and Engineering positions
Maya Chen: Several mid-market customers expect reconciliation this quarter. My preference was to launch to everyone and fix large runs as we go.
Arjun Mehta: I'm not comfortable launching to every account when we can't predict large-run performance. The biggest accounts would hit the slow path first.
Sam Rivera: Delaying everything would be hard to explain to the smaller accounts that are ready now.

## Outcome
Maya Chen: Then we don't delay the release. We launch to small and mid-sized accounts and keep the largest runs behind a feature flag.
Arjun Mehta: I can support that. Gate accounts processing more than 25,000 invoice lines per run until we have fresh load-test evidence that meets the target.
Priya Nair: I'll profile the query plan and produce a new load-test report by October 14.
Maya Chen: Agreed. I'll own the decision and record it as an ADR.
