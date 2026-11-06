import { activityEventFromAuditRecord } from "../../../src/observatory/activity-event";
import { deskOrderEvent } from "../../../src/server/desk-events-route";
import { marketSession } from "../../src/live/market-session";
import {
  followRow,
  orderWords,
  readReceipt,
  receiptHeadline,
  receiptNote,
  type SentOrder,
} from "../../src/live/order-receipt";
import type { DeskOrderRow, DeskOrders } from "../../src/live/orders";

/**
 * The receipt a sent ticket becomes (Eric, 2026-11-06): where the order stands, in words, from the
 * furthest-along of the broker's list, the stream's frame and the submit's echo — and the honesty
 * rules the done line it replaced earned (#6257, #6330, #6529) still hold.
 */

const order: SentOrder = {
  orderId: "o-1",
  status: "accepted",
  symbol: "NVDA",
  side: "buy",
  quantity: 5,
  unit: "shares",
  orderType: "limit",
  limitPrice: 181.3,
  timeInForce: "gtc",
};
const put: SentOrder = {
  orderId: "2ebcf855-387c-4d9f-9017-9d71571de193",
  status: "pending_new",
  symbol: "CRWV270115P00062500",
  side: "sell",
  quantity: 20,
  unit: "contracts",
  orderType: "limit",
  limitPrice: 20,
  timeInForce: "day",
};
const frame = (over: Record<string, unknown> = {}) => ({
  id: "e1",
  eventType: "order.filled",
  orderId: "o-1",
  at: "t",
  outcome: "success" as const,
  payload: {
    symbol: "NVDA",
    side: "buy",
    quantity: 5,
    filledQuantity: 5,
    price: 181.32,
    status: "filled",
  },
  ...over,
});
const row = (over: Partial<DeskOrderRow> = {}): DeskOrderRow => ({
  id: "o-1",
  symbol: "NVDA",
  side: "buy",
  orderType: "limit",
  quantity: 5,
  filledQuantity: 0,
  limitPrice: 181.3,
  timeInForce: "gtc",
  state: "working",
  cancelable: true,
  replaceable: true,
  ...over,
});
const headline = (
  o: SentOrder,
  r: DeskOrderRow | undefined,
  f: Parameters<typeof readReceipt>[2],
) => receiptHeadline(readReceipt(o, r, f), o.quantity, o.unit);

describe("the order in words — never a UUID, a raw status or a raw contract symbol", () => {
  it("names the contract as a person reads it, then side · size · price · TIF", () => {
    expect(orderWords(put)).toEqual({
      instrument: "CRWV $62.50 PUT · 15 JAN 27",
      terms: "Sell to open · 20 contracts · Limit $20.00 · Day",
    });
    expect(headline(put, undefined, undefined)).toBe("Order placed — not filled yet");
  });

  it("reads a share order plainly, and a stop-limit names both prices", () => {
    expect(orderWords(order).terms).toBe("Buy · 5 shares · Limit $181.30 · GTC");
    const stop = { ...order, orderType: "stop", stopPrice: 180, limitPrice: undefined };
    expect(orderWords(stop).terms).toBe("Buy · 5 shares · Stop-Market $180.00 · GTC");
    const stopLimit = { ...order, orderType: "stop_limit", stopPrice: 180, limitPrice: 179.5 };
    expect(orderWords(stopLimit).terms).toContain("· stop $180.00 · limit $179.50 · GTC");
  });

  it("states the terms the broker holds once a modify changed them", () => {
    expect(orderWords(order, row({ quantity: 3, limitPrice: 179 })).terms).toBe(
      "Buy · 3 shares · Limit $179.00 · GTC",
    );
  });
});

describe("where the order stands", () => {
  it("is placed and not filled until a source says otherwise", () => {
    expect(headline(order, undefined, undefined)).toBe("Order placed — not filled yet");
    expect(headline(order, row(), undefined)).toBe("Order placed — not filled yet");
  });

  it("reads the fill in the frame's own numbers", () => {
    expect(headline(order, undefined, frame())).toBe("Filled — 5 shares @ $181.32");
  });

  it("reads the broker list's fill when no stream is wired", () => {
    const filled = row({ state: "filled", filledQuantity: 5, avgFillPrice: 181.2 });
    expect(headline(order, filled, undefined)).toBe("Filled — 5 shares @ $181.20");
  });

  it("names a partial fill as one, and skips a price the feed didn't report", () => {
    const partial = frame({
      eventType: "order.updated",
      payload: { symbol: "NVDA", filledQuantity: 2, status: "partially_filled" },
    });
    expect(headline(order, undefined, partial)).toBe("Partly filled — 2 of 5 shares filled");
  });

  it("never lets a stale list read un-fill what the stream already reported", () => {
    expect(headline(order, row(), frame())).toBe("Filled — 5 shares @ $181.32");
  });

  it("ignores another order's frame", () => {
    expect(headline(order, undefined, frame({ orderId: "o-2" }))).toBe(
      "Order placed — not filled yet",
    );
  });

  it("follows a modify's new id to the order now", () => {
    const orders: DeskOrders = {
      available: true,
      asOf: "t",
      working: [row({ id: "o-9", replaces: "o-1", limitPrice: 179 })],
      recent: [row({ state: "replaced", replacedBy: "o-9", cancelable: false })],
    };
    expect(followRow(orders, "o-1")?.id).toBe("o-9");
    // The successor not listed yet: the replaced row stands, and says a change is in flight.
    const lagging: DeskOrders = { ...orders, working: [] };
    const replaced = followRow(lagging, "o-1");
    expect(replaced?.state).toBe("replaced");
    expect(headline(order, replaced, undefined)).toBe(
      "Change sent — the broker is replacing the order",
    );
    expect(
      followRow({ available: false, reason: "unlinked", working: [], recent: [] }, "o-1"),
    ).toBe(undefined);
  });
});

