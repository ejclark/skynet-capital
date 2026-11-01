import { activityEventFromAuditRecord } from "../../../src/observatory/activity-event";
import { deskOrderEvent } from "../../../src/server/desk-events-route";
import { doneNote, fillHeadline } from "../../src/live/fill-headline";
import { marketSession } from "../../src/live/market-session";

/**
 * The ticket's done headline (#3407 P4 slice 2): the broker's echo until the desk's own stream
 * carries a fill for THIS order, then the fill in the frame's numbers; another order's frame
 * changes nothing.
 */

const order = { orderId: "o-1", status: "accepted", symbol: "NVDA", timeInForce: "gtc" };
const frame = (over: Partial<Parameters<typeof fillHeadline>[1] & object> = {}) => ({
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

describe("fillHeadline", () => {
  it("reads the broker's echo with the TIF until a fill arrives", () => {
    expect(fillHeadline(order, undefined)).toBe("Order o-1 accepted — NVDA · GTC");
  });

  it("reads the fill in the frame's own numbers", () => {
    expect(fillHeadline(order, frame())).toBe("Order o-1 filled — 5 NVDA @ $181.32");
  });

  it("names a partial fill by the payload's status and skips a price the feed didn't report", () => {
    const partial = frame({
      eventType: "order.updated",
      payload: { symbol: "NVDA", filledQuantity: 2, status: "partially_filled" },
    });
    expect(fillHeadline(order, partial)).toBe("Order o-1 partially filled — 2 NVDA");
  });

  it("ignores another order's frame", () => {
    expect(fillHeadline(order, frame({ orderId: "o-2" }))).toBe("Order o-1 accepted — NVDA · GTC");
  });
});

// #6257: the done note said "simulated fill" before any fill existed.
describe("doneNote", () => {
  const open = marketSession(new Date("2026-10-27T15:00:00Z")); // Tue 11:00 ET
  const closed = marketSession(new Date("2026-10-27T00:00:00Z")); // Mon 8:00 p.m. ET

  it("says queued, with the open it waits for, while the market is closed and nothing filled", () => {
    expect(doneNote(undefined, closed)).toBe("Queued — nothing fills before the Tue 9:30 ET open.");
  });

  it("says queued, never 'simulated fill', in session before the stream carries a fill", () => {
    const note = doneNote(undefined, open);
    expect(note).toMatch(/^Queued/);
    expect(note).not.toContain("simulated fill");
  });

  it("earns 'simulated fill' only from a frame that carries one", () => {
    expect(doneNote(frame(), open)).toBe("SIM account — simulated fill, real discipline.");
    const partial = frame({
      eventType: "order.updated",
      payload: { status: "partially_filled", filledQuantity: 2 },
    });
    expect(doneNote(partial, open)).toContain("simulated fill");
    const cancelled = frame({
      eventType: "order.canceled",
      payload: { status: "canceled", filledQuantity: 0 },
    });
    expect(doneNote(cancelled, open)).not.toContain("simulated fill");
  });

  // #6330: a terminal non-fill frame said "Queued" under a "canceled" headline.
  it("names a terminal non-fill status instead of 'queued', agreeing with the headline", () => {
    for (const status of ["canceled", "rejected", "expired"]) {
      const terminal = frame({
        eventType: "order.updated",
        payload: { status, filledQuantity: 0 },
      });
      const note = doneNote(terminal, closed);
      expect(note).not.toMatch(/Queued/);
      expect(note.toLowerCase()).toContain(status);
      expect(fillHeadline(order, terminal)).toContain(status);
    }
    const british = frame({ eventType: "order.updated", payload: { status: "cancelled" } });
    expect(doneNote(british, open)).toBe("Canceled at the paper broker — nothing filled.");
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
    const cancel = audit("cancel");
    const headline = fillHeadline(order, cancel);
    const note = doneNote(cancel, open);
    expect(headline).toBe("Order o-1 cancel requested — NVDA");
    expect(headline).not.toContain("filled");
    expect(note).toMatch(/^Cancel requested/);
    expect(note).not.toMatch(/Queued|simulated fill/);
  });

  it("keeps the broker's echo for the submission's own audit frame", () => {
    const submitted = audit("open");
    expect(fillHeadline(order, submitted)).toBe("Order o-1 accepted — NVDA · GTC");
    expect(doneNote(submitted, open)).toMatch(/^Queued/);
  });

  it("still reads a real fill as filled", () => {
    expect(fillHeadline(order, frame({ payload: { filledQuantity: 5 } }))).toBe(
      "Order o-1 filled — 5 NVDA",
    );
  });
});
