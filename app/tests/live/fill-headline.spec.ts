import { fillHeadline } from "../../src/live/fill-headline";

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
