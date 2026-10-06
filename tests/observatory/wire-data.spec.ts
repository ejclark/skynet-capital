import type { OptionOrderLeg } from "../../src/autonomous/decision-db-leg-orders.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { activityEventFromTradeRecord } from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { spreadLookup } from "../../src/observatory/spread-activity.js";
import {
  buildWirePnlRows,
  buildWireTradeRows as buildWireTradeRowsFromEvents,
  type WireTradeRow,
  type WireTradeRowsPage,
} from "../../src/observatory/wire-data.js";
import { anOptionIntent } from "../support/builders.js";

/** #784 slice 1 moved `buildWireTradeRows` onto the `ActivityEvent` envelope. Translating the
 *  records through `activityEventFromTradeRecord` here — the same translator the bus publishes
 *  with — leaves every existing assertion below untouched, which is the point: the whole suite now
 *  doubles as the proof that the round trip through the envelope changes no row the page renders. */
function buildWireTradeRowsPage(
  records: readonly TradeActivityRecord[],
  participants: readonly ParticipantSnapshot[],
  opts: Parameters<typeof buildWireTradeRowsFromEvents>[2],
  underlyingFilter?: string,
): WireTradeRowsPage {
  return buildWireTradeRowsFromEvents(
    records.map(activityEventFromTradeRecord),
    participants,
    opts,
    underlyingFilter,
  );
}

/** PR 5 (issue #2287) turned the bare `limit: number` param into a `{limit, before}` page request
 *  and the bare-array return into `{rows, nextCursor}` — this thin wrapper keeps every existing
 *  bare-`limit`/bare-array test below unchanged. */
function buildWireTradeRows(
  records: readonly TradeActivityRecord[],
  participants: readonly ParticipantSnapshot[],
  limit: number,
  underlyingFilter?: string,
): WireTradeRow[] {
  return buildWireTradeRowsPage(records, participants, { limit }, underlyingFilter).rows;
}

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

const snapshot = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 1000,
  equity: 5000,
  positions: [],
  ...overrides,
});

describe("buildWireTradeRows", () => {
  it("joins a participant's display name and kind onto each collapsed row, newest first", () => {
    const records = [
      record({ orderId: "ord-1", at: "2026-08-19T14:00:00.000Z" }),
      record({ orderId: "ord-2", at: "2026-08-20T14:00:00.000Z", side: "sell" }),
    ];
    const rows = buildWireTradeRows(records, [snapshot()], 10);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      participantId: "sauron",
      participantName: "Sauron",
      kind: "bot",
      side: "sell",
    });
  });

  it("falls back to the raw participant id when no snapshot matches", () => {
    const rows = buildWireTradeRows([record({ participantId: "ghost" })], [snapshot()], 10);
    expect(rows[0]?.participantName).toBe("ghost");
    expect(rows[0]?.kind).toBe("human");
  });

  it("drops unfilled orders — a submitted order is not a trade", () => {
    const rows = buildWireTradeRows([record({ filledQuantity: 0 })], [snapshot()], 10);
    expect(rows).toHaveLength(0);
  });

  it("flags a backfilled/broker-window row as reconstructed, never a stream-captured one", () => {
    const rows = buildWireTradeRows(
      [
        record({ orderId: "a", source: "stream", at: "2026-08-19T14:00:00.000Z" }),
        record({ orderId: "b", source: "backfill", at: "2026-08-19T15:00:00.000Z" }),
      ],
      [snapshot()],
      10,
    );
    expect(rows.find((r) => r.at === "2026-08-19T14:00:00.000Z")?.reconstructed).toBe(false);
    expect(rows.find((r) => r.at === "2026-08-19T15:00:00.000Z")?.reconstructed).toBe(true);
  });

  it("bounds the result to `limit`", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      record({ orderId: `ord-${i}`, at: `2026-08-${10 + i}T00:00:00.000Z` }),
    );
    expect(buildWireTradeRows(many, [snapshot()], 2)).toHaveLength(2);
  });

  // #2017 Phase 1 slice 12 — the who-else-traded row's server-side symbol filtering.
  describe("underlyingFilter", () => {
    it("keeps a symbol's option fills whose OCC underlying matches, even though the raw symbol isn't the bare ticker", () => {
      const rows = buildWireTradeRows(
        [record({ orderId: "opt", symbol: "NVDA261016C00185000" })],
        [snapshot()],
        10,
        "NVDA",
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.symbol).toBe("NVDA261016C00185000");
    });

    it("drops non-matching rows, even ones that would otherwise fit within the original limit", () => {
      const rows = buildWireTradeRows(
        [
          record({ orderId: "a", symbol: "NVDA" }),
          record({ orderId: "b", symbol: "TSLA" }),
          record({ orderId: "c", symbol: "TSLA260918P00420000" }),
        ],
        [snapshot()],
        10,
        "NVDA",
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.symbol).toBe("NVDA");
    });

    it("filters BEFORE the `limit` slice, so an older matching fill survives an unrelated global cap", () => {
      // 3 recent TSLA fills (unrelated to the ticket's symbol) followed by an OLDER NVDA fill.
      // A naive filter-after-slice at limit=3 would slice down to the 3 TSLA rows first and
      // silently drop the NVDA fill before the filter ever saw it.
      const records = [
        record({ orderId: "t1", symbol: "TSLA", at: "2026-08-22T00:00:00.000Z" }),
        record({ orderId: "t2", symbol: "TSLA", at: "2026-08-21T00:00:00.000Z" }),
        record({ orderId: "t3", symbol: "TSLA", at: "2026-08-20T00:00:00.000Z" }),
        record({ orderId: "old-nvda", symbol: "NVDA", at: "2026-08-19T00:00:00.000Z" }),
      ];

      const rows = buildWireTradeRows(records, [snapshot()], 3, "NVDA");

      expect(rows).toHaveLength(1);
      expect(rows[0]?.symbol).toBe("NVDA");
    });
  });
});

