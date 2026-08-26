import {
  playbookCollections,
  unshelvedPlaybooks,
} from "../../src/discovery/playbook-collections.js";
import { G1_GOOG, S1_NVDA } from "../../src/playbooks/registry.js";

const shelves = playbookCollections();
const shelf = (id: string) => shelves.find((c) => c.id === id);
const member = (shelfId: string, id: string) => shelf(shelfId)?.members.find((m) => m.id === id);

describe("playbookCollections", () => {
  it("derives its roster from what the registry exports, not a hand-kept list", () => {
    const shelved = shelf("ahead-of-the-print")
      ?.members.map((m) => m.id)
      .sort();

    expect(shelved).toEqual([G1_GOOG.id, S1_NVDA.id].sort());
  });

  it("shelves every play that wants to be long before a confirmed print and flat at the release", () => {
    expect(shelf("ahead-of-the-print")?.members).toHaveLength(2);
  });

  it("reads S1's window off the play itself — long from D-20, flat inside its dead final week", () => {
    expect(member("ahead-of-the-print", "S1-NVDA")?.evidence).toBe(
      "Long D-20 to D-6; flat before the release.",
    );
  });

  it("reads G1's different exit honestly — held to the close of print day, never through it", () => {
    expect(member("ahead-of-the-print", "G1-GOOG")?.evidence).toBe(
      "Long D-20 to the close of day D; flat before the release.",
    );
  });

  it("shelves the date policy: the same date as an estimate opens no window at all", () => {
    expect(shelf("confirmed-dates-only")?.members).toHaveLength(2);
    expect(member("confirmed-dates-only", "S1-NVDA")?.evidence).toContain(
      "Same date as an estimate: no position",
    );
  });

  it("links each play to the research doc it cites, on the existing research shelf", () => {
    expect(member("ahead-of-the-print", "S1-NVDA")?.href).toBe("/research/nvda-earnings-cycle");
    expect(member("ahead-of-the-print", "G1-GOOG")?.href).toBe("/research/multi-symbol-sweep");
  });

  it("labels a play with its id and symbol, and mirrors the registry's thesis", () => {
    const play = member("ahead-of-the-print", "S1-NVDA");

    expect(play?.kind).toBe("playbook");
    expect(play?.name).toBe("S1-NVDA · NVDA");
    expect(play?.thesis).toBe(S1_NVDA.thesis);
  });

  it("is a pure derivation — two calls agree", () => {
    expect(playbookCollections()).toEqual(shelves);
  });
});

describe("unshelvedPlaybooks", () => {
  it("reports nothing while every exported play lands on a shelf", () => {
    expect(unshelvedPlaybooks(shelves)).toEqual([]);
  });

  it("names every play as unshelved when handed no shelves — absence renders ABSENT", () => {
    const all = unshelvedPlaybooks([]);

    expect(all.map((m) => m.id).sort()).toEqual([G1_GOOG.id, S1_NVDA.id].sort());
    expect(all[0]?.evidence).toContain("No shelf probe");
  });
});
