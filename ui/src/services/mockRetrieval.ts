/**
 * Deterministic keyword/intent matcher over the seeded FinFlow knowledge base.
 *
 * This is NOT an LLM and NOT semantic search. It scores keywords against the
 * seeded decisions, detects a coarse question intent, and fills explicit answer
 * templates. Replace it by implementing `DecisionOSClient` against a real
 * RAG backend (see decisionOSService.ts).
 */
import { decisionById, decisions } from "@/data/decisions";
import { documentById, knownArtifactIds } from "@/data/documents";
import { employeeById } from "@/data/employees";
import { projectById } from "@/data/projects";
import type {
  AnswerSection,
  AssistantAnswer,
  ChatMessage,
  Decision,
  EvidenceReference,
} from "@/types";

export const INSUFFICIENT_EVIDENCE =
  "I couldn't find enough evidence in the available FinFlow documents to answer that confidently.";

export const SUGGESTED_PROMPTS = [
  "Why did we delay large-account reconciliation?",
  "What did we decide about bulk invoice actions?",
  "Which decisions are still unresolved?",
  "What alternatives did we consider for cash-flow forecasts?",
] as const;

export type Intent =
  | "overview"
  | "why"
  | "decided"
  | "alternatives"
  | "people"
  | "status"
  | "evidence"
  | "open"
  | "disagreement"
  | "superseded"
  | "threshold"
  | "portfolio";

/* ------------------------------------------------------------------ */
/* Question understanding                                              */
/* ------------------------------------------------------------------ */

const DECISION_KEYWORDS: Record<string, [string, number][]> = {
  "DEC-001": [
    ["reconcil", 3],
    ["large-account", 3],
    ["large account", 3],
    ["large run", 3],
    ["large-run", 3],
    ["25,000", 3],
    ["25000", 3],
    ["p95", 2],
    ["latency", 2],
    ["feature flag", 2],
    ["phased", 2],
    ["load test", 2],
    ["load-test", 2],
    ["query plan", 2],
    ["query-plan", 2],
    ["profil", 2],
    ["threshold", 1],
    ["rollout", 1],
  ],
  "DEC-002": [
    ["bulk", 3],
    ["review step", 3],
    ["review-and-confirm", 3],
    ["exception list", 3],
    ["exception-list", 3],
    ["audit", 2],
    ["undo", 2],
    ["rollback", 2],
    ["toast", 2],
    ["confirm", 2],
    ["100 invoices", 3],
    ["multiple invoices", 2],
  ],
  "DEC-003": [
    ["forecast", 3],
    ["cash-flow", 3],
    ["cash flow", 3],
    ["cashflow", 3],
    ["driver", 2],
    ["confidence score", 3],
    ["explainab", 3],
    ["explanation", 2],
    ["discovery", 2],
  ],
};

const INTENT_RULES: [Intent, RegExp][] = [
  ["superseded", /supersed|newer decision|replaced|overrid|still current|has (it|the decision) changed/],
  ["disagreement", /disagree|conflict|pushback|push back|tension|argu|debate|product and engineering/],
  ["alternatives", /alternativ|options|instead|rejected|considered|consider\b|other approaches|trade-?offs?/],
  ["people", /\bwho\b|owner|responsible|involved|stakeholder|\bpeople\b|approver/],
  ["status", /\b(is|was|has|been)\b.{0,40}(finali[sz]ed|approved|decided|settled|confirmed)|final decision|\bstatus\b/],
  ["evidence", /evidence|\bsources?\b|documents?|proof|support|cite|reference|where.{0,30}(discussed|documented)/],
  ["threshold", /threshold|25,?000/],
  ["open", /open question|unresolved|still open|next steps?|follow-?ups?|\bdue\b|deadline|pending|remaining|risks?\b|waiting/],
  ["why", /\bwhy\b|reason|rationale|\bdelay|postpone|how come/],
  ["decided", /what did we decide|what was decided|decide about|decision about|what.*decision/],
];

