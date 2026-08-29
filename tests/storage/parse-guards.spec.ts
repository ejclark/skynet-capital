import { isRecord } from "../../src/storage/parse-guards.js";

describe("isRecord", () => {
  it("accepts a plain object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord({})).toBe(true);
  });

  it("rejects an array, even though typeof it is 'object'", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("rejects null, even though typeof it is 'object'", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("rejects non-object primitives", () => {
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord("a string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});
