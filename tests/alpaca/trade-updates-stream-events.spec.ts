import {
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
