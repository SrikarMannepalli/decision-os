import { describe, expect, it } from "vitest";
import { decisions } from "@/data/decisions";
import { documents, knownArtifactIds } from "@/data/documents";
import { employees } from "@/data/employees";
import { projects } from "@/data/projects";
import { extractCitations } from "@/lib/richText";
import { INSUFFICIENT_EVIDENCE, SUGGESTED_PROMPTS, answerQuestion } from "@/services/mockRetrieval";
import type { AssistantAnswer, ChatMessage } from "@/types";

const employeeIds = new Set(employees.map((e) => e.id));
const projectIds = new Set(projects.map((p) => p.id));

function textOf(a: AssistantAnswer): string {
  return JSON.stringify(a);
}

function asHistory(question: string, answer: AssistantAnswer): ChatMessage[] {
  return [
    { id: "u", role: "user", content: question, createdAt: "2026-10-10T00:00:00Z" },
    { id: "a", role: "assistant", content: "", createdAt: "2026-10-10T00:00:01Z", answer },
  ];
}

describe("seed data integrity", () => {
  it("has the 18 seeded artifacts with unique ids", () => {
    expect(documents).toHaveLength(18);
    expect(knownArtifactIds.size).toBe(18);
  });

  it("links decisions and documents in both directions", () => {
    for (const d of decisions) {
      for (const id of d.artifactIds) {
        const doc = documents.find((x) => x.id === id);
        expect(doc, `${d.id} cites missing ${id}`).toBeDefined();
        expect(doc?.decisionIds).toContain(d.id);
      }
    }
    for (const doc of documents) {
      for (const id of doc.decisionIds) {
        expect(decisions.find((d) => d.id === id)?.artifactIds, `${doc.id} -> ${id}`).toContain(doc.id);
      }
    }
  });

  it("references only known people and projects", () => {
    for (const d of decisions) {
      expect(projectIds.has(d.projectId)).toBe(true);
      for (const id of [d.ownerId, d.technicalOwnerId ?? d.ownerId, ...d.contributorIds, ...d.approverIds, ...d.followUps.map((f) => f.ownerId)]) {
        expect(employeeIds.has(id), `${d.id}: ${id}`).toBe(true);
      }
    }
    for (const doc of documents) {
      expect(projectIds.has(doc.projectId)).toBe(true);
      for (const id of doc.authorIds) expect(employeeIds.has(id), `${doc.id}: ${id}`).toBe(true);
    }
  });

  it("uses verbatim excerpts and only seeded citations in every text field", () => {
    for (const doc of documents) {
      expect(doc.excerpts.length).toBeGreaterThan(0);
      for (const e of doc.excerpts) expect(doc.content, `${doc.id}/${e.id}`).toContain(e.text);
    }
    for (const d of decisions) {
      const fields = [...d.rationale, ...d.caveats, ...d.openQuestions];
      for (const id of fields.flatMap(extractCitations)) expect(knownArtifactIds.has(id), `${d.id} cites ${id}`).toBe(true);
    }
  });

  it("never presents DEC-003 as decided", () => {
    const d = decisions.find((x) => x.id === "DEC-003");
    expect(d?.status).toBe("Proposed");
    expect(d?.finalDecision).toBeNull();
    expect(d?.approverIds).toHaveLength(0);
    expect(d?.alternatives.some((a) => a.disposition === "Selected")).toBe(false);
  });
});

