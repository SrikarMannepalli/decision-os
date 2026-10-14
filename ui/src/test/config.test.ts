import { describe, expect, it } from "vitest";
import { dataSource, isLiveMode } from "@/config";
import { seedCatalogSource } from "@/services/catalogApi";

describe("data source flag", () => {
  it("defaults to the seed, so the UI needs no backend", () => {
    expect(dataSource).toBe("seed");
    expect(isLiveMode).toBe(false);
  });

  it("has a fully preloaded seed catalog", async () => {
    expect(seedCatalogSource.initialPeople?.length).toBeGreaterThan(0);
    expect(seedCatalogSource.initialDecisions?.length).toBeGreaterThan(0);
    expect((await seedCatalogSource.loadDocument("ZOOM-001"))?.content).toBeTruthy();
  });
});
