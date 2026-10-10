import { formatLines } from "@/lib/format";
import type { AssistantAnswer, CorpusCitation } from "@/types";
import { createApiClient, failure, type ApiClientOptions } from "./apiClient";
import { fetchFileSlice } from "./corpusFiles";
import type { DecisionOSClient, QueryResult } from "./decisionOSService";

interface BackendTurn {
  question: string;
  answer: string;
  citations: { path: string; lines: [number, number] }[];
}

export type LiveClientOptions = ApiClientOptions;

/** Maps a backend turn (prose + path/line citations) onto the UI's answer shape. */
export function turnToAnswer(turn: BackendTurn): AssistantAnswer {
  const seen = new Set<string>();
  const sources: CorpusCitation[] = [];
  for (const c of turn.citations) {
    const key = `${c.path}:${c.lines[0]}-${c.lines[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ path: c.path, lines: [c.lines[0], c.lines[1]] });
  }
  return {
    // An answer that cites nothing cannot be checked, so it is not shown as grounded.
    confidence: sources.length > 0 ? "grounded" : "insufficient",
    directAnswer: turn.answer.trim(),
    sections: [],
    decisionIds: [],
    evidence: [],
    personIds: [],
    suggestions: [],
    sources,
  };
}

function toPlainText(answer: AssistantAnswer): string {
  const lines = [answer.directAnswer];
  if (answer.sources?.length) {
    lines.push("", "Sources:", ...answer.sources.map((s) => `- ${s.path} (${formatLines(s.lines)})`));
  }
  return lines.join("\n");
}

export function createLiveClient(options: LiveClientOptions = {}): DecisionOSClient {
  const api = createApiClient(options);
  // UI conversation id -> backend conversation id (one Pi session each).
  const backendIds = new Map<string, string>();

  const backendConversation = async (uiId: string): Promise<string> => {
    const existing = backendIds.get(uiId);
    if (existing) return existing;
    const res = await api.post("/conversations");
    if (!res.ok) throw failure(res.status, "start a conversation");
    const { id } = (await res.json()) as { id: string };
    backendIds.set(uiId, id);
    return id;
  };

  const sendMessage = async (uiId: string, question: string): Promise<Response> =>
    api.post(`/conversations/${await backendConversation(uiId)}/messages`, { question });

  return {
    async queryDecisionOS(conversationId, question): Promise<QueryResult> {
      let res = await sendMessage(conversationId, question);
      if (res.status === 404) {
        // The backend restarted and lost the session: start a new one and retry once.
        backendIds.delete(conversationId);
        res = await sendMessage(conversationId, question);
      }
      if (!res.ok) throw failure(res.status, "answer that question");
      const answer = turnToAnswer((await res.json()) as BackendTurn);
      return { answer, text: toPlainText(answer) };
    },
    fetchSource: (citation, signal) => fetchFileSlice(api, citation, signal),
  };
}
