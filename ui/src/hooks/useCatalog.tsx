import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { decisionById } from "@/data/decisions";
import { knownArtifactIds } from "@/data/documents";
import type { RichTextLookups } from "@/lib/richText";
import { createLiveCatalogSource, seedCatalogSource, type CatalogSource } from "@/services/catalogApi";
import { isLiveMode } from "@/services/decisionOSService";
import type { Employee } from "@/types";

export type CatalogStatus = "loading" | "ready" | "error";

export interface PeopleLookup {
  personById: (id: string) => Employee | undefined;
  /** The person's name, or the id itself when the person is not in the catalog. */
  personName: (id: string) => string;
}

export interface Catalog extends PeopleLookup {
  people: Employee[];
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

const richTextLookups: RichTextLookups = {
  isArtifact: (id) => knownArtifactIds.has(id),
  isDecision: (id) => decisionById(id) !== undefined,
};

const defaultSource: CatalogSource = isLiveMode ? createLiveCatalogSource() : seedCatalogSource;

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ children, source = defaultSource }: { children: ReactNode; source?: CatalogSource }) {
  const [people, setPeople] = useState<Employee[]>(source.initialPeople ?? []);
  const [status, setStatus] = useState<CatalogStatus>(source.initialPeople ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source.initialPeople) return;
    const controller = new AbortController();
    setStatus("loading");
    source
      .loadPeople(controller.signal)
      .then((loaded) => {
        setPeople(loaded);
        setError(null);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load people.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [source]);

  const value = useMemo<Catalog>(
    () => ({ people, status, error, richTextLookups, ...buildPeopleLookup(people) }),
    [people, status, error],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
