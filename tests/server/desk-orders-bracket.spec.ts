import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import { deskOrderRow } from "../../src/server/desk-orders-view.js";

// #8249: a bracket's pieces are working rows a member can cancel, but not Modify in this slice —
// they are linked (one exit filling cancels the other). A simple limit keeps its Modify.

const order = (over: Partial<AlpacaOrder>): AlpacaOrder =>
  ({
    id: "o1",
    symbol: "XLE",
    qty: "3",
    side: "sell",
    type: "limit",
    status: "new",
    limit_price: "95",
    time_in_force: "gtc",
    submitted_at: "2026-11-16T15:00:00Z",
    ...over,
  }) as AlpacaOrder;

describe("deskOrderRow — a bracket's exits (#8249)", () => {
  it("lists a working exit as cancelable but not replaceable", () => {
    expect(deskOrderRow(order({ order_class: "bracket" }))).toMatchObject({
      state: "working",
      cancelable: true,
      replaceable: false,
      limitPrice: 95,
    });
    expect(
      deskOrderRow(order({ order_class: "bracket", type: "stop", stop_price: "85" })),
    ).toMatchObject({
      replaceable: false,
      stopPrice: 85,
    });
  });

  it("keeps Modify on a simple working limit, as before", () => {
    expect(deskOrderRow(order({ order_class: "simple" }))?.replaceable).toBe(true);
    expect(deskOrderRow(order({}))?.replaceable).toBe(true);
  });
});
