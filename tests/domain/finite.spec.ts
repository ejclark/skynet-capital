import { fin } from "../../src/domain/finite.js";

/**
 * The numeric guard, tested for the one thing it promises: nothing unusable ever escapes it into
 * arithmetic. What it deliberately does NOT promise is that 0 means "measured zero" — callers that
 * must not imply a measurement track absence themselves.
 */
describe("fin — the finite guard", () => {
  it("passes a usable number through untouched, including a real zero and a negative", () => {
    expect(fin(42.5)).toBe(42.5);
    expect(fin(0)).toBe(0);
    expect(fin(-0.31)).toBe(-0.31);
  });

  it("turns every unusable input into 0 rather than letting it poison a sum", () => {
    expect(fin(Number.NaN)).toBe(0);
    expect(fin(Number.POSITIVE_INFINITY)).toBe(0);
    expect(fin(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(fin(undefined)).toBe(0);
  });

  it("never returns NaN, whatever it is handed", () => {
    for (const v of [Number.NaN, Number.POSITIVE_INFINITY, undefined, 1]) {
      expect(Number.isNaN(fin(v))).toBe(false);
    }
  });

  it("keeps a sum finite when one term is broken — the reason it exists", () => {
    const feed = [10, Number.NaN, 5, undefined, Number.POSITIVE_INFINITY];
    expect(feed.reduce<number>((acc, v) => acc + fin(v), 0)).toBe(15);
  });
});
