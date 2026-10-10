import { describe, expect, it } from "vitest";
import { employees } from "@/data/employees";
import { projects } from "@/data/projects";
import { initials } from "@/lib/format";
import { tokenizeRichText, type RichTextLookups } from "@/lib/richText";
import { createApiClient, BackendError } from "@/services/apiClient";
import { createLiveCatalogSource, fetchPeople, fetchProjects, seedCatalogSource } from "@/services/catalogApi";
import { answerToPlainText } from "@/services/decisionOSService";
import { buildPeopleLookup, buildProjectsLookup } from "@/hooks/useCatalog";
import type { AssistantAnswer, Employee, Project } from "@/types";

const ada: Employee = { id: "ada-lovelace", name: "Ada Lovelace", role: "Staff Engineer", department: "Engineering", email: "ada@example.test" };
const prj: Project = { id: "PRJ-101", name: "Invoice Reconciliation", description: "Make reconciliation fast.", ownerId: "ada-lovelace" };

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

  it("the seed source is ready immediately and needs no backend", async () => {
    expect(seedCatalogSource.initialPeople).toEqual(employees);
    expect(await seedCatalogSource.loadPeople()).toEqual(employees);
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

  it("the seed source is ready immediately and needs no backend", async () => {
    expect(seedCatalogSource.initialProjects).toEqual(projects);
    expect(await seedCatalogSource.loadProjects()).toEqual(projects);
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

describe("answerToPlainText takes a person-name lookup", () => {
  const answer: AssistantAnswer = {
    confidence: "grounded",
    directAnswer: "Because.",
    sections: [
      {
        kind: "people",
        title: "Who was involved",
        people: [{ employeeId: "ada-lovelace", role: "Owner" }],
        actions: [{ description: "Write it up", ownerId: "ada-lovelace", dueDate: "2026-10-14" }],
      },
    ],
    decisionIds: [],
    evidence: [],
    personIds: [],
    suggestions: [],
  };

  it("uses the names it is given", () => {
    const text = answerToPlainText(answer, (id) => (id === "ada-lovelace" ? "Ada Lovelace" : id));
    expect(text).toContain("- Ada Lovelace: Owner");
    expect(text).toContain("- Write it up (Ada Lovelace, due 2026-10-14)");
  });
});