describe("mock retrieval engine", () => {
  it("answers every suggested prompt with grounded or unresolved content and valid citations", () => {
    for (const prompt of SUGGESTED_PROMPTS) {
      const a = answerQuestion(prompt, []);
      expect(a.confidence).not.toBe("insufficient");
      expect(a.decisionIds.length).toBeGreaterThan(0);
      for (const id of extractCitations(textOf(a).replace(/\\n/g, " "))) expect(knownArtifactIds.has(id)).toBe(true);
      for (const e of a.evidence) {
        const doc = documents.find((d) => d.id === e.artifactId);
        expect(doc?.excerpts.some((x) => x.id === e.excerptId)).toBe(true);
      }
    }
  });

  it("is deterministic", () => {
    const q = "Why did we delay large-account reconciliation?";
    expect(answerQuestion(q, [])).toEqual(answerQuestion(q, []));
  });

  it("explains the DEC-001 delay as a phased rollout with a provisional threshold", () => {
    const a = answerQuestion("Why did we delay large-account reconciliation?", []);
    expect(a.decisionIds).toEqual(["DEC-001"]);
    expect(a.directAnswer).toContain("We didn't delay the entire reconciliation release");
    const all = textOf(a);
    expect(all).toContain("8.4 seconds");
    expect(all).toContain("provisional");
    const open = a.sections.find((x) => x.kind === "open");
    expect(open?.actions).toEqual([
      expect.objectContaining({ ownerId: "priya-nair", dueDate: "2026-10-14" }),
    ]);
    for (const id of ["ZOOM-001", "SLACK-001", "PRD-001", "ADR-001", "ENG-001"]) expect(all).toContain(`[${id}]`);
  });

  it("answers the bulk invoice actions prompt from DEC-002", () => {
    const a = answerQuestion("What did we decide about bulk invoice actions?", []);
    expect(a.decisionIds).toEqual(["DEC-002"]);
    expect(textOf(a)).toContain("above 100 invoices");
    expect(a.confidence).toBe("grounded");
  });

  it("marks DEC-003 as unresolved and never calls it approved", () => {
    for (const q of [
      "Is the forecast explanation design finalized?",
      "What alternatives did we consider for cash-flow forecasts?",
      "Who approved the forecast explanation?",
    ]) {
      const a = answerQuestion(q, []);
      expect(a.decisionIds).toEqual(["DEC-003"]);
      expect(a.confidence).toBe("unresolved");
      expect(textOf(a)).not.toMatch(/"Selected"|(?<!not |neither )\b(is|was) approved/);
    }
    expect(answerQuestion("Is the forecast explanation design finalized?", []).directAnswer).toMatch(/^No\./);
  });

  it("lists unresolved decisions across the log", () => {
    const a = answerQuestion("Which decisions are still unresolved?", []);
    expect(a.decisionIds).toEqual(["DEC-003", "DEC-001", "DEC-002"]);
    expect(a.directAnswer).toContain("DEC-003 is only proposed");
  });

  it("carries the previous decision into follow-up questions", () => {
    const q1 = "Why did we delay large-account reconciliation?";
    const history = asHistory(q1, answerQuestion(q1, []));
    const followUp = answerQuestion("What evidence supports the current decision?", history);
    expect(followUp.decisionIds).toEqual(["DEC-001"]);
    expect(followUp.sections.some((s) => s.kind === "evidence")).toBe(true);
  });

  it("answers an ambiguous owner follow-up for every decision in the previous answer", () => {
    const q1 = "Which decisions are still unresolved?";
    const history = asHistory(q1, answerQuestion(q1, []));
    const a = answerQuestion("Who owns it?", history);
    expect(a.confidence).toBe("grounded");
    expect(a.decisionIds).toEqual(["DEC-003", "DEC-001", "DEC-002"]);
    expect(a.directAnswer).toContain("DEC-003: Nadia Brooks");
    expect(a.evidence).toHaveLength(0);
  });

  it("does not carry context for unrelated questions", () => {
    const q1 = "Why did we delay large-account reconciliation?";
    const history = asHistory(q1, answerQuestion(q1, []));
    const a = answerQuestion("What is the weather in Berlin?", history);
    expect(a.confidence).toBe("insufficient");
    expect(a.directAnswer).toContain(INSUFFICIENT_EVIDENCE);
  });

  it("refuses unknown records instead of inventing them", () => {
    const a = answerQuestion("Summarize ZOOM-099 and DEC-009", []);
    expect(a.confidence).toBe("insufficient");
    expect(a.directAnswer).toContain("ZOOM-099");
    expect(a.evidence).toHaveLength(0);
  });

  it("reports that no decision has been superseded", () => {
    const a = answerQuestion("Has a newer decision superseded an older one?", []);
    expect(a.directAnswer).toMatch(/^No\./);
  });
});