const PORTFOLIO_RE =
  /which decisions|what decisions|all (the )?decisions|decisions (are|do we|have we)|still (waiting|unresolved|pending)|waiting for follow-?up|outstanding|unresolved decisions/;

const DEICTIC_RE = /\b(it|that|this|they|those|them|its|there|also|and|what about|how about|the decision|the rollout|the current)\b/;

const CARRY_INTENTS: Intent[] = ["evidence", "superseded", "open", "alternatives", "disagreement", "threshold", "status"];

const ARTIFACT_REF_RE = /\b(dec|prj|zoom|slack|prd|adr|des|eng|follow)-\d{3}\b/gi;

interface ParsedQuestion {
  intent: Intent;
  decisionId: string | null;
  unknownRefs: string[];
  usedContext: boolean;
}

function detectIntent(q: string): Intent | null {
  if (PORTFOLIO_RE.test(q)) return "portfolio";
  for (const [intent, re] of INTENT_RULES) if (re.test(q)) return intent;
  return null;
}

function scoreDecisions(q: string): Map<string, number> {
  const scores = new Map<string, number>();
  const add = (id: string, n: number) => scores.set(id, (scores.get(id) ?? 0) + n);
  for (const [id, keywords] of Object.entries(DECISION_KEYWORDS)) {
    for (const [kw, weight] of keywords) if (q.includes(kw)) add(id, weight);
  }
  return scores;
}

function lastDecisionInHistory(history: ChatMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role === "assistant" && m.answer && m.answer.decisionIds.length === 1) return m.answer.decisionIds[0];
  }
  return null;
}

