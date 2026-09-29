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
      personaId: "sauron",
      reason: "panic fade",
      strategy: "sauron-panic-claim",
      expectation: "expect a bounce",
      cycleAt: "1970-01-01T00:00:00.001Z",
      rawCount: 1,
      guardedCount: 1,
    });
  });

  // #3961: a fill is one decision out of a round that weighed several. The round's own address and
  // its funnel ride along so the member surface can name the count and link to the whole pass —
  // before this, a traded round's siblings and refused ideas had nowhere to be reached from.
  it("carries the round's address and funnel — the ISO `at` a decision cycle uses, and both counts", () => {
    const raw = [intent(), intent({ symbol: "AMD" }), intent({ symbol: "MSFT" })];
    const guarded = [intent(), intent({ symbol: "AMD" })];
    const record: DecisionRecord = {
      at: Date.parse("2026-09-22T18:59:00.000Z"),
      personaId: "sauron",
      mode: "live",
      rawIntents: raw,
      guardedIntents: guarded,
      outcomes: [{ intent: guarded[0] as ReturnType<typeof intent>, action: "placed" }],
    };
    const rows = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: guarded[0] as ReturnType<typeof intent> }),
    });
    expect(rows[0]?.reasoning?.cycleAt).toBe("2026-09-22T18:59:00.000Z");
    expect(rows[0]?.reasoning?.rawCount).toBe(3);
    expect(rows[0]?.reasoning?.guardedCount).toBe(2);
  });

  it("omits the round's address for a record whose timestamp will not parse — never a wrong one", () => {
    const only = intent();
    const record = {
      at: Number.NaN,
      personaId: "sauron",
      mode: "live" as const,
      rawIntents: [only],
      guardedIntents: [only],
      outcomes: [{ intent: only, action: "placed" as const }],
    } as unknown as DecisionRecord;
    const rows = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: only }),
    });
    expect(rows[0]?.reasoning).not.toHaveProperty("cycleAt");
    expect(rows[0]?.reasoning?.rawCount).toBe(1);
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

describe("reasoningForOrder — playbook and deciding persona (#3687 slice 4)", () => {
  it("carries the playbook and whose decision it was, which need not be the account's own", () => {
    const scouted = intent({ playbookId: "BETA-SCOUT", playbookMode: "conservative" });
    const record: DecisionRecord = {
      at: 1,
      personaId: "beta-scout",
      mode: "live",
      rawIntents: [scouted],
      guardedIntents: [scouted],
      outcomes: [{ intent: scouted, action: "placed" }],
    };
    const rows = attachWireReasoning([row()], {
      findByOrderId: () => ({ record, intent: scouted as never }),
    });
    expect(rows[0]?.reasoning).toMatchObject({
      personaId: "beta-scout",
      playbookId: "BETA-SCOUT",
      playbookMode: "conservative",
    });
  });
});
