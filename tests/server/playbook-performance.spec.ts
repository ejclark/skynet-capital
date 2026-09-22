import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { playbookPerformance } from "../../src/server/playbook-performance.js";

/**
 * `playbookPerformance` (#2287 PR 7d) — the house-wide pool: every participant's closed trips,
 * playbook-tagged from that bot's own decision outcomes (`playbook-attribution.ts`), fed into
 * `statsByPlaybook`. The wiring `deskLedger`'s one production call site never did.
 */

function participant(over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot {
  return {
    id: "p1",
    kind: "bot",
    cash: 0,
    positions: [],
    activity: [],
    ...over,
  } as unknown as ParticipantSnapshot;
}

function fill(over: Partial<TradeActivityRecord> = {}): TradeActivityRecord {
  return {
    orderId: "o1",
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    filledQuantity: 10,
    price: 100,
    status: "filled",
    at: "2026-01-01T00:00:00Z",
    ...over,
  } as unknown as TradeActivityRecord;
}

/** One `IntentOutcome` naming the given order id and playbook — enough for
 *  `playbookTagsFromOutcomes` to tag it, nothing more. `RoundTrip.playbookId` rides the OPENING
 *  fill (`round-trips.ts`'s `attributionOf`), so this must tag the BUY order, not the close. */
function buyOutcome(orderId: string, playbookId: string): IntentOutcome {
  const intent = {
    symbol: "NVDA",
    side: "buy" as const,
    quantity: 10,
    type: "market" as const,
    reason: "x",
    playbookId,
  };
  return { intent, action: "placed", result: { intent, status: "filled", orderId } };
}

function decision(outcomes: readonly IntentOutcome[]): DecisionRecord {
  return { at: 1, personaId: "sauron", mode: "live", rawIntents: [], guardedIntents: [], outcomes };
}

describe("playbookPerformance", () => {
  it("pools trips from TWO DIFFERENT bot participants under one playbook line", async () => {
    const buySell = (prefix: string) => [
      fill({ orderId: `${prefix}-buy`, side: "buy", price: 100 }),
      fill({ orderId: `${prefix}-sell`, side: "sell", price: 110, at: "2026-01-02T00:00:00Z" }),
    ];

    const rows = await playbookPerformance(
      [participant({ id: "sauron" }), participant({ id: "beta-scout" })],
      {
        readTradeActivity: async (id) => (id === "sauron" ? buySell("a") : buySell("b")),
        readDecisions: async (id) => [
          decision([buyOutcome(id === "sauron" ? "a-buy" : "b-buy", "S1-NVDA")]),
        ],
      },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ playbookId: "S1-NVDA", trades: 2, netRealized: 200 });
  });

  it("never attributes a human participant's trades to a playbook — readDecisions is bot-only", async () => {
    const decisionsCalledFor: string[] = [];

    const rows = await playbookPerformance([participant({ id: "eric", kind: "human" })], {
      readTradeActivity: async () => [
        fill({ orderId: "h-buy", side: "buy" }),
        fill({ orderId: "h-sell", side: "sell", price: 120, at: "2026-01-02T00:00:00Z" }),
      ],
      readDecisions: (id) => {
        decisionsCalledFor.push(id);
        return Promise.resolve([]);
      },
    });

    expect(decisionsCalledFor).toEqual([]);
    // A real closed round trip exists, but with no playbookId it never scores as a playbook.
    expect(rows).toEqual([]);
  });

  it("skips a participant with a sync error entirely — never a partial or fabricated read", async () => {
    let readCalled = false;

    const rows = await playbookPerformance(
      [participant({ id: "broken", error: "credential invalid" })],
      {
        readTradeActivity: () => {
          readCalled = true;
          return Promise.resolve([fill(), fill({ orderId: "o2", side: "sell", price: 200 })]);
        },
      },
    );

    expect(readCalled).toBe(false);
    expect(rows).toEqual([]);
  });

  it("contributes nothing for a participant with no ledger reader wired at all", async () => {
    const rows = await playbookPerformance([participant({ id: "offline" })], {});
    expect(rows).toEqual([]);
  });
});
