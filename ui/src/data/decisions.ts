import type { Decision } from "@/types";

export const decisions: Decision[] = [
  {
    id: "DEC-001",
    title: "Phase rollout of large-account reconciliation",
    projectId: "PRJ-101",
    status: "Approved with follow-up",
    ownerId: "maya-chen",
    technicalOwnerId: "priya-nair",
    contributorIds: ["arjun-mehta", "priya-nair", "zoe-park", "leo-fischer", "daniel-okafor", "sam-rivera"],
    approverIds: ["maya-chen", "arjun-mehta"],
    decidedAt: "2026-10-01",
    createdAt: "2026-09-26",
    updatedAt: "2026-10-08",
    problem:
      "A 30,000-line reconciliation run showed p95 latency of 8.4 seconds against a target below 5 seconds. Small-account runs showed p95 latency at or below 3.2 seconds across 12 test runs. The team did not yet know whether query-plan optimization would close the gap for large runs.",
    finalDecision:
      "Launch to small and mid-sized accounts first. Keep accounts processing more than 25,000 invoice lines per run behind a feature flag until fresh load-test evidence meets the agreed target.",
    rationale: [
      "Large-run performance was 8.4 s p95 against a target below 5 s, and engineering could not yet predict whether query-plan work would fix it. [ZOOM-001] [ENG-001]",
      "The smaller-account path passed its current test suite (p95 at or below 3.2 s across 12 runs), so holding every account back would block a cohort that is ready. [ZOOM-001] [SLACK-001]",
      "A feature flag lets large accounts be admitted gradually once new evidence exists. [ADR-001] [PRD-001]",
    ],
    alternatives: [
      {
        title: "Launch to all accounts immediately",
        disposition: "Rejected",
        rationale: "Large-run performance remains uncertain, and a slow first experience would land on the accounts with the most invoice volume.",
        artifactIds: ["ZOOM-001", "ADR-001"],
      },
      {
        title: "Delay the entire release",
        disposition: "Rejected",
        rationale: "The smaller-account path passed its current test suite, so a full delay would hold back a cohort that is ready.",
        artifactIds: ["ZOOM-001", "SLACK-001"],
      },
      {
        title: "Phase the rollout behind a feature flag",
        disposition: "Selected",
        rationale: "Ships the ready cohort now and gates large runs until fresh load-test evidence meets the target.",
        artifactIds: ["ADR-001", "PRD-001", "ENG-001"],
      },
    ],
    caveats: [
      "The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs. Invoice line count may not be the best predictor of performance. [FOLLOW-001]",
    ],
    openQuestions: [
      "Is invoice line count the right gating signal, or should the flag use another predictor of run time? [FOLLOW-001]",
      "Will query-plan optimization bring large runs under the 5 s p95 target? [SLACK-001]",
    ],
    followUps: [
      {
        id: "FU-001",
        description: "Profile the query plan and deliver a new load-test report for large reconciliation runs.",
        ownerId: "priya-nair",
        dueDate: "2026-10-14",
        status: "Open",
        artifactIds: ["ZOOM-001", "ADR-001", "FOLLOW-001"],
      },
    ],
    supersedes: [],
    supersededBy: [],
    artifactIds: ["ZOOM-001", "SLACK-001", "PRD-001", "ADR-001", "DES-001", "ENG-001", "FOLLOW-001"],
  },
  {
    id: "DEC-002",
    title: "Review step for bulk invoice actions",
    projectId: "PRJ-102",
    status: "Approved",
    ownerId: "maya-chen",
    contributorIds: ["leo-fischer", "ethan-cole", "daniel-okafor", "priya-nair", "zoe-park"],
    approverIds: ["maya-chen", "ethan-cole"],
    decidedAt: "2026-09-24",
    createdAt: "2026-09-18",
    updatedAt: "2026-10-02",
    problem:
      "A synthetic usability study found that 4 of 8 participants missed the selected invoice count in the existing prototype. Security requires explicit confirmation for bulk actions above 100 invoices.",
    finalDecision:
      "Add a review-and-confirm step showing the selected invoice count, the affected total, an action summary, and a downloadable exception list, with explicit confirmation for operations above 100 invoices. Record an audit event containing the actor, action type, selection count, and timestamp.",
    rationale: [
      "4 of 8 participants in the synthetic usability study missed the selected invoice count, so scope has to be visible before execution. [ZOOM-002] [PRD-002]",
      "Security requires explicit confirmation for bulk actions above 100 invoices. [SLACK-002] [ADR-002]",
      "An audit event (actor, action type, selection count, timestamp) makes bulk operations traceable. [ADR-002] [ENG-002]",
    ],
    alternatives: [
      {
        title: "Immediate execution with a toast",
        disposition: "Rejected",
        rationale: "Users need to review the operation's scope before execution; a toast only reports what already happened.",
        artifactIds: ["ZOOM-002", "ADR-002"],
      },
      {
        title: "Full undo and rollback framework",
        disposition: "Deferred",
        rationale: "It requires broader recovery capabilities than the first release can support.",
        artifactIds: ["ZOOM-002", "ADR-002"],
      },
      {
        title: "Review-and-confirm step",
        disposition: "Selected",
        rationale: "Chosen as the first-release approach: it makes scope visible and satisfies the security confirmation requirement.",
        artifactIds: ["ADR-002", "PRD-002", "DES-002"],
      },
    ],
    caveats: [],
    openQuestions: [
      "Should confirmation thresholds vary by action type? [SLACK-002]",
      "How should partial permissions affect exception-list generation? [ENG-002]",
    ],
    followUps: [],
    supersedes: [],
    supersededBy: [],
    artifactIds: ["ZOOM-002", "SLACK-002", "PRD-002", "ADR-002", "DES-002", "ENG-002"],
  },
  {
    id: "DEC-003",
    title: "Explainability for cash-flow forecasts",
    projectId: "PRJ-103",
    status: "Proposed",
    ownerId: "nadia-brooks",
    contributorIds: ["leo-fischer", "maya-chen", "sam-rivera"],
    approverIds: [],
    decidedAt: null,
    createdAt: "2026-10-01",
    updatedAt: "2026-10-08",
    problem:
      "Early discovery suggests finance users want to understand which expected payments and assumptions influence forecast changes. The current evidence comes from only six discovery conversations and is not representative.",
    finalDecision: null,
    leadingProposal: "Show the three largest forecast drivers with source labels and last-updated dates.",
    rationale: [
      "Discovery so far points to a need to see which expected payments and assumptions move the forecast. [ZOOM-003]",
      "The evidence base is six conversations, which is not representative, so no final decision has been made. [ZOOM-003] [FOLLOW-002]",
    ],
    alternatives: [
      {
        title: "Show the three largest forecast drivers with source labels and last-updated dates",
        disposition: "Proposed",
        rationale: "This is the leading proposal only. It has not been approved and no final decision has been made.",
        artifactIds: ["PRD-003", "DES-003"],
      },
      {
        title: "Display a forecast confidence score first, with explanatory drivers below",
        disposition: "Under consideration",
        rationale: "Still under consideration as the alternative variant. It is not rejected or deferred; Leo is prototyping both variants.",
        artifactIds: ["SLACK-003", "DES-003"],
      },
    ],
    caveats: [
      "No final decision has been made. The leading proposal must not be treated as approved.",
      "Evidence comes from six discovery conversations and is not representative.",
    ],
    openQuestions: [
      "Should a confidence score appear? [SLACK-003]",
      "How should stale or low-quality inputs be surfaced? [DES-003]",
      "Can users understand ranked drivers without interpreting them as definitive causes? [ZOOM-003]",
    ],
    followUps: [
      {
        id: "FU-002",
        description: "Conduct five additional discovery interviews.",
        ownerId: "nadia-brooks",
        dueDate: "2026-10-16",
        status: "Open",
        artifactIds: ["ZOOM-003", "FOLLOW-002"],
      },
      {
        id: "FU-003",
        description: "Prototype both the drivers-first and confidence-score-first variants.",
        ownerId: "leo-fischer",
        status: "Open",
        artifactIds: ["DES-003", "FOLLOW-002"],
      },
    ],
    supersedes: [],
    supersededBy: [],
    artifactIds: ["ZOOM-003", "SLACK-003", "PRD-003", "DES-003", "FOLLOW-002"],
  },
];

export const decisionById = (id: string): Decision | undefined => decisions.find((d) => d.id === id);
