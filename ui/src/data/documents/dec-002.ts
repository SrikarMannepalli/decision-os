import type { Document } from "@/types";

// Excerpt texts are defined once and interpolated into each document's content,
// so every excerpt is guaranteed to be a verbatim substring of its source.

const zoom = {
  study:
    "Leo: In the synthetic usability study, 4 of 8 participants missed the selected invoice count in the existing prototype. They thought they were acting on a handful of invoices and were actually acting on the whole filtered list.",
  security:
    "Ethan: Security requires explicit confirmation for bulk actions above 100 invoices. That is not negotiable for the first release.",
  decision:
    "Maya: So the direction is a review-and-confirm step before execution, with an audit event recorded. We rule out the toast, and we defer undo and rollback.",
};

const slack = {
  confirm:
    "Ethan Cole: Confirming for the record: anything above 100 invoices needs an explicit confirmation, not just a button click through the review screen.",
  exception:
    "Leo Fischer: The review screen will include a downloadable exception list so operators can see which invoices will not be touched before they confirm.",
  open:
    "Maya Chen: Two things I do not want to lose: should confirmation thresholds vary by action type, and how do partial permissions affect the exception list? Not blocking for first release, but they are open.",
};

const prd = {
  problem:
    "In a synthetic usability study, 4 of 8 participants missed the selected invoice count in the existing prototype. Finance operators need to see the scope of a bulk operation before it runs.",
  requirement:
    "The review-and-confirm step must show the selected invoice count, the affected total, an action summary, and a downloadable exception list.",
  security:
    "Operations above 100 invoices require explicit confirmation, as required by Security.",
};

const adr = {
  decision:
    "We will add a review-and-confirm step to bulk invoice actions, with explicit confirmation for operations above 100 invoices.",
  audit:
    "Each bulk operation records an audit event containing the actor, action type, selection count, and timestamp.",
  alternatives:
    "Immediate execution with a toast is rejected because users need to review the operation's scope before execution. A full undo and rollback framework is deferred because it requires broader recovery capabilities.",
};

const des = {
  layout:
    "The review screen shows four things in order: the selected invoice count, the affected total, an action summary, and a link to download the exception list.",
  confirm:
    "For operations above 100 invoices, the primary button stays disabled until the operator explicitly confirms the selection count.",
};

const eng = {
  audit:
    "The audit event carries the actor, action type, selection count, and timestamp, and is written when the operation is confirmed.",
  sizing:
    "Exception-list generation for very large selections still needs sizing work, and partial permissions are not yet reflected in how the list is built.",
};

