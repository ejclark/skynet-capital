import { normalizeStrike } from "../../src/live/strike";

/**
 * `normalizeStrike` (#2017 Phase 0 task 4e) — mirrors `normalizeSymbol` one-for-one: a narrow,
 * defensive check so a hand-typed or stale `?strike=` in the URL can't render garbage into the
 * ticket. Canonicalizes to `String(Number(raw))` so redundant representations of the same strike
 * (`"040.00"`, `"40"`) collapse to one URL value.
 */
describe("normalizeStrike", () => {
  it("keeps a valid integer strike", () => {
    expect(normalizeStrike("40")).toBe("40");
  });

  it("keeps a valid decimal strike", () => {
    expect(normalizeStrike("182.5")).toBe("182.5");
  });

  it("canonicalizes a padded/trailing-zero strike to its shortest form", () => {
    expect(normalizeStrike("040.00")).toBe("40");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeStrike("  180  ")).toBe("180");
  });

  it("drops zero", () => {
    expect(normalizeStrike("0")).toBeUndefined();
  });

  it("drops a negative strike", () => {
    expect(normalizeStrike("-5")).toBeUndefined();
  });

  it("drops a non-numeric value", () => {
    expect(normalizeStrike("NVDA")).toBeUndefined();
  });

  it("drops an empty string", () => {
    expect(normalizeStrike("")).toBeUndefined();
  });

  it("drops a non-string value", () => {
    expect(normalizeStrike(40)).toBeUndefined();
    expect(normalizeStrike({ strike: 40 })).toBeUndefined();
    expect(normalizeStrike(undefined)).toBeUndefined();
    expect(normalizeStrike(null)).toBeUndefined();
  });
});