export function parseQuestion(question: string, history: ChatMessage[]): ParsedQuestion {
  const q = question.toLowerCase();
  const scores = scoreDecisions(q);
  const unknownRefs: string[] = [];

  for (const match of q.matchAll(ARTIFACT_REF_RE)) {
    const ref = match[0].toUpperCase();
    const decision = decisionById(ref);
    const project = projectById(ref);
    const doc = documentById(ref);
    if (decision) {
      scores.set(ref, (scores.get(ref) ?? 0) + 10);
    } else if (project) {
      for (const d of decisions) {
        if (d.projectId === ref) scores.set(d.id, (scores.get(d.id) ?? 0) + 10);
      }
    } else if (doc) {
      for (const id of doc.decisionIds) scores.set(id, (scores.get(id) ?? 0) + 10);
    } else {
      unknownRefs.push(ref);
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const matched = ranked.length > 0 ? ranked[0][0] : null;
  const detected = detectIntent(q);

  if (detected === "portfolio" && !matched) {
    return { intent: "portfolio", decisionId: null, unknownRefs, usedContext: false };
  }

  if (matched) {
    return { intent: detected === "portfolio" ? "status" : (detected ?? "overview"), decisionId: matched, unknownRefs, usedContext: false };
  }

  const prior = lastDecisionInHistory(history);
  const carries = detected !== null && (CARRY_INTENTS.includes(detected) || DEICTIC_RE.test(q));
  if (prior && carries && unknownRefs.length === 0) {
    return { intent: detected, decisionId: prior, unknownRefs, usedContext: true };
  }

  return { intent: detected ?? "overview", decisionId: null, unknownRefs, usedContext: false };
}

/* ------------------------------------------------------------------ */
/* Explicit answer templates                                           */
/* ------------------------------------------------------------------ */

type DirectTemplates = Partial<Record<Intent, string>> & { overview: string };

const DIRECT: Record<string, DirectTemplates> = {
  "DEC-001": {
    overview:
      "We didn't delay the entire reconciliation release. FinFlow chose a phased rollout because large reconciliation jobs were exceeding the performance target, while smaller-account workflows had passed the current test suite. [ADR-001]",
    decided:
      "FinFlow is rolling reconciliation out in phases: small and mid-sized accounts first, with accounts processing more than 25,000 invoice lines per run held behind a feature flag until fresh load-test evidence meets the target. The decision is approved with follow-up. [ADR-001]",
    alternatives:
      "Three options were considered: launch to all accounts immediately (rejected), delay the entire release (rejected), and phase the rollout behind a feature flag (selected). [ADR-001] [ZOOM-001]",
    people:
      "Maya Chen owns DEC-001 and approved it together with Arjun Mehta on the engineering side. Priya Nair is the technical owner for the follow-up. [ADR-001]",
    status:
      "Partly. DEC-001 is approved with follow-up: the phased rollout is decided, but the large-account threshold and performance evidence stay open until Priya Nair's load-test report, due October 14, 2026. [ADR-001] [FOLLOW-001]",
    evidence:
      "DEC-001 is supported by seven source artifacts: a Zoom review, a Slack thread, a PRD, an ADR, a design doc, an engineering update, and a threshold follow-up. [ZOOM-001] [ADR-001]",
    open:
      "Two things remain open: Priya Nair's profiling and new load-test report, due October 14, 2026, and whether the provisional 25,000-line threshold is the right gate. [ADR-001] [FOLLOW-001]",
    disagreement:
      "Product initially preferred launching to every account to meet customer expectations, while Engineering would not commit to large-run performance. They converged on a phased rollout rather than a full launch or a full delay. [ZOOM-001] [SLACK-001]",
    superseded:
      "No. DEC-001 has not been superseded, and it does not supersede another decision in the log. It remains approved with follow-up. [ADR-001]",
    threshold:
      "The 25,000-line threshold is provisional. It is a rollout guardrail, not a proven boundary between fast and slow jobs, and invoice line count may not be the best predictor of performance. [FOLLOW-001] [ADR-001]",
  },
  "DEC-002": {
    overview:
      "FinFlow will add a review-and-confirm step to bulk invoice actions. It shows the selected invoice count, affected total, action summary, and a downloadable exception list, and requires explicit confirmation for operations above 100 invoices. Each operation records an audit event. The decision is approved. [ADR-002] [PRD-002]",
    why:
      "Bulk actions needed a review step because 4 of 8 participants in a synthetic usability study missed the selected invoice count, and Security requires explicit confirmation for bulk actions above 100 invoices. [ZOOM-002] [SLACK-002] [ADR-002]",
    alternatives:
      "Three approaches were considered: immediate execution with a toast (rejected), a full undo and rollback framework (deferred), and a review-and-confirm step (selected as the first-release approach). [ADR-002] [ZOOM-002]",
    people:
      "Maya Chen owns DEC-002, and Ethan Cole (Security) signed off alongside her. Leo Fischer, Daniel Okafor, Priya Nair, and Zoe Park contributed. [ADR-002]",
    status:
      "Yes. DEC-002 is approved. Two questions remain open for later work: whether confirmation thresholds should vary by action type, and how partial permissions should affect exception-list generation. [ADR-002] [SLACK-002] [ENG-002]",
    evidence:
      "DEC-002 is supported by six source artifacts: a Zoom review, a Slack thread, a PRD, an ADR, a design doc, and an engineering update. [ZOOM-002] [ADR-002]",
    open:
      "Two questions are open: should confirmation thresholds vary by action type, and how should partial permissions affect exception-list generation? No dated follow-up actions are recorded. [SLACK-002] [ENG-002]",
    superseded:
      "No. DEC-002 has not been superseded, and it does not supersede another decision in the log. It remains approved. [ADR-002]",
    threshold:
      "Explicit confirmation is required for bulk operations above 100 invoices. Whether the threshold should vary by action type is still an open question. [SLACK-002] [ADR-002]",
  },
  "DEC-003": {
    overview:
      "No final decision has been made. DEC-003 is proposed, not finalized. The leading proposal is to show the three largest forecast drivers with source labels and last-updated dates, with a forecast confidence score as the alternative. [PRD-003] [FOLLOW-002]",
    why:
      "Early discovery suggests finance users want to understand which expected payments and assumptions influence forecast changes. The evidence is only six discovery conversations and is not representative, so nothing has been decided yet. [ZOOM-003] [FOLLOW-002]",
    alternatives:
      "Two approaches are under consideration and neither is approved. The leading proposal shows the three largest forecast drivers with source labels and last-updated dates. The alternative shows a forecast confidence score first, with explanatory drivers below. [PRD-003] [DES-003]",
    people:
      "Nadia Brooks owns DEC-003. Nobody has approved it because it is still proposed. Leo Fischer is prototyping both variants. [FOLLOW-002]",
    status:
      "No. The forecast explanation design is not finalized. DEC-003 is proposed, and no final decision has been made. [FOLLOW-002] [PRD-003]",
    evidence:
      "The evidence for DEC-003 is thin: six discovery conversations, which are not representative. Five artifacts relate to it, and none records a final decision. [ZOOM-003] [FOLLOW-002]",
    open:
      "Three questions are open, and Nadia Brooks will run five additional discovery interviews by October 16, 2026 while Leo Fischer prototypes both variants. [FOLLOW-002]",
    disagreement:
      `${INSUFFICIENT_EVIDENCE} A Product-versus-Engineering disagreement is not recorded for DEC-003. What the documents do record is an unresolved choice between two variants of the forecast explanation. [PRD-003] [DES-003]`,
    superseded:
      "No. DEC-003 is only proposed, so it has not superseded anything and nothing has superseded it. [FOLLOW-002]",
    threshold:
      "DEC-003 does not define a numeric threshold. The open question is whether a confidence score should appear at all. [FOLLOW-002]",
  },
};

DIRECT["DEC-002"].disagreement =
  `${INSUFFICIENT_EVIDENCE} A Product-versus-Engineering disagreement is not recorded for DEC-002. The trade-off the documents do record is between executing immediately and reviewing scope first. [ZOOM-002] [ADR-002]`;
DIRECT["DEC-003"].decided = DIRECT["DEC-003"].status;
DIRECT["DEC-002"].decided = DIRECT["DEC-002"].overview;

/* ------------------------------------------------------------------ */
/* Section builders                                                    */
/* ------------------------------------------------------------------ */

const isFinal = (d: Decision) => d.finalDecision !== null;

function whySection(d: Decision): AnswerSection {
  if (d.id === "DEC-001") {
    return {
      kind: "why",
      title: "Why?",
      paragraphs: [
        "A 30,000-line test showed p95 latency of 8.4 seconds against a target below 5 seconds. The team did not yet know whether query-plan optimization would resolve the issue. [ZOOM-001] [ENG-001]",
        "Small-account runs stayed at or below 3.2 seconds p95 across 12 test runs. [ZOOM-001]",
      ],
    };
  }
  return {
    kind: "why",
    title: isFinal(d) ? "Why this decision was made" : "Why this is being considered",
    paragraphs: [d.problem, ...d.rationale],
  };
}

function decidedSection(d: Decision): AnswerSection {
  if (d.id === "DEC-001") {
    return {
      kind: "decided",
      title: "What was decided?",
      paragraphs: [
        "Small and mid-sized accounts can proceed. Accounts processing more than 25,000 invoice lines per run remain behind a feature flag until a fresh load-test report is reviewed. [ADR-001] [PRD-001]",
      ],
    };
  }
  if (!isFinal(d)) {
    return {
      kind: "decided",
      title: "Current status: not decided",
      paragraphs: [
        "No final decision has been made. [FOLLOW-002]",
        `Leading proposal (not approved): ${d.leadingProposal ?? ""} [PRD-003]`,
      ],
    };
  }
  return { kind: "decided", title: "What was decided", paragraphs: [d.finalDecision ?? ""] };
}

function alternativesSection(d: Decision): AnswerSection {
  const base: AnswerSection = {
    kind: "alternatives",
    title: "Alternatives considered",
    alternatives: d.alternatives.map((a) => ({ title: a.title, disposition: a.disposition, rationale: a.rationale })),
  };
  if (d.id === "DEC-001") {
    return {
      ...base,
      title: "Why not launch to everyone?",
      paragraphs: [
        "Engineering could not confidently predict large-run performance. Delaying every account would also block the smaller cohort that had passed the tests. [ZOOM-001] [SLACK-001]",
      ],
    };
  }
  return base;
}

function openSection(d: Decision): AnswerSection {
  const paragraphs: string[] = [];
  const bullets: string[] = [];
  if (d.id === "DEC-001") {
    paragraphs.push(
      "The 25,000-line threshold is provisional. Invoice line count may not be the best predictor of performance. [FOLLOW-001]",
    );
  } else {
    bullets.push(...d.caveats);
  }
  bullets.push(...d.openQuestions.filter((q) => !(d.id === "DEC-001" && q.includes("line count"))));
  return {
    kind: "open",
    title: d.id === "DEC-001" ? "What's still open?" : "Open questions and next steps",
    paragraphs: paragraphs.length ? paragraphs : undefined,
    bullets: bullets.length ? bullets : undefined,
    actions: d.followUps
      .filter((f) => f.status === "Open")
      .map((f) => ({ description: f.description, ownerId: f.ownerId, dueDate: f.dueDate })),
  };
}

function peopleSection(d: Decision): AnswerSection {
  const roles = new Map<string, string[]>();
  const add = (id: string | undefined, role: string) => {
    if (!id) return;
    roles.set(id, [...(roles.get(id) ?? []), role]);
  };
  add(d.ownerId, "Decision owner");
  add(d.technicalOwnerId, "Technical owner for follow-up");
  d.approverIds.forEach((id) => add(id, "Approver"));
  d.contributorIds.forEach((id) => add(id, "Contributor"));
  return {
    kind: "people",
    title: "People involved",
    people: [...roles.entries()].map(([employeeId, r]) => ({ employeeId, role: r.join(" · ") })),
  };
}

function evidenceRefs(d: Decision, overrides?: EvidenceReference[]): EvidenceReference[] {
  if (overrides) return overrides;
  const refs: EvidenceReference[] = [];
  for (const id of d.artifactIds) {
    const doc = documentById(id);
    const excerpt = doc?.excerpts[0];
    if (doc && excerpt) refs.push({ artifactId: id, excerptId: excerpt.id, claim: excerpt.label });
  }
  return refs;
}

function ref(artifactId: string, excerptId: string): EvidenceReference {
  const excerpt = documentById(artifactId)?.excerpts.find((e) => e.id === excerptId);
  return { artifactId, excerptId, claim: excerpt?.label ?? "" };
}

const EVIDENCE_OVERRIDES: Record<string, Partial<Record<Intent, EvidenceReference[]>>> = {
  "DEC-001": {
    threshold: [ref("FOLLOW-001", "e1"), ref("ADR-001", "e3"), ref("SLACK-001", "e3"), ref("PRD-001", "e2")],
    disagreement: [ref("ZOOM-001", "e3"), ref("SLACK-001", "e1"), ref("ADR-001", "e2")],
    alternatives: [ref("ADR-001", "e2"), ref("ZOOM-001", "e3"), ref("SLACK-001", "e1")],
  },
};

function evidenceSection(d: Decision, intent: Intent): AnswerSection {
  return {
    kind: "evidence",
    title: "Evidence",
    evidence: evidenceRefs(d, EVIDENCE_OVERRIDES[d.id]?.[intent]),
  };
}

const SECTION_ORDER: Record<Exclude<Intent, "portfolio">, ("why" | "decided" | "alternatives" | "open" | "people" | "evidence")[]> = {
  overview: ["why", "decided", "alternatives", "open", "evidence", "people"],
  why: ["why", "decided", "alternatives", "open", "evidence"],
  decided: ["decided", "alternatives", "open", "evidence"],
  alternatives: ["alternatives", "evidence"],
  people: ["people", "evidence"],
  status: ["decided", "open", "evidence"],
  evidence: ["evidence"],
  open: ["open", "people"],
  disagreement: ["evidence"],
  superseded: ["evidence"],
  threshold: ["open", "evidence"],
};

const FOLLOW_UP_POOL: [Intent, string][] = [
  ["alternatives", "What alternatives were considered?"],
  ["people", "Who owns this decision?"],
  ["evidence", "What evidence supports it?"],
  ["open", "What's still open?"],
  ["superseded", "Has a newer decision superseded this?"],
];

function suggestionsFor(intent: Intent): string[] {
  return FOLLOW_UP_POOL.filter(([i]) => i !== intent)
    .slice(0, 3)
    .map(([, text]) => text);
}

function buildDecisionAnswer(d: Decision, requested: Intent, usedContext: boolean): AssistantAnswer {
  const templates = DIRECT[d.id];
  const intent: Exclude<Intent, "portfolio"> = requested === "portfolio" ? "overview" : requested;

  let directAnswer = templates[intent] ?? templates.overview;
  if (usedContext) directAnswer = `Staying on ${d.id} (${d.title}). ${directAnswer}`;

  const builders = {
    why: whySection,
    decided: decidedSection,
    alternatives: alternativesSection,
    open: openSection,
    people: peopleSection,
  } as const;

  const sections: AnswerSection[] = SECTION_ORDER[intent].map((key) =>
    key === "evidence" ? evidenceSection(d, intent) : builders[key](d),
  );

  if (intent === "disagreement" && d.id !== "DEC-001") {
    sections.unshift(alternativesSection(d));
  }

  const confidence = directAnswer.startsWith(INSUFFICIENT_EVIDENCE)
    ? "insufficient"
    : isFinal(d)
      ? "grounded"
      : "unresolved";

  const allPeople = peopleSection(d).people?.map((p) => p.employeeId) ?? [];
  const evidence = evidenceRefs(d);

  return {
    confidence,
    directAnswer,
    sections: sections.filter(hasContent),
    decisionIds: [d.id],
    evidence,
    personIds: allPeople,
    suggestions: suggestionsFor(intent),
  };
}

function hasContent(s: AnswerSection): boolean {
  return Boolean(
    s.paragraphs?.length || s.bullets?.length || s.alternatives?.length || s.people?.length || s.evidence?.length || s.actions?.length,
  );
}

function buildPortfolioAnswer(): AssistantAnswer {
  const bullets = [
    "DEC-003 — Explainability for cash-flow forecasts: proposed, not finalized. No final decision has been made. [FOLLOW-002]",
    "DEC-001 — Phase rollout of large-account reconciliation: approved with follow-up. Profiling and a new load-test report are due October 14, 2026, and the 25,000-line threshold is provisional. [ADR-001] [FOLLOW-001]",
    "DEC-002 — Review step for bulk invoice actions: approved. Two design questions remain open, with no dated follow-up. [ADR-002]",
  ];
  const actions = decisions
    .flatMap((d) => d.followUps.filter((f) => f.status === "Open").map((f) => ({ d, f })))
    .sort((a, b) => (a.f.dueDate ?? "9999").localeCompare(b.f.dueDate ?? "9999"))
    .map(({ f }) => ({ description: f.description, ownerId: f.ownerId, dueDate: f.dueDate }));

  return {
    confidence: "unresolved",
    directAnswer:
      "One decision is unresolved and two approved decisions still carry open items. DEC-003 is only proposed. DEC-001 is approved but waiting on follow-up due October 14, 2026, and DEC-002 is approved with two open design questions. [FOLLOW-002] [ADR-001] [ADR-002]",
    sections: [
      { kind: "decisions", title: "Decisions that still need attention", bullets },
      { kind: "open", title: "Open follow-up actions", actions },
      {
        kind: "evidence",
        title: "Evidence",
        evidence: [ref("FOLLOW-002", "e1"), ref("FOLLOW-001", "e1"), ref("ADR-002", "e1")].filter((r) => r.claim !== ""),
      },
    ],
    decisionIds: ["DEC-003", "DEC-001", "DEC-002"],
    evidence: [ref("FOLLOW-002", "e1"), ref("FOLLOW-001", "e1"), ref("ADR-002", "e1")].filter((r) => r.claim !== ""),
    personIds: ["nadia-brooks", "leo-fischer", "priya-nair", "maya-chen"],
    suggestions: ["Is the forecast explanation design finalized?", "Why did we delay large-account reconciliation?"],
  };
}

function buildSupersededAnswer(): AssistantAnswer {
  const evidence = [ref("ADR-001", "e1"), ref("ADR-002", "e1"), ref("FOLLOW-002", "e1")].filter((r) => r.claim !== "");
  return {
    confidence: "grounded",
    directAnswer:
      "No. None of the three decisions in the log supersedes another or has been superseded. DEC-001 and DEC-002 are in force, and DEC-003 is still only proposed. [ADR-001] [ADR-002] [FOLLOW-002]",
    sections: [
      {
        kind: "decisions",
        title: "Current state of each decision",
        bullets: decisions.map((d) => `${d.id} — ${d.title}: ${d.status}. Supersedes: none. Superseded by: none.`),
      },
      { kind: "evidence", title: "Evidence", evidence },
    ],
    decisionIds: decisions.map((d) => d.id),
    evidence,
    personIds: [],
    suggestions: ["Which decisions are still unresolved?", "Why did we delay large-account reconciliation?"],
  };
}

function lastMultiDecisionIds(history: ChatMessage[]): string[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role === "assistant" && m.answer && m.answer.decisionIds.length > 1) return m.answer.decisionIds;
  }
  return [];
}

