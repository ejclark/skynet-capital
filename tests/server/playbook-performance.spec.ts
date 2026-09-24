import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  playbookPerformance,
  playbookPerformanceView,
  selectAccounts,
} from "../../src/server/playbook-performance.js";

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
      [participant({ id: "sauron" }), participant({ id: "vader" })],
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

  describe("a persona trading on ANOTHER bot's ledger (found live, 2026-09-24)", () => {
    // Production topology: beta-scout is not a participant with its own account. Its fills land on
    // Sauron's broker, while its decisions file under "beta-scout". Sauron's own decisions know
    // nothing about those orders.
    const sauronLedger = [
      fill({ orderId: "b-buy", side: "buy", price: 100 }),
      fill({ orderId: "b-sell", side: "sell", price: 110, at: "2026-01-02T00:00:00Z" }),
    ];
    const scoutRecord: DecisionRecord = {
      ...decision([buyOutcome("b-buy", "BETA-SCOUT")]),
      personaId: "beta-scout",
    };
    const base = {
      readTradeActivity: async () => sauronLedger,
      readDecisions: async (id: string) => (id === "beta-scout" ? [scoutRecord] : []),
    };

    it("tags the trip with the other persona's playbook, found by order id", async () => {
      const rows = await playbookPerformance([participant({ id: "sauron" })], {
        ...base,
        findByOrderId: (orderId) =>
          orderId.startsWith("b-")
            ? { record: scoutRecord, intent: scoutRecord.outcomes[0]?.intent as never }
            : undefined,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ playbookId: "BETA-SCOUT", trades: 1, netRealized: 100 });
    });

    it("leaves the trip untagged, never guessed, when the order-id join isn't wired", async () => {
      const rows = await playbookPerformance([participant({ id: "sauron" })], base);
      expect(rows).toEqual([]);
    });
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

describe("playbookPerformanceView — mine vs. the house, never blended (#3665)", () => {
  // Two bots on the same playbook: "mine" earns +10, "theirs" earns +30.
  const ledgers: Record<string, TradeActivityRecord[]> = {
    mine: [
      fill({ orderId: "m-buy", side: "buy", price: 100 }),
      fill({ orderId: "m-sell", side: "sell", price: 101, at: "2026-01-02T00:00:00Z" }),
    ],
    theirs: [
      fill({ orderId: "t-buy", side: "buy", price: 100 }),
      fill({ orderId: "t-sell", side: "sell", price: 103, at: "2026-01-02T00:00:00Z" }),
    ],
  };
  const deps = {
    readTradeActivity: async (id: string) => ledgers[id] ?? [],
    readDecisions: async (id: string) => [
      decision([buyOutcome(id === "mine" ? "m-buy" : "t-buy", "S1-NVDA")]),
    ],
  };
  const everyone = [participant({ id: "mine" }), participant({ id: "theirs" })];

  it("scores the house across everyone and 'mine' across only the scoped accounts", async () => {
    const view = await playbookPerformanceView(everyone, ["mine"], deps);
    expect(view.house[0]).toMatchObject({ playbookId: "S1-NVDA", trades: 2, netRealized: 40 });
    expect(view.mine?.[0]).toMatchObject({ playbookId: "S1-NVDA", trades: 1, netRealized: 10 });
    expect(view.accounts).toEqual(["mine"]);
  });

  it("reports 'mine' as null, not an empty list, when the viewer has no live account in scope", async () => {
    const view = await playbookPerformanceView(everyone, [], deps);
    expect(view.mine).toBeNull();
    expect(view.accounts).toEqual([]);
    const offline = await playbookPerformanceView(
      [participant({ id: "mine", error: "sync failed" }), participant({ id: "theirs" })],
      ["mine"],
      deps,
    );
    expect(offline.mine).toBeNull();
  });

  it("an account with no attributed trips still reads as an empty 'mine', distinct from null", async () => {
    const view = await playbookPerformanceView(
      [...everyone, participant({ id: "idle" })],
      ["idle"],
      deps,
    );
    expect(view.mine).toEqual([]);
    expect(view.accounts).toEqual(["idle"]);
  });
});

describe("selectAccounts — a selection narrows, never widens", () => {
  it("defaults to every owned account", () => {
    expect(selectAccounts(["a", "b"], null)).toEqual(["a", "b"]);
  });

  it("narrows to the requested subset of owned accounts", () => {
    expect(selectAccounts(["a", "b", "c"], "c, a")).toEqual(["a", "c"]);
  });

  it("drops a requested account the viewer does not own", () => {
    expect(selectAccounts(["a"], "a,someone-else")).toEqual(["a"]);
    expect(selectAccounts([], "someone-else")).toEqual([]);
  });
});

describe("playbookPerformance — every trip tagged, however old (found 2026-09-24)", () => {
  // 50 round trips, each opened by its own S1-NVDA decision. The store's default read is its
  // newest 30 decisions — exactly what the production bridge serves for a page-less read.
  const TRIPS = 50;
  const fills = Array.from({ length: TRIPS }, (_, i) => [
    fill({
      orderId: `b-${i}`,
      side: "buy",
      price: 100,
      at: new Date(Date.UTC(2026, 0, 1, 0, i * 2)).toISOString(),
    }),
    fill({
      orderId: `s-${i}`,
      side: "sell",
      price: 101,
      at: new Date(Date.UTC(2026, 0, 1, 0, i * 2 + 1)).toISOString(),
    }),
  ]).flat();
  const records = Array.from({ length: TRIPS }, (_, i) => ({
    ...decision([buyOutcome(`b-${i}`, "S1-NVDA")]),
    at: i,
  }));
  const deps = {
    readTradeActivity: () => Promise.resolve(fills),
    readDecisions: () => Promise.resolve([...records].sort((a, b) => b.at - a.at).slice(0, 30)),
    findByOrderId: (orderId: string) => {
      const record = records.find((r) => r.outcomes[0]?.result?.orderId === orderId);
      return record ? { record, intent: record.outcomes[0]?.intent as never } : undefined;
    },
  };

  it("attributes all 50 trips, not just those inside the newest 30 decisions", async () => {
    const [row] = await playbookPerformance([participant({ id: "sauron" })], deps);
    expect(row).toMatchObject({ playbookId: "S1-NVDA", trades: TRIPS });
  });
});
