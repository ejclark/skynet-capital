import { clamp, clamp01, lerp, maxOf, minOf } from "../../src/math/num.js";

describe("minOf / maxOf — extremes of a series of any length (#4612 slice 3, #4615)", () => {
  // Math.min(...values) passes every value as an argument and throws RangeError past ~121k of
  // them; a pulse curve takes one value per stored equity sample, so a long history would 500.
  it("finds the low and the high of 200k values without throwing", () => {
    const series = Array.from({ length: 200_000 }, (_, i) => (i * 7_919) % 1_000);
    series[150_000] = -42;
    series[3] = 1_000_000;

    expect(minOf(series)).toBe(-42);
    expect(maxOf(series)).toBe(1_000_000);
  });

  it("answers exactly what Math.min / Math.max answer on a short series", () => {
    const short = [3, -2.5, 7, 0];
    expect(minOf(short)).toBe(Math.min(...short));
    expect(maxOf(short)).toBe(Math.max(...short));
  });

  it("keeps Math's answers for an empty series and for a NaN inside one", () => {
    expect(minOf([])).toBe(Number.POSITIVE_INFINITY);
    expect(maxOf([])).toBe(Number.NEGATIVE_INFINITY);
    expect(minOf([1, Number.NaN, 2])).toBeNaN();
    expect(maxOf([1, Number.NaN, 2])).toBeNaN();
  });

  it("reads any iterable, so a Map's values need no intermediate array", () => {
    const byWeek = new Map([
      ["a", 4],
      ["b", -1],
    ]);
    expect(minOf(byWeek.values())).toBe(-1);
    expect(maxOf(byWeek.values())).toBe(4);
  });
});

describe("clamp", () => {
  it("returns the value when it is already inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("pulls values back to the nearest bound", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("handles a negative range", () => {
    expect(clamp(-5, -1, 1)).toBe(-1);
  });
});

describe("clamp01", () => {
  it("constrains to the normalized range", () => {
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });
});

describe("lerp", () => {
  it("returns the endpoints at t=0 and t=1", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("interpolates the midpoint", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("extrapolates beyond the range — callers clamp when they mean to", () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });
});
