import { entityForPath } from "@/services/corpusFiles";
import type { CorpusCitation, Decision, Document } from "@/types";

/** Lookups the related-entity derivation needs; the catalog provides them. */
export interface RelatedLookups {
  decisionById: (id: string) => Decision | undefined;
  documentById: (id: string) => Document | undefined;
}

/** Decisions, documents, people and projects reachable from cited corpus paths. */
export interface RelatedEntities {
  decisions: Decision[];
  documents: Document[];
  personIds: string[];
  projectIds: string[];
}

/**
 * In live mode an answer cites corpus paths rather than seeded artifact ids.
 * Derives the entities behind those paths (the same ids `FileSlice.entity`
 * reports) and the people and projects they connect to.
 */
export function relatedEntitiesFromCitations(sources: CorpusCitation[], lookups: RelatedLookups): RelatedEntities {
  const decisions = new Map<string, Decision>();
  const documents = new Map<string, Document>();
  const people = new Set<string>();
  const projects = new Set<string>();
  for (const source of sources) {
    const entity = entityForPath(source.path);
    if (!entity) continue;
    if (entity.kind === "decision") {
      const decision = lookups.decisionById(entity.id);
      if (!decision) continue;
      decisions.set(decision.id, decision);
      projects.add(decision.projectId);
      people.add(decision.ownerId);
      if (decision.technicalOwnerId) people.add(decision.technicalOwnerId);
    } else if (entity.kind === "document") {
      const document = lookups.documentById(entity.id);
      if (!document) continue;
      documents.set(document.id, document);
      projects.add(document.projectId);
      for (const id of document.authorIds) people.add(id);
    }
  }
  return {
    decisions: [...decisions.values()],
    documents: [...documents.values()],
    personIds: [...people],
    projectIds: [...projects],
  };
}
