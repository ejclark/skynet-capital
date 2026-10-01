import type { ActivityEvent } from "../../src/observatory/activity-event.js";
import {
  activityEventFromAuditRecord,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import {
  collapseTradeEvents,
  mergeLedgerIntoEvents,
  tradeFillFromEvent,
} from "../../src/observatory/trade-event-feed.js";

/**
 * The read half of #1211's envelope (#784 slice 1): what a trade event says a fill did, folded one
 * row per order, and the union that keeps pre-bus history on the feed.
 *
 * The honesty bar these specs hold: a row is only rendered when the payload actually yields a
 * symbol, a side and a fill count — a half-read payload is dropped, never defaulted into a trade
 * nobody made.
 */

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

const event = (overrides: Partial<TradeActivityRecord> = {}): ActivityEvent =>
  activityEventFromTradeRecord(record(overrides));

/** An event with a deliberately malformed payload — the shape a future emitter could publish by
 *  mistake, which this decoder must drop rather than render. */
function withPayload(payload: Record<string, unknown>): ActivityEvent {
  return { ...event(), payload };
}

describe("tradeFillFromEvent", () => {
  it("decodes the envelope and payload into the facts a feed row needs", () => {
    expect(tradeFillFromEvent(event())).toEqual({
      orderId: "ord-1",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy",
      filledQuantity: 10,
      price: 120,
      at: "2026-08-19T14:30:00.000Z",
      source: "stream",
    });
  });

  it("omits price entirely when the fill carried none, never substituting a zero", () => {
    const fill = tradeFillFromEvent(event({ price: undefined }));
    expect(fill).not.toHaveProperty("price");
  });

  it("reads the order id off correlationId, so an event chained to an order still resolves it", () => {
    expect(tradeFillFromEvent(event({ orderId: "ord-chained" }))?.orderId).toBe("ord-chained");
  });

  it("keeps a partially filled order — progress is a trade, just not a finished one", () => {
    const fill = tradeFillFromEvent(event({ status: "partially_filled", filledQuantity: 4 }));
    expect(fill?.filledQuantity).toBe(4);
  });

  it("drops an order.submitted line: it carries no fill and was never on the public feed", () => {
    const submitted = activityEventFromAuditRecord({
      orderId: "ord-1",
      participantId: "sauron",
      at: "2026-08-19T14:29:00.000Z",
      symbol: "NVDA",
      side: "buy",
    });
    expect(tradeFillFromEvent(submitted)).toBeNull();
  });

  it("drops a non-public event even when its type and payload would otherwise parse", () => {
    const ownerOnly: ActivityEvent = { ...event(), visibility: "owner-only" };
    expect(tradeFillFromEvent(ownerOnly)).toBeNull();
  });

  it("drops an unrecognised event type rather than guessing it is a trade", () => {
    const feedbackish: ActivityEvent = { ...event(), eventType: "feedback.filed" };
    expect(tradeFillFromEvent(feedbackish)).toBeNull();
  });

  describe("a payload that cannot honestly yield a row", () => {
    it("drops a missing or empty symbol", () => {
      expect(tradeFillFromEvent(withPayload({ side: "buy", filledQuantity: 1 }))).toBeNull();
      expect(
        tradeFillFromEvent(withPayload({ symbol: "", side: "buy", filledQuantity: 1 })),
      ).toBeNull();
    });

    it("drops a side that isn't buy or sell", () => {
      expect(
        tradeFillFromEvent(withPayload({ symbol: "NVDA", side: "short", filledQuantity: 1 })),
      ).toBeNull();
    });

    it("drops a fill count that isn't a finite number", () => {
      expect(tradeFillFromEvent(withPayload({ symbol: "NVDA", side: "buy" }))).toBeNull();
      expect(
        tradeFillFromEvent(withPayload({ symbol: "NVDA", side: "buy", filledQuantity: "10" })),
      ).toBeNull();
      expect(
        tradeFillFromEvent(
          withPayload({ symbol: "NVDA", side: "buy", filledQuantity: Number.NaN }),
        ),
      ).toBeNull();
    });

    it("keeps the row but omits a non-numeric price — the fill is still real", () => {
      const fill = tradeFillFromEvent(
        withPayload({ symbol: "NVDA", side: "buy", filledQuantity: 10, price: "120" }),
      );
      expect(fill?.filledQuantity).toBe(10);
      expect(fill).not.toHaveProperty("price");
    });
  });
});

describe("collapseTradeEvents", () => {
  it("folds one order's progression to its most advanced fill", () => {
    const fills = collapseTradeEvents([
      event({ status: "new", filledQuantity: 0, at: "2026-08-19T14:00:00.000Z" }),
      event({ status: "partially_filled", filledQuantity: 4, at: "2026-08-19T14:10:00.000Z" }),
      event({ status: "filled", filledQuantity: 10, at: "2026-08-19T14:20:00.000Z" }),
    ]);
    expect(fills).toHaveLength(1);
    expect(fills[0]?.filledQuantity).toBe(10);
  });

  it("never lets a later backfill line regress a fuller live-captured fill", () => {
    const fills = collapseTradeEvents([
      event({ filledQuantity: 10, at: "2026-08-19T14:20:00.000Z", source: "stream" }),
      event({ filledQuantity: 4, at: "2026-08-19T18:00:00.000Z", source: "backfill" }),
    ]);
    expect(fills[0]?.filledQuantity).toBe(10);
    expect(fills[0]?.source).toBe("stream");
  });

  it("returns newest first, one row per order", () => {
    const fills = collapseTradeEvents([
      event({ orderId: "a", at: "2026-08-19T00:00:00.000Z" }),
      event({ orderId: "b", at: "2026-08-21T00:00:00.000Z" }),
      event({ orderId: "c", at: "2026-08-20T00:00:00.000Z" }),
    ]);
    expect(fills.map((f) => f.orderId)).toEqual(["b", "c", "a"]);
  });

  it("ignores everything on the bus that isn't a public trade fill, so it can be handed all of it", () => {
    const submitted = activityEventFromAuditRecord({
      orderId: "ord-1",
      participantId: "sauron",
      at: "2026-08-19T14:29:00.000Z",
    });
    expect(collapseTradeEvents([submitted, event()])).toHaveLength(1);
  });
});

describe("mergeLedgerIntoEvents", () => {
  it("adds a ledger fill the bus never saw — pre-bus history stays on the feed", () => {
    const older = record({ orderId: "pre-bus", at: "2026-07-01T00:00:00.000Z" });
    const merged = mergeLedgerIntoEvents([event()], [older]);
    expect(collapseTradeEvents(merged).map((f) => f.orderId)).toEqual(["ord-1", "pre-bus"]);
  });

  it("never double-counts a record the bus already published — the event id is deterministic", () => {
    const published = record();
    const merged = mergeLedgerIntoEvents([activityEventFromTradeRecord(published)], [published]);
    expect(merged).toHaveLength(1);
    expect(collapseTradeEvents(merged)).toHaveLength(1);
  });

  it("deduplicates a ledger line repeated within the ledger itself", () => {
    const line = record();
    expect(mergeLedgerIntoEvents([], [line, line])).toHaveLength(1);
  });

  it("appends the ledger after the bus, so the fold's tie-break resolves as it did ledger-only", () => {
    const merged = mergeLedgerIntoEvents([event({ orderId: "bus" })], [record({ orderId: "led" })]);
    expect(merged.map((e) => e.correlationId)).toEqual(["bus", "led"]);
  });

  it("is the identity on an empty ledger, and the full translation on an empty bus", () => {
    expect(mergeLedgerIntoEvents([event()], [])).toHaveLength(1);
    expect(mergeLedgerIntoEvents([], [record(), record({ orderId: "ord-2" })])).toHaveLength(2);
  });
});
