import { employees } from "@/data/employees";
import { projects as seedProjects } from "@/data/projects";
import type { Employee, Project } from "@/types";
import { BackendError, createApiClient, failure, type ApiClient, type ApiClientOptions } from "./apiClient";

/** Where the catalog's records come from: the API in live mode, the seed offline. */
export interface CatalogSource {
  /** Present when the records are already in hand, so no loading state is needed. */
  initialPeople?: Employee[];
  initialProjects?: Project[];
  loadPeople(signal?: AbortSignal): Promise<Employee[]>;
  loadProjects(signal?: AbortSignal): Promise<Project[]>;
}

const isEmployee = (value: unknown): value is Employee => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["id", "name", "role", "department", "email"].every((key) => typeof record[key] === "string");
};

const isProject = (value: unknown): value is Project => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["id", "name", "description", "ownerId"].every((key) => typeof record[key] === "string");
};

export async function fetchPeople(api: ApiClient, signal?: AbortSignal): Promise<Employee[]> {
  const res = await api.get("/people", signal);
  if (!res.ok) throw failure(res.status, "load people");
  const body: unknown = await res.json();
  if (!Array.isArray(body) || !body.every(isEmployee)) throw new BackendError("The backend returned people in an unexpected shape.");
  return body;
}

export async function fetchProjects(api: ApiClient, signal?: AbortSignal): Promise<Project[]> {
  const res = await api.get("/projects", signal);
  if (!res.ok) throw failure(res.status, "load projects");
  const body: unknown = await res.json();
  if (!Array.isArray(body) || !body.every(isProject)) throw new BackendError("The backend returned projects in an unexpected shape.");
  return body;
}

export function createLiveCatalogSource(options: ApiClientOptions = {}): CatalogSource {
  const api = createApiClient(options);
  return {
    loadPeople: (signal) => fetchPeople(api, signal),
    loadProjects: (signal) => fetchProjects(api, signal),
  };
}

export const seedCatalogSource: CatalogSource = {
  initialPeople: employees,
  initialProjects: seedProjects,
  loadPeople: async () => employees,
  loadProjects: async () => seedProjects,
};
