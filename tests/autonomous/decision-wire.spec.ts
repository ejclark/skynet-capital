import {
  DECISION_BATCH_KIND,
  MAX_DECISION_BATCH,
  parseDecisionBatch,
  parseDecisionRecord,
  parseDecisionsCursor,
} from "../../src/autonomous/decision-wire.js";

const rawIntent = { symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "x" };

const validRecord = () => ({
  at: 1_700_000_000_000,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [rawIntent],
  guardedIntents: [rawIntent],
  outcomes: [{ intent: rawIntent, action: "observed" }],
});

describe("parseDecisionRecord", () => {
  it("parses a well-formed record", () => {
    const parsed = parseDecisionRecord(validRecord());
    expect(parsed).toMatchObject({ at: 1_700_000_000_000, personaId: "sauron", mode: "observe" });
    expect(parsed?.outcomes).toHaveLength(1);
  });

  it("rejects a record missing outcomes — the exact malformed shape PR 0's crash-vector test used", () => {
    expect(parseDecisionRecord({ at: 1, personaId: "sauron", mode: "observe" })).toBeUndefined();
  });

  it("fails closed on one malformed element inside a well-formed envelope", () => {
    const bad = { ...validRecord(), rawIntents: [rawIntent, { symbol: "NVDA" }] };
    expect(parseDecisionRecord(bad)).toBeUndefined();
  });

  it("rejects an unknown mode", () => {
    expect(parseDecisionRecord({ ...validRecord(), mode: "sideways" })).toBeUndefined();
  });

  it("carries context and refusals when present, omits them when absent", () => {
    const withExtras = parseDecisionRecord({
      ...validRecord(),
      refusals: [{ intent: rawIntent, reason: "s2-print" }],
      context: { asOf: "t", quotes: {} },
    });
    expect(withExtras?.refusals).toEqual([{ intent: rawIntent, reason: "s2-print" }]);
    expect(withExtras?.context).toEqual({ asOf: "t", quotes: {} });

    const bare = parseDecisionRecord(validRecord());
    expect(bare).not.toHaveProperty("refusals");
    expect(bare).not.toHaveProperty("context");
  });
});

describe("parseDecisionBatch", () => {
  it("parses a well-formed batch", () => {
    const batch = parseDecisionBatch({
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [validRecord()],
    });
    expect(batch?.personaId).toBe("sauron");
    expect(batch?.records).toHaveLength(1);
  });

  it("rejects the wrong/missing kind — the version gate", () => {
    expect(
      parseDecisionBatch({ kind: "decision.v2", personaId: "sauron", records: [validRecord()] }),
    ).toBeUndefined();
    expect(parseDecisionBatch({ personaId: "sauron", records: [validRecord()] })).toBeUndefined();
  });

  it("rejects a batch mixing another persona's record into this envelope", () => {
    const mixed = {
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [{ ...validRecord(), personaId: "beta-scout" }],
    };
    expect(parseDecisionBatch(mixed)).toBeUndefined();
  });

  it("rejects an empty or over-cap records array — the bounded-batch invariant", () => {
    expect(
      parseDecisionBatch({ kind: DECISION_BATCH_KIND, personaId: "sauron", records: [] }),
    ).toBeUndefined();
    const tooMany = Array.from({ length: MAX_DECISION_BATCH + 1 }, () => validRecord());
    expect(
      parseDecisionBatch({ kind: DECISION_BATCH_KIND, personaId: "sauron", records: tooMany }),
    ).toBeUndefined();
  });

  it("rejects a malformed body outright — never throws", () => {
    expect(parseDecisionBatch("not an object")).toBeUndefined();
    expect(parseDecisionBatch(null)).toBeUndefined();
  });
});

describe("parseDecisionsCursor", () => {
  it("parses a plain personaId -> epochMs map", () => {
    expect(parseDecisionsCursor({ sauron: 100, "beta-scout": 200 })).toEqual({
      sauron: 100,
      "beta-scout": 200,
    });
  });

  it("fails open to {} on anything malformed — a torn poll must never crash replication", () => {
    expect(parseDecisionsCursor(undefined)).toEqual({});
    expect(parseDecisionsCursor(null)).toEqual({});
    expect(parseDecisionsCursor("garbage")).toEqual({});
  });

  it("drops a non-numeric entry rather than failing the whole cursor", () => {
    expect(parseDecisionsCursor({ sauron: 100, ghost: "not a number" })).toEqual({ sauron: 100 });
  });
});
