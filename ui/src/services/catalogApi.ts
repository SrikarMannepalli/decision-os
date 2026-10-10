import type { Decision, Document, DocumentDetail, Employee, Project } from "@/types";
import { BackendError, createApiClient, failure, type ApiClient, type ApiClientOptions } from "./apiClient";

/** Where the catalog's records come from: the API in live mode, the seed offline. */
export interface CatalogSource {
  /** Present when the records are already in hand, so no loading state is needed. */
  initialPeople?: Employee[];
  initialProjects?: Project[];
  initialDocuments?: Document[];
  initialDecisions?: Decision[];
  loadPeople(signal?: AbortSignal): Promise<Employee[]>;
  loadProjects(signal?: AbortSignal): Promise<Project[]>;
  loadDocuments(signal?: AbortSignal): Promise<Document[]>;
  /** Fetch one document's detail; resolves to undefined when the id is unknown. */
  loadDocument(id: string, signal?: AbortSignal): Promise<DocumentDetail | undefined>;
  loadDecisions(signal?: AbortSignal): Promise<Decision[]>;
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

const isAlternative = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    ["title", "disposition", "rationale"].every((key) => typeof record[key] === "string") &&
    Array.isArray(record.artifactIds) &&
    (record.artifactIds as unknown[]).every((item) => typeof item === "string")
  );
};

const isFollowUp = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    ["id", "description", "ownerId", "status"].every((key) => typeof record[key] === "string") &&
    Array.isArray(record.artifactIds) &&
    (record.artifactIds as unknown[]).every((item) => typeof item === "string") &&
    (record.dueDate === undefined || typeof record.dueDate === "string")
  );
};

const isDecision = (value: unknown): value is Decision => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const stringLists = ["contributorIds", "approverIds", "rationale", "alternatives", "caveats", "openQuestions", "followUps", "supersedes", "supersededBy", "artifactIds"];
  return (
    ["id", "title", "projectId", "status", "ownerId", "createdAt", "updatedAt", "problem"].every((key) => typeof record[key] === "string") &&
    stringLists.every((key) => Array.isArray(record[key])) &&
    (record.decidedAt === null || typeof record.decidedAt === "string") &&
    (record.finalDecision === null || typeof record.finalDecision === "string") &&
    (record.technicalOwnerId === undefined || typeof record.technicalOwnerId === "string") &&
    (record.leadingProposal === undefined || typeof record.leadingProposal === "string") &&
    (record.alternatives as unknown[]).every(isAlternative) &&
    (record.followUps as unknown[]).every(isFollowUp)
  );
};

export async function fetchDecisions(api: ApiClient, signal?: AbortSignal): Promise<Decision[]> {
  const res = await api.get("/decisions", signal);
  if (!res.ok) throw failure(res.status, "load decisions");
  const body: unknown = await res.json();
  if (!Array.isArray(body) || !body.every(isDecision)) throw new BackendError("The backend returned decisions in an unexpected shape.");
  return body;
}


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
    loadDecisions: (signal) => fetchDecisions(api, signal),
    loadDocument: (id, signal) =>
      fetchDocumentDetail(id, api, signal).catch((err: unknown) => {
        if (err instanceof BackendError && /no longer in the corpus/.test(err.message)) return undefined;
        throw err;
      }),
  };
}

