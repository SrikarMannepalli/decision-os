import type { SeedDocument } from "@/types";

export const dec001Documents: SeedDocument[] = [
  {
    id: "ZOOM-001",
    title: "Reconciliation rollout and peak-load review",
    type: "Zoom transcript",
    projectId: "PRJ-101",
    authorIds: ["maya-chen", "arjun-mehta", "priya-nair", "zoe-park", "sam-rivera"],
    createdAt: "2026-09-30",
    decisionIds: ["DEC-001"],
    summary: "Review of load-test results that led to a phased rollout of large-account reconciliation.",
    content: `## Attendees
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
Maya Chen: Agreed. I'll own the decision and record it as an ADR.`,
    excerpts: [
      {
        id: "e1",
        label: "A 30,000-line run showed p95 latency of 8.4 s against a target below 5 s.",
        text: "The 30,000-line run came back with p95 latency of 8.4 seconds. Our target is below 5 seconds.",
      },
      {
        id: "e2",
        label: "Small-account runs stayed at or below 3.2 s p95 across 12 test runs.",
        text: "For small accounts we ran 12 test runs and p95 stayed at or below 3.2 seconds every time.",
      },
      {
        id: "e3",
        label: "Product wanted to launch to everyone; Engineering would not commit to large-run performance.",
        text: "My preference was to launch to everyone and fix large runs as we go.\nArjun Mehta: I'm not comfortable launching to every account when we can't predict large-run performance.",
      },
    ],
  },
  {
    id: "SLACK-001",
    title: "Large-run latency and rollout flag",
    type: "Slack thread",
    projectId: "PRJ-101",
    authorIds: ["maya-chen", "arjun-mehta", "priya-nair", "sam-rivera"],
    createdAt: "2026-09-30",
    decisionIds: ["DEC-001"],
    summary: "Follow-on thread agreeing the feature-flag approach after the peak-load review.",
    content: `#recon-rollout

Maya Chen: Recap of the review: small accounts are good to go, large runs are not. Do we all agree on gating by run size rather than delaying everything?

Arjun Mehta: Yes. I'd rather ship the cohort that passed than hold everyone back. For the big runs I don't want to promise anything until we've profiled.

Priya Nair: Agreed on the flag. Honest caveat: I don't know yet if query-plan changes will get us under 5 seconds at 30,000 lines. I'll know more after profiling.

Sam Rivera: For customer conversations, can I say large accounts are coming later, with no date?

Maya Chen: Yes. Say large-account support follows once we have fresh load-test evidence. Don't commit to a date.

Arjun Mehta: 25,000 lines is where we're drawing the line for now. It's a guardrail, not a measured breakpoint.`,
    excerpts: [
      {
        id: "e1",
        label: "Engineering preferred shipping the cohort that passed and gating large runs.",
        text: "I'd rather ship the cohort that passed than hold everyone back.",
      },
      {
        id: "e2",
        label: "It is not yet known whether query-plan changes will get large runs under 5 s.",
        text: "I don't know yet if query-plan changes will get us under 5 seconds at 30,000 lines.",
      },
      {
        id: "e3",
        label: "The 25,000-line line is a guardrail, not a measured breakpoint.",
        text: "25,000 lines is where we're drawing the line for now. It's a guardrail, not a measured breakpoint.",
      },
    ],
  },
  {
    id: "PRD-001",
    title: "Invoice reconciliation phased rollout",
    type: "PRD",
    projectId: "PRJ-101",
    authorIds: ["maya-chen"],
    createdAt: "2026-09-26",
    decisionIds: ["DEC-001"],
    summary: "Product requirements for releasing invoice reconciliation in phases.",
    content: `## Problem
Finance teams at mid-market customers spend hours reconciling payments against invoices. The new reconciliation engine reduces that time, but large runs are not yet proven to meet the performance target.

## Goals
- Release reconciliation to the cohort that is ready without waiting on large-run work.
- Meet a p95 latency target below 5 seconds for every cohort that is admitted.

## Rollout plan
- Phase 1: small and mid-sized accounts.
- Phase 2: accounts processing more than 25,000 invoice lines per run, enabled behind a feature flag once fresh load-test evidence meets the target.

## Success metrics
- p95 reconciliation latency below 5 seconds per cohort.
- Reconciliation completion rate for admitted accounts.

## Risks
- Large-run performance is unproven; admission to Phase 2 depends on new evidence.
- The line-count threshold is provisional and may need to change.`,
    excerpts: [
      {
        id: "e1",
        label: "The PRD splits rollout into a ready cohort now and a flagged large-account phase later.",
        text: "- Phase 1: small and mid-sized accounts.\n- Phase 2: accounts processing more than 25,000 invoice lines per run, enabled behind a feature flag once fresh load-test evidence meets the target.",
      },
      {
        id: "e2",
        label: "The line-count threshold is listed as a risk because it is provisional.",
        text: "The line-count threshold is provisional and may need to change.",
      },
    ],
  },
  {
    id: "ADR-001",
    title: "Gate large reconciliation runs behind a feature flag",
    type: "ADR",
    projectId: "PRJ-101",
    authorIds: ["maya-chen", "arjun-mehta"],
    createdAt: "2026-10-01",
    decisionIds: ["DEC-001"],
    summary: "Records the decision to phase the reconciliation rollout and gate large runs.",
    content: `## Status
Accepted with follow-up. Decided 2026-10-01 by Maya Chen (decision owner) with Arjun Mehta (engineering).

## Context
A 30,000-line reconciliation run showed p95 latency of 8.4 seconds against a target below 5 seconds. Small-account runs showed p95 latency at or below 3.2 seconds across 12 test runs.

## Decision
Launch to small and mid-sized accounts first. Keep accounts processing more than 25,000 invoice lines per run behind a feature flag until fresh load-test evidence meets the agreed target.

## Alternatives considered
- Launch to all accounts immediately: rejected because large-run performance remains uncertain.
- Delay the entire release: rejected because the smaller-account path passed its current test suite.
- Phase the rollout behind a feature flag: selected.

## Consequences
- Large accounts do not receive reconciliation until the flag is lifted.
- The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs.

## Follow-up
Priya Nair will profile the query plan and provide a new load-test report by October 14, 2026.`,
    excerpts: [
      {
        id: "e1",
        label: "Small and mid-sized accounts launch first; large runs stay behind a feature flag.",
        text: "Launch to small and mid-sized accounts first. Keep accounts processing more than 25,000 invoice lines per run behind a feature flag until fresh load-test evidence meets the agreed target.",
      },
      {
        id: "e2",
        label: "Launching to everyone and delaying the whole release were both rejected.",
        text: "- Launch to all accounts immediately: rejected because large-run performance remains uncertain.\n- Delay the entire release: rejected because the smaller-account path passed its current test suite.",
      },
      {
        id: "e3",
        label: "The 25,000-line threshold is provisional, not a proven boundary.",
        text: "The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs.",
      },
    ],
  },
  {
    id: "DES-001",
    title: "Reconciliation rollout states and operational visibility",
    type: "Design doc",
    projectId: "PRJ-101",
    authorIds: ["leo-fischer", "daniel-okafor"],
    createdAt: "2026-10-02",
    decisionIds: ["DEC-001"],
    summary: "Design for how the flagged rollout appears to customers and internal operators.",
    content: `## Goal
Make the phased rollout understandable to customers on the waitlist and observable to operators.

## Customer-facing states
- Available: the account can run reconciliation.
- Coming soon: the account is in the flagged cohort. The message says large-account support follows once new performance evidence is reviewed. No date is shown.

## Operator view
- A cohort indicator on each account shows whether the large-run flag is on or off.
- A run history table shows run size and latency so operators can see how runs behave.

## Open design question
The copy for the flagged state must not imply a date. The threshold is provisional, so the message avoids quoting the line count to customers.`,
    excerpts: [
      {
        id: "e1",
        label: "Flagged accounts see a 'Coming soon' state with no date.",
        text: "Coming soon: the account is in the flagged cohort. The message says large-account support follows once new performance evidence is reviewed. No date is shown.",
      },
      {
        id: "e2",
        label: "Customer copy avoids quoting the provisional line count.",
        text: "The threshold is provisional, so the message avoids quoting the line count to customers.",
      },
    ],
  },
  {
    id: "ENG-001",
    title: "Reconciliation cohort metrics and flag gate",
    type: "Engineering update",
    projectId: "PRJ-101",
    authorIds: ["priya-nair", "arjun-mehta"],
    createdAt: "2026-10-05",
    decisionIds: ["DEC-001"],
    summary: "Engineering status on the flag gate and per-cohort latency metrics.",
    content: `## Status
The feature-flag gate is implemented. Accounts processing more than 25,000 invoice lines per run are held behind it.

## Metrics
- Per-cohort p95 latency is now recorded for every reconciliation run.
- Test baseline: 30,000-line run at p95 8.4 seconds against a target below 5 seconds. Small-account runs at or below 3.2 seconds across 12 runs.

## Not yet known
Query-plan profiling has not been completed. It is not yet known whether optimization will bring large runs under the target.

## Next
Priya Nair will profile the query plan and deliver a new load-test report by October 14, 2026.`,
    excerpts: [
      {
        id: "e1",
        label: "The flag gate is implemented and holds accounts over 25,000 lines per run.",
        text: "The feature-flag gate is implemented. Accounts processing more than 25,000 invoice lines per run are held behind it.",
      },
      {
        id: "e2",
        label: "Query-plan profiling is not complete, so the effect of optimization is unknown.",
        text: "Query-plan profiling has not been completed. It is not yet known whether optimization will bring large runs under the target.",
      },
    ],
  },
  {
    id: "FOLLOW-001",
    title: "Threshold clarification",
    type: "Follow-up",
    projectId: "PRJ-101",
    authorIds: ["maya-chen", "arjun-mehta", "priya-nair"],
    createdAt: "2026-10-08",
    decisionIds: ["DEC-001"],
    summary: "Follow-up clarifying that the 25,000-line threshold is provisional.",
    content: `## Question raised
Is 25,000 invoice lines a real performance boundary?

## Clarification
No. The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs. Invoice line count may not be the best predictor of performance.

## What would change it
The new load-test report from Priya Nair, due October 14, 2026, should show whether line count predicts run time or whether another signal does. Until then the threshold stays as is.

## Owners
- Decision: Maya Chen
- Profiling and load-test report: Priya Nair`,
    excerpts: [
      {
        id: "e1",
        label: "The 25,000-line threshold is provisional and line count may not predict performance.",
        text: "The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs. Invoice line count may not be the best predictor of performance.",
      },
      {
        id: "e2",
        label: "The October 14, 2026 load-test report should show whether line count predicts run time.",
        text: "The new load-test report from Priya Nair, due October 14, 2026, should show whether line count predicts run time or whether another signal does.",
      },
    ],
  },
];