// #6257: the done note said "simulated fill" before any fill existed.
describe("the note", () => {
  const open = marketSession(new Date("2026-10-27T15:00:00Z")); // Tue 11:00 ET
  const closed = marketSession(new Date("2026-10-27T00:00:00Z")); // Mon 8:00 p.m. ET
  const note = (fill: ReturnType<typeof frame> | undefined, market = open, r?: DeskOrderRow) =>
    receiptNote(readReceipt(order, r, fill), market);

  it("says queued, with the open it waits for, while the market is closed and nothing filled", () => {
    expect(note(undefined, closed)).toBe("Queued — nothing fills before the Tue 9:30 ET open.");
  });

  it("never says 'simulated fill' in session before a source carries a fill", () => {
    expect(note(undefined)).toMatch(/^Working at the paper broker/);
    expect(note(undefined)).not.toContain("simulated fill");
  });

  it("earns 'simulated fill' only from a frame or a list row that carries one", () => {
    expect(note(frame())).toBe("SIM account — simulated fill, real discipline.");
    const partial = frame({
      eventType: "order.updated",
      payload: { status: "partially_filled", filledQuantity: 2 },
    });
    expect(note(partial)).toContain("simulated fill");
    expect(note(partial)).toContain("The rest is still working.");
    expect(note(undefined, open, row({ state: "filled", filledQuantity: 5 }))).toContain(
      "simulated fill",
    );
    const cancelled = frame({
      eventType: "order.canceled",
      payload: { status: "canceled", filledQuantity: 0 },
    });
    expect(note(cancelled)).not.toContain("simulated fill");
  });

  // #6330: a terminal non-fill frame said "Queued" under a "canceled" headline.
  it("names a terminal status instead of 'queued', agreeing with the headline", () => {
    for (const [status, word] of [
      ["canceled", "Cancelled"],
      ["rejected", "Rejected"],
      ["expired", "Expired"],
    ] as const) {
      const terminal = frame({
        eventType: "order.updated",
        payload: { status, filledQuantity: 0 },
      });
      expect(note(terminal, closed)).toBe(`${word} at the paper broker — nothing filled.`);
      expect(headline(order, undefined, terminal)).toContain(word);
      expect(headline(order, undefined, terminal)).toContain("nothing filled");
    }
    const british = frame({ eventType: "order.updated", payload: { status: "cancelled" } });
    expect(note(british)).toBe("Cancelled at the paper broker — nothing filled.");
  });

  it("keeps what filled when a part-filled order ends", () => {
    const ended = row({ state: "cancelled", filledQuantity: 2, cancelable: false });
    expect(headline(order, ended, undefined)).toBe("Cancelled — 2 of 5 shares filled first");
    expect(note(undefined, open, ended)).toBe(
      "Cancelled at the paper broker — what filled stays filled.",
    );
  });
});

// #6529: a member's cancel reaches the ticket as the app's own audit frame — no status, no
// symbol — and a status-less frame read "filled" under a "Queued" note.
describe("a status-less frame never reads as filled", () => {
  const open = marketSession(new Date("2026-10-27T15:00:00Z"));
  const audit = (intent: "open" | "cancel") =>
    deskOrderEvent(
      activityEventFromAuditRecord({
        participantId: "p-1",
        orderId: "o-1",
        at: "2026-10-27T15:01:00Z",
        intent,
        ...(intent === "open" ? { symbol: "NVDA", side: "buy" as const } : {}),
      }),
    );

  it("reads the server's cancel frame as a cancel request, headline and note agreeing", () => {
    const read = readReceipt(order, row(), audit("cancel"));
    expect(receiptHeadline(read, 5, "shares")).toBe("Cancel requested — waiting for the broker");
    const note = receiptNote(read, open);
    expect(note).toMatch(/^Cancel requested/);
    expect(note).not.toMatch(/Queued|simulated fill/);
  });

  it("lets the broker's confirmed cancel outrank the request", () => {
    const read = readReceipt(order, row({ state: "cancelled" }), audit("cancel"));
    expect(receiptHeadline(read, 5, "shares")).toBe("Cancelled — nothing filled");
  });

  it("earns nothing from the submission's own audit frame", () => {
    expect(headline(order, undefined, audit("open"))).toBe("Order placed — not filled yet");
  });

  it("still reads a real fill as filled", () => {
    expect(headline(order, undefined, frame({ payload: { filledQuantity: 5 } }))).toBe(
      "Filled — 5 shares",
    );
  });
});
