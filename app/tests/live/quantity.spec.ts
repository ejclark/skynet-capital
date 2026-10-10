import { held, parseQuantity } from "../../src/live/quantity";

/**
 * A position's size as the server sends it (#5086): `toLocaleString("en-US")` of a SIGNED count.
 * WHEN the text carries a sign or thousands separators, THE one parser SHALL read the number it
 * names; WHEN it names no number, THE parser SHALL say so (NaN) rather than read it as zero.
 */
describe("parseQuantity", () => {
  it("reads a sold contract as a negative count", () => {
    expect(parseQuantity("-1")).toBe(-1);
  });

  it("reads thousands separators, which a bare Number() calls NaN", () => {
    expect(Number("1,200")).toBeNaN();
    expect(parseQuantity("1,200")).toBe(1200);
    expect(parseQuantity("-1,000")).toBe(-1000);
    expect(parseQuantity("12,345,678")).toBe(12_345_678);
  });

  it("reads a typographic minus and an explicit plus the same as their plain signs", () => {
    expect(parseQuantity("−1,000")).toBe(-1000);
    expect(parseQuantity("+40")).toBe(40);
  });

  it("keeps a fractional share", () => {
    expect(parseQuantity("0.5")).toBe(0.5);
  });

  it("names nothing for text that is not a count", () => {
    expect(parseQuantity("")).toBeNaN();
    expect(parseQuantity("—")).toBeNaN();
    expect(parseQuantity("1,2,x")).toBeNaN();
    expect(parseQuantity("--1")).toBeNaN();
  });
});

describe("held", () => {
  it("is the whole count and the side", () => {
    expect(held("-1")).toEqual({ count: 1, short: true });
    expect(held("1,200")).toEqual({ count: 1200, short: false });
    expect(held("-1,000")).toEqual({ count: 1000, short: true });
  });

  it("holds nothing when the text names no count", () => {
    expect(held("")).toEqual({ count: 0, short: false });
  });
});
