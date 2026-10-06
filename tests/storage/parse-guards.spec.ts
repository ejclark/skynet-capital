import { isRecord, survivesParse } from "../../src/storage/parse-guards.js";

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

describe("survivesParse — would rewriting the parse lose anything the file held?", () => {
  it("holds when every key, value and element survives — a parser may add a key", () => {
    const record = { playbookId: "S1-NVDA", capitalAllocated: 5_000, symbols: ["NVDA"] };

    expect(
      survivesParse({ sauron: [record] }, { sauron: [{ ...record, accountId: "sauron" }] }),
    ).toBe(true);
  });

  it("fails on a dropped record, a dropped key, a changed value or a shortened list", () => {
    const record = { playbookId: "S1-NVDA", symbols: ["NVDA", "AMD"] };

    expect(survivesParse({ a: [record, record] }, { a: [record] })).toBe(false);
    expect(survivesParse({ a: [record] }, { a: [{ symbols: record.symbols }] })).toBe(false);
    expect(survivesParse({ a: [record] }, { a: [{ ...record, playbookId: "G1" }] })).toBe(false);
    expect(survivesParse({ a: [record] }, { a: [{ ...record, symbols: ["NVDA"] }] })).toBe(false);
    expect(survivesParse({ a: [] }, {})).toBe(false);
  });
});
