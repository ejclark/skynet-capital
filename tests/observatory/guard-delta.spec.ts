import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { guardDeltaFor } from "../../src/observatory/guard-delta.js";
import { anOptionIntent } from "../support/builders.js";

const intent = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 20,
  type: "market",
  reason: "panic fade",
  ...over,
});

const recordWith = (rawIntents: readonly OrderIntent[]): DecisionRecord => ({
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

  it("never pairs a covered call with a share sale on the same ticker (#4644)", () => {
    const shareSale = intent({ side: "sell", quantity: 50 });
    const call = anOptionIntent({
      symbol: shareSale.symbol,
      option: {
        structure: "covered-call",
        legs: [{ occSymbol: `${shareSale.symbol}261113C00250000`, side: "sell", ratio: 1 }],
        limitPrice: 1.5,
      },
    });
    const record = recordWith([shareSale, call]);
    expect(guardDeltaFor(record, call)).toBeUndefined();
  });
});
