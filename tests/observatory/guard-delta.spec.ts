import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { guardDeltaFor } from "../../src/observatory/guard-delta.js";

const intent = (over: Record<string, unknown> = {}) => ({
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 20,
  type: "market" as const,
  reason: "panic fade",
  ...over,
});

const recordWith = (rawIntents: ReturnType<typeof intent>[]): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "live",
  rawIntents,
  guardedIntents: [],
  outcomes: [],
});

describe("guardDeltaFor", () => {
  it("names the raw→guarded quantity clamp when the guards resized the ask", () => {
    const guarded = intent({ quantity: 20 });
    const record = recordWith([intent({ quantity: 60 })]);
    expect(guardDeltaFor(record, guarded)).toBe("persona asked for 60, risk guards sized it to 20");
  });

  it("is absent when the guarded quantity matches the raw ask — no clamp happened", () => {
    const guarded = intent({ quantity: 20 });
    const record = recordWith([intent({ quantity: 20 })]);
    expect(guardDeltaFor(record, guarded)).toBeUndefined();
  });

  it("is absent when no matching raw intent is found for the symbol+side", () => {
    const guarded = intent({ quantity: 20 });
    const record = recordWith([intent({ symbol: "AAPL", quantity: 60 })]);
    expect(guardDeltaFor(record, guarded)).toBeUndefined();
  });
});
