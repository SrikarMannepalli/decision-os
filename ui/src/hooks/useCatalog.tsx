import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { decisionById } from "@/data/decisions";
import { knownArtifactIds } from "@/data/documents";
import type { RichTextLookups } from "@/lib/richText";
import { createLiveCatalogSource, seedCatalogSource, type CatalogSource } from "@/services/catalogApi";
import { isLiveMode } from "@/services/decisionOSService";
import type { Employee, Project } from "@/types";

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

export interface Catalog extends PeopleLookup, ProjectsLookup {
  people: Employee[];
  projects: Project[];
  status: CatalogStatus;
  error: string | null;
  /** Documents and decisions still come from the seed until their endpoints land. */
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

const richTextLookups: RichTextLookups = {
  isArtifact: (id) => knownArtifactIds.has(id),
  isDecision: (id) => decisionById(id) !== undefined,
};

const defaultSource: CatalogSource = isLiveMode ? createLiveCatalogSource() : seedCatalogSource;

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ children, source = defaultSource }: { children: ReactNode; source?: CatalogSource }) {
  const [people, setPeople] = useState<Employee[]>(source.initialPeople ?? []);
  const [projects, setProjects] = useState<Project[]>(source.initialProjects ?? []);
  const [status, setStatus] = useState<CatalogStatus>(source.initialPeople && source.initialProjects ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source.initialPeople && source.initialProjects) return;
    const controller = new AbortController();
    setStatus("loading");
    Promise.all([source.loadPeople(controller.signal), source.loadProjects(controller.signal)])
      .then(([loadedPeople, loadedProjects]) => {
        setPeople(loadedPeople);
        setProjects(loadedProjects);
        setError(null);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load the catalog.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [source]);

  const value = useMemo<Catalog>(
    () => ({
      people,
      projects,
      status,
      error,
      richTextLookups,
      ...buildPeopleLookup(people),
      ...buildProjectsLookup(projects),
    }),
    [people, projects, status, error],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
