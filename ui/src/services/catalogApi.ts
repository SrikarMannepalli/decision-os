import { employees } from "@/data/employees";
import type { Employee } from "@/types";
import { BackendError, createApiClient, failure, type ApiClient, type ApiClientOptions } from "./apiClient";

/** Where the catalog's records come from: the API in live mode, the seed offline. */
export interface CatalogSource {
  /** Present when the records are already in hand, so no loading state is needed. */
  initialPeople?: Employee[];
  loadPeople(signal?: AbortSignal): Promise<Employee[]>;
}

const isEmployee = (value: unknown): value is Employee => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["id", "name", "role", "department", "email"].every((key) => typeof record[key] === "string");
};

export async function fetchPeople(api: ApiClient, signal?: AbortSignal): Promise<Employee[]> {
  const res = await api.get("/people", signal);
  if (!res.ok) throw failure(res.status, "load people");
  const body: unknown = await res.json();
  if (!Array.isArray(body) || !body.every(isEmployee)) throw new BackendError("The backend returned people in an unexpected shape.");
  return body;
}

export function createLiveCatalogSource(options: ApiClientOptions = {}): CatalogSource {
  const api = createApiClient(options);
  return { loadPeople: (signal) => fetchPeople(api, signal) };
}

export const seedCatalogSource: CatalogSource = {
  initialPeople: employees,
  loadPeople: async () => employees,
};