export const dec002Documents: Document[] = [
  {
    id: "ZOOM-002",
    title: "Bulk invoice action safety review",
    type: "Zoom transcript",
    projectId: "PRJ-102",
    authorIds: ["maya-chen", "leo-fischer", "ethan-cole", "daniel-okafor", "priya-nair", "zoe-park"],
    createdAt: "2026-09-22",
    decisionIds: ["DEC-002"],
    summary: "Product, Design, Security, and Engineering review the usability findings and agree on a review-and-confirm direction for bulk invoice actions.",
    content: `## Attendees

Maya Chen, Leo Fischer, Ethan Cole, Daniel Okafor, Priya Nair, Zoe Park.

## Usability findings

[00:02] ${zoom.study}

[00:06] Zoe: That matches what I saw in QA. The count sits in the page header and is easy to miss once a filter is applied.

## Security requirement

[00:11] ${zoom.security}

## Options discussed

- Execute immediately and show a toast confirming what happened.
- Build a full undo and rollback framework.
- Add a review-and-confirm step before execution.

[00:19] Priya: Undo and rollback need recovery capabilities we do not have for invoices yet. That is a bigger project than this release.

[00:24] Daniel: A toast only tells people what already happened. It does not help them check scope first.

## Direction

[00:31] ${zoom.decision}

## Open items

- Should confirmation thresholds vary by action type?
- How should partial permissions affect the exception list?
`,
    excerpts: [
      { id: "e1", label: "The team chose review-and-confirm, ruled out the toast, and deferred undo and rollback.", text: zoom.decision },
      { id: "e2", label: "A synthetic usability study found 4 of 8 participants missed the selected invoice count.", text: zoom.study },
      { id: "e3", label: "Security requires explicit confirmation for bulk actions above 100 invoices.", text: zoom.security },
    ],
  },
  {
    id: "SLACK-002",
    title: "Bulk action confirmation and exception list",
    type: "Slack thread",
    projectId: "PRJ-102",
    authorIds: ["ethan-cole", "leo-fischer", "maya-chen", "daniel-okafor"],
    createdAt: "2026-09-23",
    decisionIds: ["DEC-002"],
    summary: "Follow-up thread confirming the 100-invoice confirmation rule, the exception list on the review screen, and two open questions.",
    content: `## #bulk-invoice-actions

${slack.confirm}

Daniel Okafor: Understood. I will gate the confirm button on that rule in the review screen.

${slack.exception}

Daniel Okafor: Does the exception list cover invoices the operator lacks permission to act on?

Maya Chen: Good question, and I do not have a final answer yet.

${slack.open}

Ethan Cole: Agreed that neither blocks the first release, as long as the 100-invoice rule holds for every action type.
`,
    excerpts: [
      { id: "e1", label: "Security restated that operations above 100 invoices need explicit confirmation.", text: slack.confirm },
      { id: "e2", label: "The review screen includes a downloadable exception list.", text: slack.exception },
      { id: "e3", label: "Per-action thresholds and partial permissions remain open questions.", text: slack.open },
    ],
  },
  {
    id: "PRD-002",
    title: "Safe bulk invoice actions",
    type: "PRD",
    projectId: "PRJ-102",
    authorIds: ["maya-chen"],
    createdAt: "2026-09-18",
    decisionIds: ["DEC-002"],
    summary: "Product requirements for a review-and-confirm step that makes the scope of a bulk invoice operation visible before it runs.",
    content: `## Problem

${prd.problem}

## Goal

Allow finance operators to apply actions to multiple invoices safely.

## Requirements

${prd.requirement}

${prd.security}

- Record an audit event for each bulk operation.
- Operators can leave the review step without any change being applied.

## Out of scope for the first release

- A full undo and rollback framework.

## Open questions

- Should confirmation thresholds vary by action type?
- How should partial permissions affect exception-list generation?
`,
    excerpts: [
      { id: "e1", label: "The review step must show the count, affected total, action summary, and a downloadable exception list.", text: prd.requirement },
      { id: "e2", label: "A synthetic usability study found 4 of 8 participants missed the selected invoice count.", text: prd.problem },
      { id: "e3", label: "Operations above 100 invoices require explicit confirmation.", text: prd.security },
    ],
  },
  {
    id: "ADR-002",
    title: "Require review and confirmation for bulk invoice actions",
    type: "ADR",
    projectId: "PRJ-102",
    authorIds: ["maya-chen", "ethan-cole"],
    createdAt: "2026-09-24",
    decisionIds: ["DEC-002"],
    summary: "Accepted record that bulk invoice actions go through a review-and-confirm step with an audit event.",
    content: `## Status

Accepted on 2026-09-24. Approved by Maya Chen and Ethan Cole.

## Context

A synthetic usability study found that 4 of 8 participants missed the selected invoice count. Security requires explicit confirmation for bulk actions above 100 invoices.

## Decision

${adr.decision}

The step shows the selected invoice count, the affected total, an action summary, and a downloadable exception list.

${adr.audit}

## Alternatives

${adr.alternatives}

## Consequences

- Bulk actions take one extra step for operators.
- Scope is visible before execution, and every bulk operation is traceable.
- Per-action confirmation thresholds and partial-permission handling remain open.
`,
    excerpts: [
      { id: "e1", label: "Bulk invoice actions require a review-and-confirm step, with explicit confirmation above 100 invoices.", text: adr.decision },
      { id: "e2", label: "The toast was rejected and undo/rollback was deferred.", text: adr.alternatives },
      { id: "e3", label: "Each bulk operation records an audit event with actor, action type, selection count, and timestamp.", text: adr.audit },
    ],
  },
  {
    id: "DES-002",
    title: "Bulk invoice review-and-confirm screen",
    type: "Design doc",
    projectId: "PRJ-102",
    authorIds: ["leo-fischer"],
    createdAt: "2026-09-29",
    decisionIds: ["DEC-002"],
    summary: "Design of the review-and-confirm screen, including its content order and the explicit confirmation behavior.",
    content: `## Purpose

Make the scope of a bulk operation obvious before anything runs.

## Layout

${des.layout}

## Confirmation behavior

${des.confirm}

- Operations at or below 100 invoices can proceed from the review screen with a single confirm action.
- The cancel action returns to the invoice list with the selection preserved.

## Exception list

The exception list is a downloadable file. It lists invoices that will not be affected by the operation.

## Open design questions

- Should the confirmation step differ by action type?
- How should the screen explain exceptions caused by partial permissions?
`,
    excerpts: [
      { id: "e1", label: "The review screen shows count, affected total, action summary, and an exception-list download.", text: des.layout },
      { id: "e2", label: "Above 100 invoices, the primary button stays disabled until the operator explicitly confirms.", text: des.confirm },
    ],
  },
  {
    id: "ENG-002",
    title: "Bulk action audit event and exception-list sizing",
    type: "Engineering update",
    projectId: "PRJ-102",
    authorIds: ["priya-nair", "daniel-okafor"],
    createdAt: "2026-10-02",
    decisionIds: ["DEC-002"],
    summary: "Engineering update on the audit event contract and the unresolved sizing and permissions questions for exception-list generation.",
    content: `## Status

Implementation of the review-and-confirm step is under way.

## Audit event

${eng.audit}

- Actor: the user who confirmed the operation.
- Action type: the bulk action that was applied.
- Selection count: the number of invoices in the selection.
- Timestamp: when the operation was confirmed.

## Exception list

${eng.sizing}

## Risks

- If partial permissions change which invoices are excluded, the exception list and the confirmed selection count could disagree.

## Open questions

- Should confirmation thresholds vary by action type?
- How should partial permissions affect exception-list generation?
`,
    excerpts: [
      { id: "e1", label: "The audit event carries actor, action type, selection count, and timestamp.", text: eng.audit },
      { id: "e2", label: "Exception-list sizing and partial-permission handling are still unresolved.", text: eng.sizing },
    ],
  },
];
