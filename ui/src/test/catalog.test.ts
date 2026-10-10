import { describe, expect, it } from "vitest";
import { initials } from "@/lib/format";
import { tokenizeRichText, type RichTextLookups } from "@/lib/richText";
import { createApiClient, BackendError } from "@/services/apiClient";
import { createLiveCatalogSource, fetchDocumentDetail, fetchPeople, fetchProjects, fetchDocuments, fetchDecisions } from "@/services/catalogApi";
import { entityForPath } from "@/services/corpusFiles";
import { relatedEntitiesFromCitations } from "@/lib/relatedEntities";
import { buildDecisionsLookup, buildDocumentsLookup, buildPeopleLookup, buildProjectsLookup, buildRichTextLookups } from "@/hooks/useCatalog";
import type { Decision, Document, DocumentDetail, Employee, Project } from "@/types";

const ada: Employee = { id: "ada-lovelace", name: "Ada Lovelace", role: "Staff Engineer", department: "Engineering", email: "ada@example.test" };
const prj: Project = { id: "PRJ-101", name: "Invoice Reconciliation", description: "Make reconciliation fast.", ownerId: "ada-lovelace" };

const doc: Document = {
  id: "ZOOM-001",
  title: "Reconciliation rollout and peak-load review",
  type: "Zoom transcript",
  projectId: "PRJ-101",
  authorIds: ["maya-chen"],
  createdAt: "2026-09-30",
  decisionIds: ["DEC-001"],
  summary: "Review of load-test results.",
};
const docDetail: DocumentDetail = { ...doc, content: "## Attendees\nMaya Chen", bodyStartLine: 14 };

const respond = (status: number, body: unknown) =>
  (async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("people from the API", () => {
  it("requests GET /people and returns the employees", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify([ada]), { status: 200 });
    }) as unknown as typeof fetch;
    const people = await fetchPeople(createApiClient({ baseUrl: "/api", fetchImpl }));
    expect(urls).toEqual(["/api/people"]);
    expect(people).toEqual([ada]);
  });

  it("treats a 5xx from the dev proxy as the backend being down", async () => {
    await expect(fetchPeople(createApiClient({ fetchImpl: respond(502, "") }))).rejects.toThrow(/unavailable/);
  });

  it("reports an unreachable backend as a BackendError", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(fetchPeople(createApiClient({ fetchImpl }))).rejects.toBeInstanceOf(BackendError);
  });

  it("rejects a response that is not a list of employees", async () => {
    await expect(fetchPeople(createApiClient({ fetchImpl: respond(200, { detail: "nope" }) }))).rejects.toBeInstanceOf(BackendError);
    await expect(fetchPeople(createApiClient({ fetchImpl: respond(200, [{ id: "x" }]) }))).rejects.toBeInstanceOf(BackendError);
  });

  it("the live source loads over the API and has nothing preloaded", async () => {
    const source = createLiveCatalogSource({ fetchImpl: respond(200, [ada]) });
    expect(source.initialPeople).toBeUndefined();
    expect(await source.loadPeople()).toEqual([ada]);
  });

});

describe("projects from the API", () => {
  it("requests GET /projects and returns the projects", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify([prj]), { status: 200 });
    }) as unknown as typeof fetch;
    const loaded = await fetchProjects(createApiClient({ baseUrl: "/api", fetchImpl }));
    expect(urls).toEqual(["/api/projects"]);
    expect(loaded).toEqual([prj]);
  });

  it("reports a 5xx as the backend being down", async () => {
    await expect(fetchProjects(createApiClient({ fetchImpl: respond(502, "") }))).rejects.toThrow(/unavailable/);
  });

  it("reports an unreachable backend as a BackendError", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(fetchProjects(createApiClient({ fetchImpl }))).rejects.toBeInstanceOf(BackendError);
  });

  it("rejects a response that is not a list of projects", async () => {
    await expect(fetchProjects(createApiClient({ fetchImpl: respond(200, { detail: "nope" }) }))).rejects.toBeInstanceOf(BackendError);
    await expect(fetchProjects(createApiClient({ fetchImpl: respond(200, [{ id: "x" }]) }))).rejects.toBeInstanceOf(BackendError);
  });

  it("the live source loads over the API and has nothing preloaded", async () => {
    const source = createLiveCatalogSource({ fetchImpl: respond(200, [prj]) });
    expect(source.initialProjects).toBeUndefined();
    expect(await source.loadProjects()).toEqual([prj]);
  });

});

describe("projects lookup", () => {
  const lookup = buildProjectsLookup([prj]);

  it("finds a project by id", () => {
    expect(lookup.projectById("PRJ-101")).toEqual(prj);
    expect(lookup.projectById("PRJ-999")).toBeUndefined();
  });

  it("names a project, falling back to the id for an unknown one", () => {
    expect(lookup.projectName("PRJ-101")).toBe("Invoice Reconciliation");
    expect(lookup.projectName("PRJ-999")).toBe("PRJ-999");
  });
});