describe("buildWireTradeRows — pagination (PR 5, issue #2287)", () => {
  const records = Array.from({ length: 5 }, (_, i) =>
    record({ orderId: `ord-${i}`, at: `2026-08-2${i}T00:00:00.000Z` }),
  );

  it("omits nextCursor when the page isn't full", () => {
    const page = buildWireTradeRowsPage(records, [snapshot()], { limit: 1_000 });
    expect(page.rows).toHaveLength(5);
    expect(page).not.toHaveProperty("nextCursor");
  });

  it("pages with an exclusive before cursor, newest first", () => {
    const first = buildWireTradeRowsPage(records, [snapshot()], { limit: 2 });
    expect(first.rows.map((r) => r.at)).toEqual([
      "2026-08-24T00:00:00.000Z",
      "2026-08-23T00:00:00.000Z",
    ]);
    expect(first.nextCursor).toBe("2026-08-23T00:00:00.000Z");

    const next = buildWireTradeRowsPage(records, [snapshot()], {
      limit: 2,
      before: first.nextCursor,
    });
    expect(next.rows.map((r) => r.at)).toEqual([
      "2026-08-22T00:00:00.000Z",
      "2026-08-21T00:00:00.000Z",
    ]);
  });
});

/** A bot's spread on the Wire (#4650): the account reports its fills one per leg, under each leg's
 *  own order id, so without a fold the Wire listed two contract trades no decision explains. Folded
 *  BEFORE the page bound, the spread is one row under the decision's own order id — the id its why
 *  is filed under — counted in whole spreads, priced at its net per share. */
