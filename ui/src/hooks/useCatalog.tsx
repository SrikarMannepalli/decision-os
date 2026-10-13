import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { knownArtifactIds } from "@/data/documents";
import type { RichTextLookups } from "@/lib/richText";
import { createLiveCatalogSource, seedCatalogSource, type CatalogSource } from "@/services/catalogApi";
import { isLiveMode } from "@/services/decisionOSService";
import type { Decision, Document, DocumentDetail, Employee, Project } from "@/types";

export type CatalogStatus = "loading" | "ready" | "error";

export interface PeopleLookup {
  personById: (id: string) => Employee | undefined;
  /** The person's name, or the id itself when the person is not in the catalog. */
  personName: (id: string) => string;
}

export interface ProjectsLookup {
  projectById: (id: string) => Project | undefined;
  /** The project's name, or the id itself when the project is not in the catalog. */
  projectName: (id: string) => string;
}

export interface DocumentsLookup {
  documentById: (id: string) => Document | undefined;
}

export interface DecisionsLookup {
  decisionById: (id: string) => Decision | undefined;
}

export interface Catalog extends PeopleLookup, ProjectsLookup, DocumentsLookup, DecisionsLookup {
  people: Employee[];
  projects: Project[];
  documents: Document[];
  decisions: Decision[];
  status: CatalogStatus;
  error: string | null;
  /** Fetch one document's detail (content, bodyStartLine); undefined when unknown. */
  loadDocument: (id: string, signal?: AbortSignal) => Promise<DocumentDetail | undefined>;
  richTextLookups: RichTextLookups;
}

export function buildPeopleLookup(people: Employee[]): PeopleLookup {
  const byId = new Map(people.map((person) => [person.id, person]));
  return {
    personById: (id) => byId.get(id),
    personName: (id) => byId.get(id)?.name ?? id,
  };
}

export function buildProjectsLookup(projects: Project[]): ProjectsLookup {
  const byId = new Map(projects.map((project) => [project.id, project]));
  return {
    projectById: (id) => byId.get(id),
    projectName: (id) => byId.get(id)?.name ?? id,
  };
}

export function buildDocumentsLookup(documents: Document[]): DocumentsLookup {
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  return {
    documentById: (id) => byId.get(id),
  };
}

export function buildDecisionsLookup(decisions: Decision[]): DecisionsLookup {
  const byId = new Map(decisions.map((decision) => [decision.id, decision]));
  return {
    decisionById: (id) => byId.get(id),
  };
}

/** Which ids a rich-text citation may link to. Unknown documents still resolve through the seed ids. */
export function buildRichTextLookups(documents: Document[], decisions: Decision[]): RichTextLookups {
  const ids = new Set([...knownArtifactIds, ...documents.map((doc) => doc.id)]);
  const decisionIds = new Set(decisions.map((decision) => decision.id));
  return {
    isArtifact: (id) => ids.has(id),
    isDecision: (id) => decisionIds.has(id),
  };
}

const defaultSource: CatalogSource = isLiveMode ? createLiveCatalogSource() : seedCatalogSource;

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ children, source = defaultSource }: { children: ReactNode; source?: CatalogSource }) {
  const [people, setPeople] = useState<Employee[]>(source.initialPeople ?? []);
  const [projects, setProjects] = useState<Project[]>(source.initialProjects ?? []);
  const [documents, setDocuments] = useState<Document[]>(source.initialDocuments ?? []);
  const [decisions, setDecisions] = useState<Decision[]>(source.initialDecisions ?? []);
  const preloaded = Boolean(source.initialPeople && source.initialProjects && source.initialDocuments && source.initialDecisions);
  const [status, setStatus] = useState<CatalogStatus>(preloaded ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preloaded) return;
    const controller = new AbortController();
    setStatus("loading");
    Promise.all([
        source.loadPeople(controller.signal),
        source.loadProjects(controller.signal),
        source.loadDocuments(controller.signal),
        source.loadDecisions(controller.signal),
      ])
      .then(([loadedPeople, loadedProjects, loadedDocuments, loadedDecisions]) => {
        setPeople(loadedPeople);
        setProjects(loadedProjects);
        setDocuments(loadedDocuments);
        setDecisions(loadedDecisions);
        setError(null);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load the catalog.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [source, preloaded]);

  const loadDocument = useCallback((id: string, signal?: AbortSignal) => source.loadDocument(id, signal), [source]);

  const value = useMemo<Catalog>(
    () => ({
      people,
      projects,
      documents,
      decisions,
      status,
      error,
      loadDocument,
      richTextLookups: buildRichTextLookups(documents, decisions),
      ...buildPeopleLookup(people),
      ...buildProjectsLookup(projects),
      ...buildDocumentsLookup(documents),
      ...buildDecisionsLookup(decisions),
    }),
    [people, projects, documents, decisions, status, error, loadDocument],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
