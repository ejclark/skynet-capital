import {
  HOUSE_AUTHOR,
  outpostCatalog,
  type PlayCard,
  type PlayFacet,
  type PlayTrait,
} from "../../src/discovery/play-cards.js";
import { G1_GOOG, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";

/** The Outpost's catalog: one card per exported play, every attribute derived by walking the play
 *  itself, and `author` real from day one so "filter by author" is not a placeholder. */

const catalog = outpostCatalog();
const card = (id: string): PlayCard | undefined => catalog.cards.find((c) => c.id === id);

describe("outpostCatalog", () => {
  it("cards every play the registry exports — a new play is browsable with no edit here", () => {
    expect(catalog.cards.map((c) => c.id)).toEqual([G1_GOOG.id, S1_NVDA.id, TACO_DJT.id].sort());
  });

  it("attributes every house play to the house, marked as the house's own roster", () => {
    expect(catalog.cards.every((c) => c.author.id === HOUSE_AUTHOR.id)).toBe(true);
    expect(catalog.cards.every((c) => c.author.kind === "house")).toBe(true);
  });

  it("mirrors the play's own thesis, symbol and sizing rather than restating them", () => {
    expect(card("S1-NVDA")?.thesis).toBe(S1_NVDA.thesis);
    expect(card("S1-NVDA")?.symbol).toBe("NVDA");
    expect(card("S1-NVDA")?.size).toEqual(S1_NVDA.size);
  });

  it("reads each window off the play — S1 out before the dead week, G1 held to the close", () => {
    expect(card("S1-NVDA")?.window).toBe("D-20 to D-6");
    expect(card("G1-GOOG")?.window).toBe("D-20 to the close of day D");
  });

  it("labels a date-keyed play as an earnings window, and an event-driven play distinctly", () => {
    expect(card("S1-NVDA")?.trigger).toBe("earnings-window");
    expect(card("G1-GOOG")?.trigger).toBe("earnings-window");
    expect(card("TACO-DJT")?.trigger).toBe("event-driven");
  });

  it("carries the play's citation verbatim, and its study as a research route", () => {
    expect(card("G1-GOOG")?.evidence).toBe(G1_GOOG.evidence);
    expect(card("G1-GOOG")?.href).toBe("/research/multi-symbol-sweep");
  });
});

describe("a card's traits", () => {
  const traits = (id: string): string[] => (card(id)?.traits ?? []).map((t: PlayTrait) => t.id);

  it("claims 'flat before the release' only for a play that is out before the number lands", () => {
    expect(traits("S1-NVDA")).toContain("flat-before-the-release");
    expect(traits("S1-NVDA")).not.toContain("holds-the-print");
  });

  it("claims the date policy for a play that refuses to open on an estimate", () => {
    expect(traits("G1-GOOG")).toContain("confirmed-dates-only");
  });

  it("backs every trait with what the probe observed, never a bare label", () => {
    for (const trait of catalog.cards.flatMap((c) => c.traits)) {
      expect(trait.claim.length).toBeGreaterThan(20);
    }
  });
});

describe("the browse facets", () => {
  it("counts an author facet so 'filter by author' works on the very first card", () => {
    const house: PlayFacet = { id: "house", label: "Skynet Capital", count: catalog.cards.length };

    expect(catalog.authors).toEqual([house]);
  });

  it("offers one symbol facet per symbol on the board", () => {
    expect(catalog.symbols.map((f) => f.id).sort()).toEqual(["DJT", "GOOG", "NVDA"]);
  });

  it("never offers a facet no card carries — an empty filter cannot be reached", () => {
    const ids = new Set(catalog.cards.flatMap((c) => c.traits.map((t) => t.id)));
    expect(catalog.traits.every((f) => ids.has(f.id) && f.count > 0)).toBe(true);
  });

  it("orders facets by how many cards carry them, most first", () => {
    const counts = catalog.traits.map((f) => f.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("is a pure derivation — two calls agree", () => {
    expect(outpostCatalog()).toEqual(catalog);
  });
});
