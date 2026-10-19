import {
  activitiesFromMessage,
  activityFromMessage,
  fillEventFromMessage,
} from "../../src/alpaca/trade-updates-stream-events.js";

describe("fillEventFromMessage", () => {
  it("maps a fill to a fill event tagged with the participant", () => {
    const event = fillEventFromMessage(
      {
        stream: "trade_updates",
        data: {
          event: "fill",
          price: "142.50",
          qty: "100",
          timestamp: "2026-07-24T13:30:01Z",
          order: { symbol: "NVDA", side: "buy", filled_qty: "100", filled_avg_price: "142.50" },
        },
      },
      "day-trader",
    );

    expect(event).toEqual({
      type: "fill",
      participantId: "day-trader",
      symbol: "NVDA",
      side: "buy",
      quantity: 100,
      price: 142.5,
      at: "2026-07-24T13:30:01Z",
    });
  });

  it("handles a partial fill", () => {
    const event = fillEventFromMessage(
      {
        stream: "trade_updates",
        data: { event: "partial_fill", price: 50, qty: 40, order: { symbol: "EEM", side: "sell" } },
      },
      "rumor-trader",
    );
    expect(event?.type).toBe("fill");
    if (event?.type === "fill") {
      expect(event.quantity).toBe(40);
      expect(event.side).toBe("sell");
    }
  });

  it("ignores non-fill lifecycle events", () => {
    expect(
      fillEventFromMessage(
        { stream: "trade_updates", data: { event: "new", order: { symbol: "NVDA", side: "buy" } } },
        "day-trader",
      ),
    ).toBeNull();
  });

  it("ignores non-trade_updates streams", () => {
    expect(fillEventFromMessage({ stream: "authorization", data: {} }, "day-trader")).toBeNull();
  });
});

describe("activityFromMessage", () => {
  const fill = {
    stream: "trade_updates",
    data: {
      event: "fill",
      price: "142.50",
      qty: "100",
      timestamp: "2026-07-24T13:30:01Z",
      order: {
        id: "ord-abc",
        symbol: "NVDA",
        side: "buy" as const,
        qty: "100",
        status: "filled",
        filled_qty: "100",
        filled_avg_price: "142.50",
      },
    },
  };

  it("journals a fill as a stream-sourced ledger line", () => {
    expect(activityFromMessage(fill, "sauron")).toEqual({
      orderId: "ord-abc",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy",
      quantity: 100,
      filledQuantity: 100,
      price: 142.5,
      status: "filled",
      at: "2026-07-24T13:30:01Z",
      source: "stream",
    });
  });

  it("journals lifecycle events too — a canceled order is part of the record", () => {
    const record = activityFromMessage(
      {
        stream: "trade_updates",
        data: {
          event: "canceled",
          timestamp: "2026-07-24T14:00:00Z",
          order: { id: "ord-x", symbol: "AAPL", side: "sell", qty: "5", status: "canceled" },
        },
      },
      "sauron",
    );
    expect(record).toMatchObject({ orderId: "ord-x", status: "canceled", filledQuantity: 0 });
    expect(record?.price).toBeUndefined();
  });

  it("refuses a message with no identifiable order", () => {
    const data = fill.data;
    expect(
      activityFromMessage(
        { stream: "trade_updates", data: { ...data, order: { ...data.order, id: undefined } } },
        "sauron",
      ),
    ).toBeNull();
    expect(activityFromMessage({ stream: "authorization", data: {} }, "sauron")).toBeNull();
  });
});

describe("activitiesFromMessage", () => {
  // The broker's own example of a spread fill: one update, a parent with no symbol, two legs.
  const spreadFill = {
    stream: "trade_updates",
    data: {
      event: "fill",
      timestamp: "2026-10-05T14:02:00.000Z",
      price: "1.62",
      qty: "1",
      order: {
        id: "parent-1",
        symbol: "",
        side: "buy",
        qty: "1",
        status: "filled",
        filled_qty: "1",
        filled_avg_price: "1.62",
        order_class: "mleg",
        legs: [
          {
            id: "leg-put",
            symbol: "AAPL250321P00200000",
            side: "buy",
            qty: "1",
            status: "filled",
            filled_qty: "1",
            filled_avg_price: "1.6",
          },
          {
            id: "leg-call",
            symbol: "AAPL250321C00380000",
            side: "sell",
            qty: "1",
            status: "filled",
            filled_qty: "1",
            filled_avg_price: "0.02",
          },
        ],
      },
    },
  };

  it("journals a spread as one line per leg, each tagged with its parent", () => {
    const lines = activitiesFromMessage(spreadFill, "sauron");
    expect(lines).toEqual([
      expect.objectContaining({
        orderId: "leg-put",
        symbol: "AAPL250321P00200000",
        side: "buy",
        filledQuantity: 1,
        price: 1.6,
        parentOrderId: "parent-1",
        at: "2026-10-05T14:02:00.000Z",
        source: "stream",
      }),
      expect.objectContaining({
        orderId: "leg-call",
        side: "sell",
        price: 0.02,
        parentOrderId: "parent-1",
      }),
    ]);
    // The single-line mapper still drops the symbol-less parent — no line names no contract.
    expect(activityFromMessage(spreadFill, "sauron")).toBeNull();
  });

  it("passes a plain order through as its one line, untagged", () => {
    const plain = {
      stream: "trade_updates",
      data: {
        event: "fill",
        timestamp: "2026-10-05T14:02:00.000Z",
        order: {
          id: "o-1",
          symbol: "SPY",
          side: "buy",
          qty: "10",
          status: "filled",
          filled_qty: "10",
          filled_avg_price: "500",
        },
      },
    };
    const lines = activitiesFromMessage(plain, "sauron");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ orderId: "o-1", symbol: "SPY", price: 500 });
    expect(lines[0]?.parentOrderId).toBeUndefined();
  });
});
