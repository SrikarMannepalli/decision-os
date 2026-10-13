import type { SeedDocument } from "@/types";
import { dec001Documents } from "./documents/dec-001";
import { dec002Documents } from "./documents/dec-002";
import { dec003Documents } from "./documents/dec-003";

export const documents: SeedDocument[] = [...dec001Documents, ...dec002Documents, ...dec003Documents];

export const documentById = (id: string): SeedDocument | undefined => documents.find((d) => d.id === id);

/** Artifact IDs in the seeded corpus — the only IDs a citation may reference. */
export const knownArtifactIds: ReadonlySet<string> = new Set(documents.map((d) => d.id));
