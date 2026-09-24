import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { readAccountDecisions } from "../../src/server/decision-account-view.js";

/**
 * `readAccountDecisions` (#3608 follow-up, found live 2026-09-24) — beta-scout trades on Sauron's
 * account while keeping its own decision history under `personaId: "beta-scout"`, so Sauron's own
 * `readDecisions("sauron")` never saw it. This pools in any OTHER persona the account's own trade
 * activity resolves to via `findByOrderId` — the same order-id join `playbook-performance.ts`
 * (PR 7d) already proves pools correctly across personas.
 */

const decision = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

const trade = (over: Partial<TradeActivityRecord> = {}): TradeActivityRecord =>
  ({
    orderId: "o1",
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    filledQuantity: 10,
    status: "filled",
    at: "2026-01-01T00:00:00Z",
    participantId: "sauron",
    source: "broker",
    ...over,
  }) as TradeActivityRecord;

describe("readAccountDecisions", () => {
  it("pools a foreign persona's full decision history when its trade lands on this account", async () => {
    const sauronRecords = [decision({ at: 1, personaId: "sauron" })];
    const betaRecords = [
      decision({ at: 2, personaId: "beta-scout" }),
      decision({ at: 3, personaId: "beta-scout", rawIntents: [], outcomes: [] }), // a quiet cycle
    ];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async (id) => (id === "sauron" ? sauronRecords : betaRecords),
      readTradeActivity: async () => [trade({ orderId: "beta-order" })],
      findByOrderId: (orderId) =>
        orderId === "beta-order"
          ? { record: decision({ personaId: "beta-scout" }), intent: {} as never }
          : undefined,
    });
    expect(records?.map((r) => r.at).sort()).toEqual([1, 2, 3]);
  });

  it("never pools anything when every trade's origin already matches the account", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      readTradeActivity: async () => [trade()],
      findByOrderId: () => ({ record: decision({ at: 1 }), intent: {} as never }),
    });
    expect(records).toBe(sauronRecords);
  });

  it("dedupes a foreign persona discovered via multiple trades — one fetch, not two", async () => {
    let betaFetches = 0;
    const records = await readAccountDecisions("sauron", {
      readDecisions: (id) => {
        if (id === "beta-scout") betaFetches++;
        return Promise.resolve(
          id === "sauron" ? [decision({ at: 1 })] : [decision({ at: 2, personaId: "beta-scout" })],
        );
      },
      readTradeActivity: async () => [trade({ orderId: "b1" }), trade({ orderId: "b2" })],
      findByOrderId: () => ({ record: decision({ personaId: "beta-scout" }), intent: {} as never }),
    });
    expect(betaFetches).toBe(1);
    expect(records?.map((r) => r.at).sort()).toEqual([1, 2]);
  });

  it("returns undefined — an honest absence — when the account has no decisions wired at all", async () => {
    const records = await readAccountDecisions("sauron", {});
    expect(records).toBeUndefined();
  });

  it("degrades to the account's own records when the cross-persona join isn't wired", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      // no readTradeActivity, no findByOrderId — an older deployment, or a desk with no ledger
    });
    expect(records).toBe(sauronRecords);
  });
});
