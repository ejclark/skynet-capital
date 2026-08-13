import {
  MAX_INSIGHT_KIND_LENGTH,
  MAX_INSIGHT_PERSONA_ID_LENGTH,
  parseInsightRecord,
} from "../../src/autonomous/insight-record.js";

describe("parseInsightRecord", () => {
  const valid = { at: 123, personaId: "day-trader", kind: "observation", data: { symbol: "NVDA" } };

  it("accepts a well-formed record", () => {
    expect(parseInsightRecord(valid)).toEqual(valid);
  });

  it("accepts an empty data object", () => {
    expect(parseInsightRecord({ ...valid, data: {} })).toEqual({ ...valid, data: {} });
  });

  it.each([
    ["not an object", "nope"],
    ["null", null],
    ["an array", [valid]],
    ["undefined", undefined],
  ])("rejects the top-level value being %s", (_label, input) => {
    expect(parseInsightRecord(input)).toBeUndefined();
  });

  it.each([
    ["missing at", { ...valid, at: undefined }],
    ["non-numeric at", { ...valid, at: "123" }],
    ["NaN at", { ...valid, at: Number.NaN }],
    ["Infinity at", { ...valid, at: Number.POSITIVE_INFINITY }],
    ["missing personaId", { ...valid, personaId: undefined }],
    ["empty personaId", { ...valid, personaId: "" }],
    ["non-string personaId", { ...valid, personaId: 5 }],
    [
      "personaId over the length cap",
      { ...valid, personaId: "x".repeat(MAX_INSIGHT_PERSONA_ID_LENGTH + 1) },
    ],
    ["missing kind", { ...valid, kind: undefined }],
    ["empty kind", { ...valid, kind: "" }],
    ["non-string kind", { ...valid, kind: 5 }],
    ["kind over the length cap", { ...valid, kind: "x".repeat(MAX_INSIGHT_KIND_LENGTH + 1) }],
    ["missing data", { ...valid, data: undefined }],
    ["array data", { ...valid, data: [] }],
    ["null data", { ...valid, data: null }],
    ["non-object data", { ...valid, data: "oops" }],
  ])("rejects %s", (_label, input) => {
    expect(parseInsightRecord(input)).toBeUndefined();
  });

  it("accepts personaId/kind right at the length cap", () => {
    const record = {
      ...valid,
      personaId: "x".repeat(MAX_INSIGHT_PERSONA_ID_LENGTH),
      kind: "y".repeat(MAX_INSIGHT_KIND_LENGTH),
    };
    expect(parseInsightRecord(record)).toEqual(record);
  });
});
