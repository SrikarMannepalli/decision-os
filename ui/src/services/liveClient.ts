import { formatLines } from "@/lib/format";
import type { AssistantAnswer, CorpusCitation } from "@/types";
import type { DecisionOSClient, QueryResult } from "./decisionOSService";

interface BackendTurn {
  question: string;
  answer: string;
  citations: { path: string; lines: [number, number] }[];
}

export class BackendError extends Error {}

export interface LiveClientOptions {
  /** Where the FastAPI app is reachable; the dev server proxies /api to it. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

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

// A dev-proxy that cannot reach the API answers 5xx, so 5xx reads as "backend down".
const failure = (status: number, action: string): BackendError =>
  new BackendError(
    status >= 500
      ? `The DecisionOS backend is unavailable (HTTP ${status}). Check that the API is running.`
      : `The backend could not ${action} (HTTP ${status}).`,
  );

export function createLiveClient({ baseUrl = "/api", fetchImpl = (...args) => fetch(...args) }: LiveClientOptions = {}): DecisionOSClient {
  // UI conversation id -> backend conversation id (one Pi session each).
  const backendIds = new Map<string, string>();

  const post = async (path: string, body?: unknown): Promise<Response> => {
    try {
      return await fetchImpl(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new BackendError("Could not reach the DecisionOS backend. Check that the API is running.");
    }
  };

  const backendConversation = async (uiId: string): Promise<string> => {
    const existing = backendIds.get(uiId);
    if (existing) return existing;
    const res = await post("/conversations");
    if (!res.ok) throw failure(res.status, "start a conversation");
    const { id } = (await res.json()) as { id: string };
    backendIds.set(uiId, id);
    return id;
  };

  const sendMessage = async (uiId: string, question: string): Promise<Response> =>
    post(`/conversations/${await backendConversation(uiId)}/messages`, { question });

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
  };
}