describe("documents from the API", () => {
  it("requests GET /documents and returns the list without content", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify([doc]), { status: 200 });
    }) as unknown as typeof fetch;
    const loaded = await fetchDocuments(createApiClient({ baseUrl: "/api", fetchImpl }));
    expect(urls).toEqual(["/api/documents"]);
    expect(loaded).toEqual([doc]);
    expect("content" in loaded[0]).toBe(false);
  });

  it("reports a 5xx as the backend being down", async () => {
    await expect(fetchDocuments(createApiClient({ fetchImpl: respond(502, "") }))).rejects.toThrow(/unavailable/);
  });

  it("rejects a response that is not a list of documents", async () => {
    await expect(fetchDocuments(createApiClient({ fetchImpl: respond(200, { detail: "nope" }) }))).rejects.toBeInstanceOf(BackendError);
    await expect(fetchDocuments(createApiClient({ fetchImpl: respond(200, [{ id: "x" }]) }))).rejects.toBeInstanceOf(BackendError);
  });

  it("the live source loads over the API and has nothing preloaded", async () => {
    const source = createLiveCatalogSource({ fetchImpl: respond(200, [doc]) });
    expect(source.initialDocuments).toBeUndefined();
    expect(await source.loadDocuments()).toEqual([doc]);
  });

});

describe("document detail from the API", () => {
  it("requests GET /documents/{id} and returns the detail", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify(docDetail), { status: 200 });
    }) as unknown as typeof fetch;
    const loaded = await fetchDocumentDetail("ZOOM-001", createApiClient({ baseUrl: "/api", fetchImpl }));
    expect(urls).toEqual(["/api/documents/ZOOM-001"]);
    expect(loaded).toEqual(docDetail);
  });

  it("reports an unknown document as a BackendError", async () => {
    await expect(fetchDocumentDetail("NOPE-001", createApiClient({ fetchImpl: respond(404, { detail: "unknown document" }) }))).rejects.toBeInstanceOf(
      BackendError,
    );
  });

  it("rejects a response that is not a document detail", async () => {
    await expect(
      fetchDocumentDetail("ZOOM-001", createApiClient({ fetchImpl: respond(200, { detail: "nope" }) })),
    ).rejects.toBeInstanceOf(BackendError);
  });
});

describe("documents lookup", () => {
  const lookup = buildDocumentsLookup([doc]);

  it("finds a document by id", () => {
    expect(lookup.documentById("ZOOM-001")).toEqual(doc);
    expect(lookup.documentById("NOPE-001")).toBeUndefined();
  });
});

describe("people lookup", () => {
  const lookup = buildPeopleLookup([ada]);

  it("finds a person by id", () => {
    expect(lookup.personById("ada-lovelace")).toEqual(ada);
    expect(lookup.personById("nobody")).toBeUndefined();
  });

  it("names a person, falling back to the id for an unknown one", () => {
    expect(lookup.personName("ada-lovelace")).toBe("Ada Lovelace");
    expect(lookup.personName("nobody")).toBe("nobody");
  });

  it("takes initials from the name", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Cher")).toBe("C");
  });
});

describe("rich text takes its lookups as parameters", () => {
  const lookups: RichTextLookups = { isArtifact: (id) => id === "ZOOM-001", isDecision: (id) => id === "DEC-001" };

  it("links only the records the lookups know", () => {
    expect(tokenizeRichText("See [ZOOM-001], [ZOOM-999], DEC-001 and DEC-999.", lookups)).toEqual([
      { kind: "text", text: "See " },
      { kind: "cite", id: "ZOOM-001" },
      { kind: "text", text: ", [ZOOM-999], " },
      { kind: "decision", id: "DEC-001" },
      { kind: "text", text: " and DEC-999." },
    ]);
  });
});

