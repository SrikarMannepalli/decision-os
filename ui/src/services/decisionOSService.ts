import { employeeById } from "@/data/employees";
import type { AssistantAnswer, ChatMessage, CorpusCitation } from "@/types";
import type { FileSlice } from "./corpusFiles";
import { isLiveMode } from "@/config";
import { createLiveClient } from "./liveClient";
import { answerQuestion } from "./mockRetrieval";

export interface QueryResult {
  /** Plain-text rendering of the answer, used for copy-to-clipboard */
  text: string;
  answer: AssistantAnswer;
}

/**
 * The seam between the UI and whatever answers questions. The mock client
 * answers from the seeded FinFlow data; the live client talks to the FastAPI
 * conversation endpoints. No component imports either one directly.
 */
export interface DecisionOSClient {
  queryDecisionOS(conversationId: string, question: string, conversationHistory: ChatMessage[]): Promise<QueryResult>;
  /** The cited lines of a corpus file with context; only the live backend can serve them. */
  fetchSource?(citation: CorpusCitation, signal?: AbortSignal): Promise<FileSlice>;
}


const RESPONSE_DELAY_MS = 700;

export const mockDecisionOSClient: DecisionOSClient = {
  async queryDecisionOS(_conversationId, question, conversationHistory) {
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));
    const answer = answerQuestion(question, conversationHistory);
    return { answer, text: answerToPlainText(answer, seedPersonName) };
  },
};

export { isLiveMode };

export const decisionOS: DecisionOSClient = isLiveMode ? createLiveClient() : mockDecisionOSClient;

export const queryDecisionOS = (conversationId: string, question: string, conversationHistory: ChatMessage[]): Promise<QueryResult> =>
  decisionOS.queryDecisionOS(conversationId, question, conversationHistory);

/** Synchronous variant used to build the seeded conversations at load time. */
export function answerSync(question: string, conversationHistory: ChatMessage[]): QueryResult {
  const answer = answerQuestion(question, conversationHistory);
  return { answer, text: answerToPlainText(answer, seedPersonName) };
}

export function answerToPlainText(answer: AssistantAnswer, personName: (id: string) => string): string {
  const lines: string[] = [answer.directAnswer];
  for (const section of answer.sections) {
    lines.push("", section.title);
    section.paragraphs?.forEach((p) => lines.push(p));
    section.bullets?.forEach((b) => lines.push(`- ${b}`));
    section.alternatives?.forEach((a) => lines.push(`- ${a.title} (${a.disposition}): ${a.rationale}`));
    section.people?.forEach((p) => lines.push(`- ${personName(p.employeeId)}: ${p.role}`));
    section.actions?.forEach((a) => lines.push(`- ${a.description} (${personName(a.ownerId)}${a.dueDate ? `, due ${a.dueDate}` : ""})`));
    section.evidence?.forEach((e) => lines.push(`- [${e.artifactId}] ${e.claim}`));
  }
  return lines.join("\n");
}

function seedPersonName(id: string): string {
  return employeeById(id)?.name ?? id;
}
