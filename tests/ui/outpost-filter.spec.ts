import {
  cardMatches,
  type OutpostFilter,
  type PlayCard,
  toggleFacet,
} from "../../app/src/live/outpost";

/** The Outpost's browse filter (#809 slice 1) — the one piece of the card surface that decides
 *  anything, so it is the one piece with a spec. Everything else renders the server verbatim. */

const card = (over: Partial<PlayCard> = {}): PlayCard => ({
  id: "S1-NVDA",
  symbol: "NVDA",
  author: { id: "house", name: "Skynet Capital", kind: "house" },
  thesis: "pre-print positioning bid",
  trigger: "earnings-window",
  window: "D-20 to D-6",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  traits: [{ id: "flat-before-the-release", label: "Flat before the release", claim: "…" }],
  evidence: "docs/research/nvda-earnings-cycle.md",
  ...over,
});

describe("cardMatches", () => {
  it("shows everything when nothing is filtered", () => {
    expect(cardMatches(card(), {})).toBe(true);
  });

  it("narrows by author — the member's headline ask", () => {
    expect(cardMatches(card(), { author: "house" })).toBe(true);
    expect(cardMatches(card(), { author: "someone-else" })).toBe(false);
  });

  it("narrows by symbol, trigger and trait on the same model", () => {
    expect(cardMatches(card(), { symbol: "NVDA" })).toBe(true);
    expect(cardMatches(card(), { symbol: "GOOG" })).toBe(false);
    expect(cardMatches(card(), { trigger: "earnings-window" })).toBe(true);
    expect(cardMatches(card(), { trigger: "event-driven" })).toBe(false);
    expect(cardMatches(card(), { trait: "flat-before-the-release" })).toBe(true);
    expect(cardMatches(card(), { trait: "holds-the-print" })).toBe(false);
  });

  it("ANDs the facets — every stated axis has to hold", () => {
    expect(cardMatches(card(), { author: "house", symbol: "GOOG" })).toBe(false);
  });

  it("matches a trait a card carries among several", () => {
    const many = card({
      traits: [
        { id: "flat-before-the-release", label: "a", claim: "…" },
        { id: "confirmed-dates-only", label: "b", claim: "…" },
      ],
    });
    expect(cardMatches(many, { trait: "confirmed-dates-only" })).toBe(true);
  });
});

describe("toggleFacet", () => {
  it("turns a facet on", () => {
    expect(toggleFacet({}, "symbol", "NVDA")).toEqual({ symbol: "NVDA" });
  });

  it("turns the SAME facet off again — clicking what you have on clears it", () => {
    expect(toggleFacet({ symbol: "NVDA" }, "symbol", "NVDA")).toEqual({});
  });

  it("replaces a facet with a different value on the same axis", () => {
    expect(toggleFacet({ symbol: "NVDA" }, "symbol", "GOOG")).toEqual({ symbol: "GOOG" });
  });

  it("leaves the other axes alone", () => {
    const filter: OutpostFilter = { author: "house", trait: "confirmed-dates-only" };
    expect(toggleFacet(filter, "symbol", "NVDA")).toEqual({ ...filter, symbol: "NVDA" });
  });

  it("never mutates the filter it was handed", () => {
    const filter: OutpostFilter = { symbol: "NVDA" };
    toggleFacet(filter, "symbol", "NVDA");
    expect(filter).toEqual({ symbol: "NVDA" });
  });
});