function buildOwnersAnswer(decisionIds: string[]): AssistantAnswer {
  const list = decisionIds.map((id) => decisionById(id)).filter((d): d is Decision => Boolean(d));
  const nameOf = (id: string) => employeeById(id)?.name ?? id;
  return {
    confidence: "grounded",
    directAnswer: `Your question could refer to any of the ${list.length} decisions above, so here is the owner of each. ${list
      .map((d) => `${d.id}: ${nameOf(d.ownerId)}`)
      .join("; ")}.`,
    sections: [
      {
        kind: "people",
        title: "Decision owners",
        people: list.map((d) => ({ employeeId: d.ownerId, role: `Owner of ${d.id} (${d.status})` })),
      },
    ],
    decisionIds: list.map((d) => d.id),
    evidence: [],
    personIds: [...new Set(list.map((d) => d.ownerId))],
    suggestions: list.slice(0, 2).map((d) => `Who is involved in ${d.id}?`),
  };
}

function buildFallback(unknownRefs: string[]): AssistantAnswer {
  const missing = unknownRefs.length
    ? ` There is no record called ${unknownRefs.join(", ")} in the FinFlow knowledge base.`
    : "";
  return {
    confidence: "insufficient",
    directAnswer: `${INSUFFICIENT_EVIDENCE}${missing}`,
    sections: [
      {
        kind: "decisions",
        title: "What I can answer about",
        bullets: decisions.map((d) => `${d.id} — ${d.title} (${d.status})`),
      },
    ],
    decisionIds: [],
    evidence: [],
    personIds: [],
    suggestions: [...SUGGESTED_PROMPTS],
  };
}

