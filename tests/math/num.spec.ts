import { clamp, clamp01, lerp } from "../../src/math/num.js";

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
