import { COLLECTION_PROBES } from "../../src/discovery/collection-probes.js";
import { personaCollections, unshelvedPersonas } from "../../src/discovery/persona-collections.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";

const shelves = personaCollections();
const shelf = (id: string) => shelves.find((c) => c.id === id);
const ids = (id: string) => (shelf(id)?.members ?? []).map((m) => m.id).sort();

describe("personaCollections", () => {
  it("derives one shelf per probe, in probe order", () => {
    expect(shelves.map((c) => c.id)).toEqual(COLLECTION_PROBES.map((p) => p.id));
  });

  it("groups the contrarians — the desks that buy a name the tape's news hates", () => {
    expect(ids("against-the-crowd")).toEqual(["news-fader", "sauron"]);
  });

  it("groups the trend followers — the desks that buy strength already running", () => {
    expect(ids("with-the-trend")).toEqual([
      "day-trader",
      "futurist",
      "retail-investor",
      "rumor-trader",
    ]);
  });

  it("groups the desks that sell a held name into euphoria, on a book with no P/L to take", () => {
    expect(ids("into-the-euphoria")).toEqual(["news-fader", "rumor-trader", "sauron"]);
  });

  it("groups the desks whose exits are ruled by the position rather than the mood", () => {
    expect(ids("by-the-book")).toEqual(["banker", "prospector"]);
  });

  it("groups the safe-haven rotation, and does NOT count buying the hated names as defensive", () => {
    expect(ids("flight-to-safety")).toEqual(["gold-bug"]);
  });

  it("groups the desks that open risk on a silent tape — no news, no momentum", () => {
    expect(ids("always-working")).toEqual(["banker", "prospector"]);
  });

  it("keeps a signal-indifferent desk off the signal shelves via the control run", () => {
    // The Prospector stakes NVDA on EVERY tape in the set, including each control. Without the
    // control run it would land on all six shelves and misdescribe itself on four of them.
    const staker = shelves.filter((c) => c.members.some((m) => m.id === "prospector"));
    expect(staker.map((c) => c.id).sort()).toEqual(["always-working", "by-the-book"]);
  });

  it("carries the persona's own order reason as the membership receipt", () => {
    const fader = shelf("against-the-crowd")?.members.find((m) => m.id === "news-fader");

    expect(fader?.evidence).toContain("Buying panic");
    expect(fader?.evidence).toContain("sentiment -0.90");
  });

  it("mirrors the registry's name and thesis, and carries the lore flavour line", () => {
    const sauron = shelf("against-the-crowd")?.members.find((m) => m.id === "sauron");
    const registry = createDefaultPersonas().find((p) => p.id === "sauron");

    expect(sauron?.kind).toBe("persona");
    expect(sauron?.name).toBe(registry?.name);
    expect(sauron?.thesis).toBe(registry?.thesis);
    expect(sauron?.lore).toContain("order-imposer");
  });

  it("states a mechanical claim on every shelf, so an evocative name cannot oversell", () => {
    for (const collection of shelves) {
      expect(collection.claim.length, `${collection.id} has no claim`).toBeGreaterThan(40);
      expect(collection.blurb.length).toBeGreaterThan(40);
    }
  });

  it("is a pure derivation — two calls agree, and no run colours the next", () => {
    expect(personaCollections()).toEqual(shelves);
  });
});

describe("unshelvedPersonas", () => {
  it("reports nothing while every registered persona lands on at least one shelf", () => {
    expect(unshelvedPersonas(shelves)).toEqual([]);
  });

  it("names every persona as unshelved when handed no shelves — absence renders ABSENT", () => {
    const all = unshelvedPersonas([]);

    expect(all.map((m) => m.id).sort()).toEqual(
      createDefaultPersonas()
        .map((p) => p.id)
        .sort(),
    );
    expect(all[0]?.evidence).toContain("No probe");
  });
});