/** Pure, synchronous answer for a question given the prior conversation. */
export function answerQuestion(question: string, history: ChatMessage[]): AssistantAnswer {
  const parsed = parseQuestion(question, history);
  if (parsed.intent === "portfolio" && !parsed.decisionId) return buildPortfolioAnswer();
  if (!parsed.decisionId && parsed.unknownRefs.length === 0) {
    if (parsed.intent === "superseded") return buildSupersededAnswer();
    if (parsed.intent === "disagreement") {
      const answer = buildDecisionAnswer(decisions[0], "disagreement", false);
      return {
        ...answer,
        directAnswer: `The only Product-versus-Engineering disagreement recorded in the FinFlow documents is on DEC-001. ${answer.directAnswer}`,
      };
    }
  }
  if (!parsed.decisionId && parsed.intent === "people" && parsed.unknownRefs.length === 0) {
    const prior = lastMultiDecisionIds(history);
    if (prior.length > 0) return buildOwnersAnswer(prior);
  }
  if (!parsed.decisionId) return buildFallback(parsed.unknownRefs);
  const decision = decisionById(parsed.decisionId);
  if (!decision) return buildFallback(parsed.unknownRefs);
  return buildDecisionAnswer(decision, parsed.intent, parsed.usedContext);
}

export const isKnownArtifact = (id: string): boolean => knownArtifactIds.has(id);
