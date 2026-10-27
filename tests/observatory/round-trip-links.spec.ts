import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import { deskLedger, realizedByOrder, roundTripLinks } from "../../src/observatory/desk-data.js";
import { deskActivityView } from "../../src/observatory/desk-json-view.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * #5317 — the Ledger shows a sale with the buy it closed. The round-trip matcher already pairs
 * them; these specs hold the join that hands the pairing to the activity rows: a close names the
 * orders it closed (even on an older page), and a buy with nothing left open says when it closed.
 */

const record = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "ord",
  participantId: "sauron",
  symbol: "META",
  side: "buy",
  quantity: 15,
  filledQuantity: 15,
  status: "filled",
  at: "2026-09-22T14:00:00Z",
  source: "stream",
  ...over,
});

const snapshot = { id: "sauron", kind: "bot", activity: [] } as unknown as ParticipantSnapshot;

/** The activity rows the route serves, the pairing joined in. */
function rows(records: readonly TradeActivityRecord[], limit?: number) {
  const ledger = deskLedger(snapshot, records);
  return deskActivityView(records, undefined, {
    realizedByOrder: realizedByOrder(ledger),
    roundTrips: roundTripLinks(ledger),
    ...(limit ? { limit } : {}),
  }).activity;
}

const buy = record({ orderId: "buy-1", price: 742 });
const sale = record({ orderId: "sell-1", side: "sell", price: 761, at: "2026-10-01T19:30:00Z" });

describe("roundTripLinks — the matcher's pairing, by order id", () => {
  it("names the order a close closed, and the day the buy closed", () => {
    const links = roundTripLinks(deskLedger(snapshot, [buy, sale]));
    expect(links.closes.get("sell-1")?.map((t) => t.entryOrderId)).toEqual(["buy-1"]);
    expect(links.closedOn.get("buy-1")).toBe("2026-10-01T19:30:00Z");
  });

  it("keeps a buy partly sold out of closedOn — it is still open", () => {
    const part = record({ ...sale, quantity: 10, filledQuantity: 10 });
    const links = roundTripLinks(deskLedger(snapshot, [buy, part]));
    expect(links.closes.get("sell-1")).toHaveLength(1);
    expect(links.closedOn.has("buy-1")).toBe(false);
  });

  it("lists the lots a sale closed newest first, and dates the buy by its last close", () => {
    const early = record({ orderId: "buy-0", quantity: 5, filledQuantity: 5, price: 700 });
    const later = record({ orderId: "buy-1", price: 742, at: "2026-09-24T14:00:00Z" });
    const first = record({ ...sale, orderId: "sell-0", quantity: 10, filledQuantity: 10 });
    const last = record({ ...sale, quantity: 10, filledQuantity: 10, at: "2026-10-02T15:00:00Z" });
    const links = roundTripLinks(deskLedger(snapshot, [early, later, first, last]));
    expect(links.closes.get("sell-0")?.map((t) => t.entryOrderId)).toEqual(["buy-1", "buy-0"]);
    expect(links.closedOn.get("buy-1")).toBe("2026-10-02T15:00:00Z");
    expect(links.closedOn.get("buy-0")).toBe("2026-10-01T19:30:00Z");
  });
});

describe("deskActivityView — a close carries the orders it closed", () => {
  it("gives the sale its buy as an opened leg, the buy's own line and the part matched", () => {
    const [sold, bought] = rows([buy, sale]);
    expect(sold?.opened).toEqual([
      expect.objectContaining({ orderId: "buy-1", side: "buy", price: "$742.00", matched: 15 }),
    ]);
    expect(sold?.realizedPl).toBe("+$285");
    expect(bought?.closedOn).toBe("2026-10-01T19:30:00Z");
    expect(bought?.opened).toBeUndefined();
  });

  it("still pairs the sale when its buy is on an older page", () => {
    const page = rows([buy, sale], 1);
    expect(page.map((row) => row.orderId)).toEqual(["sell-1"]);
    expect(page[0]?.opened?.[0]?.orderId).toBe("buy-1");
  });

  it("leaves an order with no close neither opened nor closed", () => {
    const [only] = rows([buy]);
    expect(only?.opened).toBeUndefined();
    expect(only?.closedOn).toBeUndefined();
  });

  it("adds nothing without the matcher's pairing — the old payload, unchanged", () => {
    const [sold] = deskActivityView([buy, sale]).activity;
    expect(sold?.opened).toBeUndefined();
  });
});
