import { playbookStoreCatalog } from "../../src/discovery/playbook-store.js";

describe("playbookStoreCatalog", () => {
  it("returns one entry per house playbook, keyed by id and symbol", () => {
    const entries = playbookStoreCatalog();
    expect(entries.map((e) => e.id).sort()).toEqual([
      "CRWV-WHEEL",
      "G1-GOOG",
      "HC-SAURON",
      "NVDA-CALL-SPREAD",
      "S1-NVDA",
      "TACO-DJT",
    ]);
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

  // #3623: the retired Plays cards' derived facts now ride on the store entry.
  const byId = (id: string) => playbookStoreCatalog().find((e) => e.id === id);

  it("carries a date-windowed playbook's probe facts, evidence and study link", () => {
    const s1 = byId("S1-NVDA");
    expect(s1?.window).toBe("D-20 to D-6");
    expect(s1?.size?.standard).toBeGreaterThan(0);
    expect(s1?.traits.map((t) => t.id)).toEqual([
      "flat-before-the-release",
      "confirmed-dates-only",
    ]);
    expect(s1?.evidence).toContain("docs/research/");
    expect(s1?.evidenceHref).toMatch(/^\/research\//);
  });

  it("shows a tactical playbook's whole basket and no invented window", () => {
    const hc = byId("HC-SAURON");
    expect(hc?.symbols.length).toBeGreaterThan(1);
    expect(hc?.symbol).toBe(hc?.symbols[0]);
    expect(hc?.window).toBeUndefined();
    expect(hc?.size).toBeUndefined();
    expect(hc?.traits).toEqual([]);
  });

  it("shows an option playbook's rules as copy, never a probed window or a percent size", () => {
    const wheel = byId("CRWV-WHEEL");
    expect(wheel?.window).toBeUndefined();
    expect(wheel?.size).toBeUndefined();
    expect(wheel?.traits).toEqual([]);
    expect(wheel?.evidenceHref).toBe("/research/crwv-premium-fit");
  });

  it("says plainly the wheel runs against our own study, and when it retires", () => {
    const wheel = byId("CRWV-WHEEL");
    expect(wheel?.description).toContain("AGAINST our own study");
    expect(wheel?.description).toContain("about 70%");
    expect(wheel?.description).toContain("about 89%");
    expect(wheel?.description).toContain("below $0 on 2027-01-29");
    expect(wheel?.description).toContain("more than 1 in 3 of its sold puts");
    expect(wheel?.description).toContain("nothing switches it off automatically");
    expect(wheel?.exitCutLosses).toContain("The real loss is owning a falling stock");
    expect(wheel?.exitCutLosses).toContain("ride through an earnings print");
  });

  it("says the NVDA spread is S1-NVDA's run-up with the loss capped, confirmed dates only, out by D-5", () => {
    const spread = byId("NVDA-CALL-SPREAD");
    expect(spread?.window).toBeUndefined();
    expect(spread?.evidenceHref).toBe("/research/nvda-earnings-cycle");
    expect(spread?.description).toContain("options form of S1-NVDA's pre-earnings run-up");
    expect(spread?.description).toContain("The most it can lose is the debit paid");
    expect(spread?.enter).toContain("CONFIRMED NVIDIA earnings date");
    expect(spread?.exitTakeProfit).toContain("5 trading sessions before the print");
  });

  it("keeps an unevidenced playbook's honest note and links nowhere", () => {
    const taco = byId("TACO-DJT");
    expect(taco?.evidence.length).toBeGreaterThan(0);
    expect(taco?.evidenceHref).toBeUndefined();
  });

  it("is derived fresh each call, not a cached singleton", () => {
    expect(playbookStoreCatalog()).toEqual(playbookStoreCatalog());
    expect(playbookStoreCatalog()).not.toBe(playbookStoreCatalog());
  });
});