describe("buildWireTradeRows — a bot's spread, one row (#4650)", () => {
  const LOW = "NVDA261113C00185000";
  const HIGH = "NVDA261113C00200000";
  const spread = anOptionIntent({
    symbol: "NVDA",
    side: "buy",
    playbookId: "NVDA-CALL-SPREAD",
    option: {
      structure: "call-debit-spread",
      legs: [
        { occSymbol: LOW, side: "buy", ratio: 1 },
        { occSymbol: HIGH, side: "sell", ratio: 1 },
      ],
      limitPrice: 3.4,
    },
  });
  const decision: DecisionRecord = {
    at: 1,
    personaId: "sauron",
    mode: "live",
    rawIntents: [spread],
    guardedIntents: [spread],
    outcomes: [
      {
        intent: spread,
        action: "placed",
        result: {
          intent: spread,
          status: "filled",
          orderId: "mleg-1",
          filledQuantity: 1,
          filledPrice: 3.35,
          legFills: [
            { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
            { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
          ],
        },
      },
    ],
  };
  const leg = (legOrderId: string, occSymbol: string, side: "buy" | "sell"): OptionOrderLeg => ({
    legOrderId,
    parentOrderId: "mleg-1",
    occSymbol,
    side,
    ratio: 1,
  });
  const LEGS: Record<string, OptionOrderLeg> = {
    "leg-low": leg("leg-low", LOW, "buy"),
    "leg-high": leg("leg-high", HIGH, "sell"),
  };
  const spreadOf = () =>
    spreadLookup({
      findSpreadLeg: (id) => LEGS[id],
      findByOrderId: (id) =>
        id === "mleg-1" ? { record: decision, intent: spread as OrderIntent } : undefined,
    });
  const low = record({
    orderId: "leg-low",
    symbol: LOW,
    quantity: 1,
    filledQuantity: 1,
    price: 5.1,
    at: "2026-10-27T15:00:05.000Z",
  });
  const high = record({
    orderId: "leg-high",
    symbol: HIGH,
    side: "sell",
    quantity: 1,
    filledQuantity: 1,
    price: 1.75,
    at: "2026-10-27T15:00:06.000Z",
    source: "backfill",
  });
  const stray = record({ orderId: "stray", at: "2026-10-26T15:00:00.000Z" });

  it("folds both leg fills into one row: the spread's order id, in words, its net per share", () => {
    const { rows } = buildWireTradeRowsPage([low, high, stray], [snapshot()], {
      limit: 10,
      spreadOf: spreadOf(),
    });
    expect(rows.map((r) => r.orderId)).toEqual(["mleg-1", "stray"]);
    expect(rows[0]).toMatchObject({
      participantId: "sauron",
      kind: "bot",
      // The broker's own symbol for a multi-leg order: none.
      symbol: "",
      side: "buy",
      quantity: 1,
      // At its newest leg's moment; recovered after the fact if any leg was.
      at: "2026-10-27T15:00:06.000Z",
      reconstructed: true,
      spread: {
        display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
        net: { dollars: 335, direction: "paid" },
      },
    });
    // The net per share, read off the decision's own leg fills ($5.10 paid − $1.75 received).
    expect(rows[0]?.price).toBeCloseTo(3.35, 10);
    expect(rows[1]).not.toHaveProperty("spread");
  });

  it("counts the spread as one row against the page bound, never a leg left for the next page", () => {
    const page = buildWireTradeRowsPage([low, high, stray], [snapshot()], {
      limit: 2,
      spreadOf: spreadOf(),
    });
    expect(page.rows.map((r) => r.orderId)).toEqual(["mleg-1", "stray"]);
  });

  it("still finds the spread when the feed is scoped to its underlying", () => {
    const { rows } = buildWireTradeRowsPage(
      [low, high, record({ orderId: "t", symbol: "TSLA" })],
      [snapshot()],
      { limit: 10, spreadOf: spreadOf() },
      "NVDA",
    );
    expect(rows.map((r) => r.orderId)).toEqual(["mleg-1"]);
  });

  it("leaves a lone leg as the contract fill it is until every leg the spread placed is in", () => {
    const { rows } = buildWireTradeRowsPage([low, stray], [snapshot()], {
      limit: 10,
      spreadOf: spreadOf(),
    });
    expect(rows.map((r) => [r.orderId, r.symbol])).toEqual([
      ["leg-low", LOW],
      ["stray", "NVDA"],
    ]);
    expect(rows[0]).not.toHaveProperty("spread");
  });

  it("lists the legs as the separate fills they always were with no leg map", () => {
    const { rows } = buildWireTradeRowsPage([low, high, stray], [snapshot()], { limit: 10 });
    expect(rows.map((r) => r.orderId)).toEqual(["leg-high", "leg-low", "stray"]);
  });
});

describe("buildWirePnlRows", () => {
  it("sorts richest realized P&L first", () => {
    const rows = buildWirePnlRows([
      snapshot({ id: "a", displayName: "A", realizedPl: 100 }),
      snapshot({ id: "b", displayName: "B", realizedPl: 500 }),
    ]);
    expect(rows.map((r) => r.participantId)).toEqual(["b", "a"]);
  });

  it("omits a participant with no realizedPl rather than rendering a misleading $0", () => {
    const rows = buildWirePnlRows([snapshot({ id: "a", realizedPl: undefined })]);
    expect(rows).toHaveLength(0);
  });
});
