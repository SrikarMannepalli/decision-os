export class BackendError extends Error {}

export interface ApiClientOptions {
  /** Where the FastAPI app is reachable; the dev server proxies /api to it. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  get(path: string, signal?: AbortSignal): Promise<Response>;
  post(path: string, body?: unknown): Promise<Response>;
}

// A dev-proxy that cannot reach the API answers 5xx, so 5xx reads as "backend down".
export const failure = (status: number, action: string): BackendError =>
  new BackendError(
    status >= 500
      ? `The DecisionOS backend is unavailable (HTTP ${status}). Check that the API is running.`
      : `The backend could not ${action} (HTTP ${status}).`,
  );

export function createApiClient({ baseUrl = "/api", fetchImpl = (...args) => fetch(...args) }: ApiClientOptions = {}): ApiClient {
  const request = async (path: string, init: RequestInit): Promise<Response> => {
    try {
      return await fetchImpl(`${baseUrl}${path}`, init);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new BackendError("Could not reach the DecisionOS backend. Check that the API is running.");
    }
  };

  return {
    get: (path, signal) => request(path, { method: "GET", signal }),
    post: (path, body) =>
      request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
}