describe("decisions from the API", () => {
  const dec: Decision = {
    id: "DEC-001",
    title: "Phase rollout of large-account reconciliation",
    projectId: "PRJ-101",
    status: "Approved with follow-up",
    ownerId: "maya-chen",
    technicalOwnerId: "priya-nair",
    contributorIds: ["arjun-mehta"],
    approverIds: ["maya-chen"],
    decidedAt: "2026-10-01",
    createdAt: "2026-09-26",
    updatedAt: "2026-10-08",
    problem: "Large runs were slow.",
    finalDecision: "Launch to small accounts first.",
    rationale: ["Large-run p95 was 8.4 s. [ZOOM-001]"],
    alternatives: [{ title: "Delay the release", disposition: "Rejected", rationale: "Small accounts are ready.", artifactIds: ["ZOOM-001"] }],
    caveats: ["The threshold is provisional."],
    openQuestions: [],
    followUps: [{ id: "FU-001", description: "Profile the query plan.", ownerId: "priya-nair", dueDate: "2026-10-14", status: "Open", artifactIds: ["ENG-001"] }],
    supersedes: [],
    supersededBy: [],
    artifactIds: ["ZOOM-001", "ENG-001"],
  };

  it("requests GET /decisions and returns the decisions", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify([dec]), { status: 200 });
    }) as unknown as typeof fetch;
    const loaded = await fetchDecisions(createApiClient({ baseUrl: "/api", fetchImpl }));
    expect(urls).toEqual(["/api/decisions"]);
    expect(loaded).toEqual([dec]);
  });

  it("reports a 5xx as the backend being down", async () => {
    await expect(fetchDecisions(createApiClient({ fetchImpl: respond(502, "") }))).rejects.toThrow(/unavailable/);
  });

  it("rejects a response that is not a list of decisions", async () => {
    await expect(fetchDecisions(createApiClient({ fetchImpl: respond(200, { detail: "nope" }) }))).rejects.toBeInstanceOf(BackendError);
    await expect(fetchDecisions(createApiClient({ fetchImpl: respond(200, [{ id: "DEC-001" }]) }))).rejects.toBeInstanceOf(BackendError);
  });

  it("the live source loads decisions over the API and has nothing preloaded", async () => {
    const source = createLiveCatalogSource({ fetchImpl: respond(200, [dec]) });
    expect(source.initialDecisions).toBeUndefined();
    expect(await source.loadDecisions()).toEqual([dec]);
  });

});

describe("decisions lookup and rich text", () => {
  const dec: Decision = {
    id: "DEC-003",
    title: "Explainability for cash-flow forecasts",
    projectId: "PRJ-103",
    status: "Proposed",
    ownerId: "nadia-brooks",
    contributorIds: [],
    approverIds: [],
    decidedAt: null,
    createdAt: "2026-10-01",
    updatedAt: "2026-10-08",
    problem: "Discovery is not representative.",
    finalDecision: null,
    rationale: [],
    alternatives: [],
    caveats: [],
    openQuestions: [],
    followUps: [],
    supersedes: [],
    supersededBy: [],
    artifactIds: [],
  };
  const lookup = buildDecisionsLookup([dec]);

  it("finds a decision by id", () => {
    expect(lookup.decisionById("DEC-003")).toEqual(dec);
    expect(lookup.decisionById("DEC-999")).toBeUndefined();
  });

  it("lets rich text cite decisions the catalog knows", () => {
    const lookups = buildRichTextLookups([], [dec]);
    expect(lookups.isDecision("DEC-003")).toBe(true);
    expect(lookups.isDecision("DEC-001")).toBe(false);
  });
});

describe("entities behind cited corpus paths", () => {
  it("maps a corpus path to its entity", () => {
    expect(entityForPath("documents/ZOOM-001.md")).toEqual({ kind: "document", id: "ZOOM-001" });
    expect(entityForPath("decisions/DEC-001.md")).toEqual({ kind: "decision", id: "DEC-001" });
    expect(entityForPath("people/maya-chen.md")).toEqual({ kind: "person", id: "maya-chen" });
    expect(entityForPath("notes/todo.md")).toBeNull();
    expect(entityForPath("documents/archive/ZOOM-001.md")).toBeNull();
  });

  it("derives related decisions, documents, people and projects from citations", () => {
    const decision: Decision = {
      id: "DEC-001", title: "Phased rollout", projectId: "PRJ-101", status: "Approved with follow-up",
      ownerId: "maya-chen", technicalOwnerId: "priya-nair", contributorIds: [], approverIds: [],
      decidedAt: "2026-10-01", createdAt: "2026-09-26", updatedAt: "2026-10-08",
      problem: "p", finalDecision: "d", rationale: [], alternatives: [], caveats: [], openQuestions: [],
      followUps: [], supersedes: [], supersededBy: [], artifactIds: [],
    };
    const document: Document = {
      id: "ZOOM-001", title: "Load review", type: "Zoom transcript", projectId: "PRJ-101",
      authorIds: ["maya-chen", "zoe-park"], createdAt: "2026-09-30", decisionIds: ["DEC-001"], summary: "s",
    };
    const lookups = {
      decisionById: (id: string) => (id === "DEC-001" ? decision : undefined),
      documentById: (id: string) => (id === "ZOOM-001" ? document : undefined),
    };
    const related = relatedEntitiesFromCitations(
      [
        { path: "documents/ZOOM-001.md", lines: [10, 12] },
        { path: "decisions/DEC-001.md", lines: [3, 8] },
        { path: "README.md", lines: [1, 2] },
      ],
      lookups,
    );
    expect(related.decisions.map((d) => d.id)).toEqual(["DEC-001"]);
    expect(related.documents.map((d) => d.id)).toEqual(["ZOOM-001"]);
    expect(related.personIds.sort()).toEqual(["maya-chen", "priya-nair", "zoe-park"]);
    expect(related.projectIds).toEqual(["PRJ-101"]);
  });
});
