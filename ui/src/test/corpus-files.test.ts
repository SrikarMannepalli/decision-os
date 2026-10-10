import { describe, expect, it } from "vitest";
import { BackendError, createApiClient } from "@/services/apiClient";
import { fetchFileSlice, sourceWindow, type FileSlice } from "@/services/corpusFiles";
import { createLiveClient } from "@/services/liveClient";

const slice: FileSlice = {
  path: "decisions/2024-04-02-x.md",
  start: 1,
  end: 12,
  totalLines: 12,
  lines: [{ n: 1, text: "# Title" }],
  entity: null,
};

function backend(respond: (url: string) => Response) {
  const urls: string[] = [];
  const fetchImpl = (async (url: string) => {
    urls.push(url);
    return respond(url);
  }) as unknown as typeof fetch;
  return { urls, api: createApiClient({ fetchImpl }) };
}

describe("sourceWindow", () => {
  it("adds three lines of context on each side", () => {
    expect(sourceWindow([10, 12])).toEqual([7, 15]);
  });

  it("does not go before line 1", () => {
    expect(sourceWindow([2, 2])).toEqual([1, 5]);
  });

  it("stays inside the backend's 500-line window for a long citation", () => {
    const [start, end] = sourceWindow([5, 900]);
    expect(start).toBe(2);
    expect(end - start + 1).toBe(500);
  });
});

describe("fetchFileSlice", () => {
  it("requests the cited lines with context and returns the slice", async () => {
    const { api, urls } = backend(() => new Response(JSON.stringify(slice), { status: 200 }));
    const result = await fetchFileSlice(api, { path: "decisions/2024-04-02-x.md", lines: [4, 9] });
    expect(urls).toEqual(["/api/files/decisions/2024-04-02-x.md?start=1&end=12"]);
    expect(result).toEqual(slice);
  });

  it("encodes each path segment but keeps the separators", async () => {
    const { api, urls } = backend(() => new Response(JSON.stringify(slice), { status: 200 }));
    await fetchFileSlice(api, { path: "decisions/q3 plan #2.md", lines: [1, 1] });
    expect(urls[0]).toContain("/api/files/decisions/q3%20plan%20%232.md?");
  });

  it("reports a missing file", async () => {
    const { api } = backend(() => new Response("{}", { status: 404 }));
    await expect(fetchFileSlice(api, { path: "a.md", lines: [1, 1] })).rejects.toThrow(/no longer in the corpus/);
  });

  it("reports lines the file cannot show", async () => {
    const { api } = backend(() => new Response("{}", { status: 422 }));
    await expect(fetchFileSlice(api, { path: "a.md", lines: [900, 901] })).rejects.toThrow(/can't be shown/);
  });

  it("treats a 5xx as the backend being down", async () => {
    const { api } = backend(() => new Response("", { status: 502 }));
    await expect(fetchFileSlice(api, { path: "a.md", lines: [1, 1] })).rejects.toThrow(/unavailable/);
  });

  it("reports an unreachable backend as a BackendError", async () => {
    const api = createApiClient({
      fetchImpl: (async () => {
        throw new TypeError("fetch failed");
      }) as unknown as typeof fetch,
    });
    await expect(fetchFileSlice(api, { path: "a.md", lines: [1, 1] })).rejects.toBeInstanceOf(BackendError);
  });

  it("passes the abort signal through and lets an abort propagate", async () => {
    let seen: AbortSignal | null | undefined;
    const api = createApiClient({
      fetchImpl: (async (_url: string, init?: RequestInit) => {
        seen = init?.signal;
        throw new DOMException("aborted", "AbortError");
      }) as unknown as typeof fetch,
    });
    const controller = new AbortController();
    await expect(fetchFileSlice(api, { path: "a.md", lines: [1, 1] }, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(seen).toBe(controller.signal);
  });
});

describe("live client source viewing", () => {
  it("serves cited lines through the same base url as chat", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify(slice), { status: 200 });
    }) as unknown as typeof fetch;
    const client = createLiveClient({ baseUrl: "/svc", fetchImpl });
    await client.fetchSource?.({ path: "decisions/a.md", lines: [5, 5] });
    expect(urls).toEqual(["/svc/files/decisions/a.md?start=2&end=8"]);
  });
});
