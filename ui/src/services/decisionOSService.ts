import type { AssistantAnswer, ChatMessage, CorpusCitation } from "@/types";
import type { FileSlice } from "./corpusFiles";
import { createLiveClient } from "./liveClient";

export interface QueryResult {
  /** Plain-text rendering of the answer, used for copy-to-clipboard */
  text: string;
  answer: AssistantAnswer;
}

/**
 * The seam between the UI and whatever answers questions: the FastAPI
 * conversation endpoints. No component imports the client directly.
 */
export interface DecisionOSClient {
  queryDecisionOS(conversationId: string, question: string, conversationHistory: ChatMessage[]): Promise<QueryResult>;
  /** The cited lines of a corpus file with context. */
  fetchSource?(citation: CorpusCitation, signal?: AbortSignal): Promise<FileSlice>;
}

export const decisionOS: DecisionOSClient = createLiveClient();

export const queryDecisionOS = (conversationId: string, question: string, conversationHistory: ChatMessage[]): Promise<QueryResult> =>
  decisionOS.queryDecisionOS(conversationId, question, conversationHistory);
