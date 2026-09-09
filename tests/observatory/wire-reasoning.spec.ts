import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { EquitySample } from "../../src/observatory/history-store.js";
import type { WireTradeRow } from "../../src/observatory/wire-data.js";
import { attachWireReasoning } from "../../src/observatory/wire-reasoning.js";

const row = (over: Partial<WireTradeRow> = {}): WireTradeRow => ({
  participantId: "sauron",
  participantName: "Sauron",
  kind: "bot",
  symbol: "NVDA",
  side: "buy",
  quantity: 20,
  at: "2026-08-28T14:00:00Z",
  reconstructed: false,
  orderId: "ord-1",
  ...over,
});

const intent = (over: Record<string, unknown> = {}) => ({
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 20,
  type: "market" as const,
  reason: "panic fade",
  ...over,
});

describe("attachWireReasoning", () => {
  it("passes a human row through unchanged, never calling findByOrderId", () => {
    let called = false;
    const rows = attachWireReasoning([row({ kind: "human" })], {
      findByOrderId: () => {
        called = true;
        return undefined;
      },
    });
    expect(rows[0]).not.toHaveProperty("reasoning");
    expect(called).toBe(false);
  });

  it("leaves a bot row with no reasoning when no decision resolves — never fabricated", () => {
    const rows = attachWireReasoning([row()], { findByOrderId: () => undefined });
    expect(rows[0]).not.toHaveProperty("reasoning");
  });

  it("attaches reason/strategy/expectation from the exact order-id join", () => {
    const guardedIntent = intent({
      strategy: "sauron-panic-claim",
      expectation: "expect a bounce",
    });
    const record: DecisionRecord = {
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [guardedIntent],
      guardedIntents: [guardedIntent],
      outcomes: [{ intent: guardedIntent, action: "placed" }],
    };
    const rows = attachWireReasoning([row()], {
      findByOrderId: (orderId) =>
        orderId === "ord-1" ? { record, intent: guardedIntent } : undefined,
    });
    expect(rows[0]?.reasoning).toEqual({
      reason: "panic fade",
      strategy: "sauron-panic-claim",
      expectation: "expect a bounce",
    });
  });

  it("computes guardDelta from the raw ask vs. the guarded (matched) intent, omitting it when equal", () => {
    const raw = intent({ quantity: 60 });
    const guarded = intent({ quantity: 20 });
    const record: DecisionRecord = {
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [raw],
      guardedIntents: [guarded],
      outcomes: [{ intent: guarded, action: "placed" }],
    };
    const rows = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: guarded }),
    });
    expect(rows[0]?.reasoning?.guardDelta).toBe("persona asked for 60, risk guards sized it to 20");

    const noClampRecord: DecisionRecord = { ...record, rawIntents: [guarded] };
    const unclamped = attachWireReasoning([row()], {
      findByOrderId: () => ({ record: noClampRecord, intent: guarded }),
    });
    expect(unclamped[0]?.reasoning).not.toHaveProperty("guardDelta");
  });

  it("never resolves reasoning without findByOrderId configured", () => {
    const rows = attachWireReasoning([row()], {});
    expect(rows[0]).not.toHaveProperty("reasoning");
  });

  it("attaches vitals only when history for that participant is supplied", () => {
    const guardedIntent = intent();
    const record: DecisionRecord = {
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [guardedIntent],
      guardedIntents: [guardedIntent],
      outcomes: [{ intent: guardedIntent, action: "placed" }],
    };
    const samples: EquitySample[] = [
      {
        at: "2026-08-28T13:00:00Z",
        participantId: "sauron",
        equity: 100_000,
        cash: 0,
        realizedPl: 0,
      },
      {
        at: "2026-08-28T14:00:00Z",
        participantId: "sauron",
        equity: 100_000,
        cash: 0,
        realizedPl: 0,
      },
    ];
    const withHistory = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: guardedIntent }),
      historyByParticipant: new Map([["sauron", samples]]),
    });
    expect(withHistory[0]?.vitals?.lossHeadroom.measured).toBe(true);

    const withoutHistory = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: guardedIntent }),
    });
    expect(withoutHistory[0]).not.toHaveProperty("vitals");
  });
});
