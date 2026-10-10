import { describe, expect, it } from "vitest";
import { BackendError, createLiveClient, turnToAnswer } from "@/services/liveClient";

type Call = { url: string; body?: unknown };

function fakeBackend(turns: { answer: string; citations: { path: string; lines: [number, number] }[] }[], opts: { loseSessionOnce?: boolean } = {}) {
  const calls: Call[] = [];
  let created = 0;
  let lost = opts.loseSessionOnce ?? false;
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status });
    if (url.endsWith("/conversations")) return json(201, { id: `backend-${++created}` });
    if (lost) {
      lost = false;
      return json(404, { detail: "unknown conversation" });
    }
    const body = JSON.parse(String(init?.body));
    return json(200, { question: body.question, ...turns.shift() });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("live client", () => {
  it("creates one backend conversation per UI conversation and reuses it", async () => {
    const { fetchImpl, calls } = fakeBackend([
      { answer: "A", citations: [{ path: "decisions/a.md", lines: [1, 3] }] },
      { answer: "B", citations: [{ path: "decisions/b.md", lines: [5, 5] }] },
    ]);
    const client = createLiveClient({ baseUrl: "/api", fetchImpl });
    await client.queryDecisionOS("ui-1", "first?", []);
    await client.queryDecisionOS("ui-1", "second?", []);
    expect(calls.map((c) => c.url)).toEqual([
      "/api/conversations",
      "/api/conversations/backend-1/messages",
      "/api/conversations/backend-1/messages",
    ]);
    expect(calls[2].body).toEqual({ question: "second?" });
  });

  it("maps path and line citations without inventing structure", async () => {
    const { fetchImpl } = fakeBackend([
      {
        answer: "Deprioritized for cost.",
        citations: [
          { path: "decisions/2024-04-02-x.md", lines: [4, 9] },
          { path: "decisions/2024-04-02-x.md", lines: [4, 9] },
        ],
      },
    ]);
    const { answer, text } = await createLiveClient({ fetchImpl }).queryDecisionOS("ui-1", "why?", []);
    expect(answer.confidence).toBe("grounded");
    expect(answer.sources).toEqual([{ path: "decisions/2024-04-02-x.md", lines: [4, 9] }]);
    expect(answer.decisionIds).toEqual([]);
    expect(answer.evidence).toEqual([]);
    expect(text).toContain("decisions/2024-04-02-x.md (lines 4–9)");
  });

  it("does not present an answer with no citations as grounded", () => {
    const answer = turnToAnswer({ question: "q", answer: "The corpus does not say.", citations: [] });
    expect(answer.confidence).toBe("insufficient");
    expect(answer.directAnswer).toBe("The corpus does not say.");
  });

  it("starts a new backend session once if the backend forgot the conversation", async () => {
    const { fetchImpl } = fakeBackend([{ answer: "ok", citations: [] }], { loseSessionOnce: true });
    const { answer } = await createLiveClient({ fetchImpl }).queryDecisionOS("ui-1", "q", []);
    expect(answer.directAnswer).toBe("ok");
  });

  it("treats a 5xx from the dev proxy as the backend being down", async () => {
    const fetchImpl = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    await expect(createLiveClient({ fetchImpl }).queryDecisionOS("ui-1", "q", [])).rejects.toThrow(/unavailable/);
  });

  it("reports an unreachable backend as a BackendError", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(createLiveClient({ fetchImpl }).queryDecisionOS("ui-1", "q", [])).rejects.toBeInstanceOf(BackendError);
  });
});
