import type { Document } from "@/types";

export const dec003Documents: Document[] = [
  {
    id: "ZOOM-003",
    title: "Forecast explanation discovery review",
    type: "Zoom transcript",
    projectId: "PRJ-103",
    authorIds: ["nadia-brooks", "leo-fischer", "maya-chen", "sam-rivera"],
    createdAt: "2026-10-06",
    decisionIds: ["DEC-003"],
    summary:
      "Review of early discovery findings on forecast explanations; the team agreed no decision can be made on six conversations.",
    content: `## Attendees

Nadia Brooks, Leo Fischer, Maya Chen, Sam Rivera

## Discussion

Nadia Brooks: I want to be upfront about the evidence. We have six discovery conversations so far. That is a small sample and it is not representative of our mid-market base, so I don't think we can call anything final today.

Leo Fischer: What did people actually ask for?

Nadia Brooks: Finance users want to understand which expected payments and assumptions influence a forecast when the number changes from one week to the next.

Maya Chen: So the leading idea is to show the three largest forecast drivers, each with a source label and a last-updated date?

Nadia Brooks: Yes. That is the leading proposal. It is a proposal, not a decision.

Sam Rivera: Customers will ask whether they can trust the forecast. A confidence score might answer that faster than a list of drivers.

Leo Fischer: Or it might invite people to treat the score as a guarantee. I'd like to prototype both and compare them.

## Concerns raised

- Six conversations are not enough to rank the two approaches.
- Ranked drivers could be read as definitive causes of a forecast change rather than the largest contributing inputs.

## Outcome

> No final decision was made in this meeting.

- Nadia will run five additional discovery interviews by October 16, 2026.
- Leo will prototype both variants.`,
    excerpts: [
      {
        id: "e1",
        label: "No final decision on forecast explainability was made in the discovery review.",
        text: "No final decision was made in this meeting.",
      },
      {
        id: "e2",
        label: "The discovery evidence is only six conversations and is not representative.",
        text: "We have six discovery conversations so far. That is a small sample and it is not representative of our mid-market base",
      },
      {
        id: "e3",
        label: "Ranked drivers risk being read as definitive causes.",
        text: "Ranked drivers could be read as definitive causes of a forecast change rather than the largest contributing inputs.",
      },
    ],
  },
  {
    id: "SLACK-003",
    title: "Cash-flow forecast explanations",
    type: "Slack thread",
    projectId: "PRJ-103",
    authorIds: ["nadia-brooks", "sam-rivera", "leo-fischer", "maya-chen"],
    createdAt: "2026-10-07",
    decisionIds: ["DEC-003"],
    summary:
      "Slack recap of the forecast explanation discussion, including the open question of whether a confidence score should appear.",
    content: `## #proj-cashflow-forecast

Nadia Brooks (10:12): Recap of yesterday's forecast explanation review. Leading proposal: show the three largest forecast drivers with source labels and last-updated dates. Alternative: lead with a forecast confidence score and put the drivers underneath. Nothing is decided yet.

Sam Rivera (10:20): From the customer side, the first question is usually "can I trust this number?" A confidence score speaks to that directly.

Maya Chen (10:31): Agreed that's a real need, but I don't want us to ship a score we can't explain. What would sit behind it?

Nadia Brooks (10:34): That is exactly the open question: should a confidence score appear at all? I don't have enough evidence to say yes or no.

Leo Fischer (10:41): I'll prototype both so we can put them in front of the next interviewees instead of debating in the abstract.

Sam Rivera (10:45): Works for me. Happy to introduce a couple of customers for the extra interviews.

Nadia Brooks (10:47): Thanks. To be clear for anyone catching up on this thread: the drivers-first version is the leading proposal, not an approved decision.`,
    excerpts: [
      {
        id: "e1",
        label: "The drivers-first version is the leading proposal, not an approved decision.",
        text: "the drivers-first version is the leading proposal, not an approved decision.",
      },
      {
        id: "e2",
        label: "Whether a confidence score should appear at all is an open question.",
        text: "should a confidence score appear at all? I don't have enough evidence to say yes or no.",
      },
    ],
  },
  {
    id: "PRD-003",
    title: "Explainable cash-flow forecast",
    type: "PRD",
    projectId: "PRJ-103",
    authorIds: ["nadia-brooks", "maya-chen"],
    createdAt: "2026-10-01",
    decisionIds: ["DEC-003"],
    summary:
      "Draft PRD framing the need for forecast explanations and listing the leading proposal and the open questions; not approved.",
    content: `## Status

Draft. The approach described here is proposed and has not been approved.

## Problem

Finance users see a near-term cash forecast change but cannot tell which expected payments and assumptions caused the change. Early discovery suggests they want that visibility.

## Evidence so far

Six discovery conversations. This is not a representative sample and should not be used to claim a settled user need.

## Leading proposal

Show the three largest forecast drivers, each with a source label and a last-updated date.

## Alternative under consideration

Display a forecast confidence score first, with the explanatory drivers below it.

## Open questions

- Should a confidence score appear?
- How should stale or low-quality inputs be surfaced?
- Can users understand ranked drivers without interpreting them as definitive causes?

## Next steps

- Nadia Brooks to conduct five additional discovery interviews by October 16, 2026.
- Leo Fischer to prototype both variants.
- Revisit this PRD once that evidence has been reviewed.`,
    excerpts: [
      {
        id: "e1",
        label: "The PRD describes the approach as proposed and not approved.",
        text: "Draft. The approach described here is proposed and has not been approved.",
      },
      {
        id: "e2",
        label: "The leading proposal is the three largest forecast drivers with source labels and last-updated dates.",
        text: "Show the three largest forecast drivers, each with a source label and a last-updated date.",
      },
      {
        id: "e3",
        label: "The evidence base is six conversations and is not representative.",
        text: "Six discovery conversations. This is not a representative sample and should not be used to claim a settled user need.",
      },
    ],
  },
  {
    id: "DES-003",
    title: "Forecast explanation experiment variants",
    type: "Design doc",
    projectId: "PRJ-103",
    authorIds: ["leo-fischer", "nadia-brooks"],
    createdAt: "2026-10-08",
    decisionIds: ["DEC-003"],
    summary:
      "Design notes for two prototype variants of the forecast explanation, with open design questions about stale inputs.",
    content: `## Purpose

These variants exist so both approaches can be tested in the additional discovery interviews. Neither variant is a final design.

## Variant A: drivers first (leading proposal)

- Lists the three largest forecast drivers.
- Each driver shows a source label and a last-updated date.
- Wording avoids implying that a driver is the definitive cause of a change.

## Variant B: confidence score first

- Opens with a forecast confidence score.
- The explanatory drivers appear below the score.
- Requires a clear explanation of what the score represents.

## Open design questions

- How should stale or low-quality inputs be surfaced in either variant?
- Does a ranked list read as a cause, even with careful wording?
- Should the confidence score appear at all?

## Status

Prototype work in progress. Leo Fischer is building both variants for the next round of interviews.`,
    excerpts: [
      {
        id: "e1",
        label: "Both variants are experiments and neither is a final design.",
        text: "Neither variant is a final design.",
      },
      {
        id: "e2",
        label: "Handling of stale or low-quality inputs is still an open design question.",
        text: "How should stale or low-quality inputs be surfaced in either variant?",
      },
      {
        id: "e3",
        label: "Variant B leads with a confidence score and shows drivers below it.",
        text: "Opens with a forecast confidence score.",
      },
    ],
  },
  {
    id: "FOLLOW-002",
    title: "Forecast explanation decision checkpoint",
    type: "Follow-up",
    projectId: "PRJ-103",
    authorIds: ["nadia-brooks", "leo-fischer", "maya-chen"],
    createdAt: "2026-10-08",
    decisionIds: ["DEC-003"],
    summary:
      "Checkpoint confirming the forecast explanation decision is deferred until the extra interviews and both prototypes are reviewed.",
    content: `## Checkpoint

Decision on forecast explanations: not yet made. The decision is deferred until the additional interviews are complete and both prototypes have been reviewed.

## What is still needed

- Five additional discovery interviews, owned by Nadia Brooks, due October 16, 2026.
- Prototypes of both variants, owned by Leo Fischer.
- A review of the combined evidence by Nadia Brooks, Leo Fischer, and Maya Chen.

## Questions the review must answer

- Should a confidence score appear?
- How should stale or low-quality inputs be surfaced?
- Can users understand ranked drivers without interpreting them as definitive causes?

## Current position

The leading proposal is to show the three largest forecast drivers with source labels and last-updated dates. It remains a proposal. Until the review happens, DEC-003 stays in Proposed status.`,
    excerpts: [
      {
        id: "e1",
        label: "The decision is deferred until the interviews and prototypes are reviewed.",
        text: "Decision on forecast explanations: not yet made. The decision is deferred until the additional interviews are complete and both prototypes have been reviewed.",
      },
      {
        id: "e2",
        label: "Nadia owns five additional interviews due October 16, 2026.",
        text: "Five additional discovery interviews, owned by Nadia Brooks, due October 16, 2026.",
      },
      {
        id: "e3",
        label: "DEC-003 stays in Proposed status until the review happens.",
        text: "Until the review happens, DEC-003 stays in Proposed status.",
      },
    ],
  },
];
