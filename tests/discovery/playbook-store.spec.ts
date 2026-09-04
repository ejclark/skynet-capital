import { playbookStoreCatalog } from "../../src/discovery/playbook-store.js";

describe("playbookStoreCatalog", () => {
  it("returns one entry per house playbook, keyed by id and symbol", () => {
    const entries = playbookStoreCatalog();
    expect(entries.map((e) => e.id).sort()).toEqual(["G1-GOOG", "S1-NVDA", "TACO-DJT"]);
    for (const entry of entries) {
      expect(entry.symbol.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a non-empty description and all four trigger fields", () => {
    for (const entry of playbookStoreCatalog()) {
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.enter.length).toBeGreaterThan(0);
      expect(entry.exitTakeProfit.length).toBeGreaterThan(0);
      expect(entry.exitCutLosses.length).toBeGreaterThan(0);
      expect(entry.hold.length).toBeGreaterThan(0);
    }
  });

  it("metrics is present but empty — shape is TBD (#885)", () => {
    for (const entry of playbookStoreCatalog()) {
      expect(entry.metrics).toEqual([]);
    }
  });

  it("is derived fresh each call, not a cached singleton", () => {
    expect(playbookStoreCatalog()).toEqual(playbookStoreCatalog());
    expect(playbookStoreCatalog()).not.toBe(playbookStoreCatalog());
  });
});
