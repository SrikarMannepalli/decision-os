import { documents, documentById } from "@/data/documents";
import { employees } from "@/data/employees";
import { projects as seedProjects } from "@/data/projects";
import type { Document, DocumentDetail, Employee, Project } from "@/types";
import { BackendError, createApiClient, failure, type ApiClient, type ApiClientOptions } from "./apiClient";

/** Where the catalog's records come from: the API in live mode, the seed offline. */
export interface CatalogSource {
  /** Present when the records are already in hand, so no loading state is needed. */
  initialPeople?: Employee[];
  initialProjects?: Project[];
  initialDocuments?: Document[];
  loadPeople(signal?: AbortSignal): Promise<Employee[]>;
  loadProjects(signal?: AbortSignal): Promise<Project[]>;
  loadDocuments(signal?: AbortSignal): Promise<Document[]>;
  /** Fetch one document's detail; resolves to undefined when the id is unknown. */
  loadDocument(id: string, signal?: AbortSignal): Promise<DocumentDetail | undefined>;
}

const isEmployee = (value: unknown): value is Employee => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["id", "name", "role", "department", "email"].every((key) => typeof record[key] === "string");
};

const isDocument = (value: unknown): value is Document => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    ["id", "title", "type", "projectId", "createdAt", "summary"].every((key) => typeof record[key] === "string") &&
    ["authorIds", "decisionIds"].every((key) => Array.isArray(record[key]) && (record[key] as unknown[]).every((item) => typeof item === "string"))
  );
};

const isDocumentDetail = (value: unknown): value is DocumentDetail =>
  isDocument(value) && typeof (value as { content?: unknown }).content === "string";

export async function fetchDocuments(api: ApiClient, signal?: AbortSignal): Promise<Document[]> {
  const res = await api.get("/documents", signal);
  if (!res.ok) throw failure(res.status, "load documents");
  const body: unknown = await res.json();
  if (!Array.isArray(body) || !body.every(isDocument)) throw new BackendError("The backend returned documents in an unexpected shape.");
  return body;
}

export async function fetchDocumentDetail(id: string, api: ApiClient, signal?: AbortSignal): Promise<DocumentDetail> {
  const res = await api.get(`/documents/${encodeURIComponent(id)}`, signal);
  if (res.status === 404) throw new BackendError("This document is no longer in the corpus.");
  if (!res.ok) throw failure(res.status, "load that document");
  const body: unknown = await res.json();
  if (!isDocumentDetail(body)) throw new BackendError("The backend returned a document in an unexpected shape.");
  return body;
}

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
    loadDocuments: (signal) => fetchDocuments(api, signal),
    loadDocument: (id, signal) =>
      fetchDocumentDetail(id, api, signal).catch((err: unknown) => {
        if (err instanceof BackendError && /no longer in the corpus/.test(err.message)) return undefined;
        throw err;
      }),
  };
}

export const seedCatalogSource: CatalogSource = {
  initialPeople: employees,
  initialProjects: seedProjects,
  initialDocuments: documents,
  loadPeople: async () => employees,
  loadProjects: async () => seedProjects,
  loadDocuments: async () => documents,
  loadDocument: async (id) => {
    const doc = documentById(id);
    return doc?.content !== undefined ? (doc as DocumentDetail) : undefined;
  },
};
