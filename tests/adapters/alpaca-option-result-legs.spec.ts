import { settledOptionResult } from "../../src/adapters/alpaca-option-result.js";
import { anOptionIntent } from "../support/builders.js";
import { anOrder } from "../support/fake-option-broker.js";

/** A settled spread keeps each leg's own broker order id (#4650): the account reports a spread's
 *  fills one per leg, under the leg's id, so the decision store needs that id to join them back —
 *  whatever the order became, because a working order can still fill after its result is written. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});

const leg = (id: string, symbol: string, side: "buy" | "sell", over = {}) =>
  anOrder({ id, symbol, side, ...over });
const filledLeg = (id: string, symbol: string, side: "buy" | "sell", price: string) =>
  leg(id, symbol, side, { status: "filled", filled_qty: "1", filled_avg_price: price });

const LEG_ORDERS = [
  { occSymbol: LOW, orderId: "leg-low" },
  { occSymbol: HIGH, orderId: "leg-high" },
];

describe("settledOptionResult — a spread's leg order ids", () => {
  it("names each leg's own order id beside the fills of a filled spread", () => {
    const parent = anOrder({
      id: "mleg-1",
      symbol: "",
      order_class: "mleg",
      status: "filled",
      filled_qty: "1",
      filled_avg_price: "3.35",
      // The broker's own leg order, which need not be the decision's.
      legs: [filledLeg("leg-high", HIGH, "sell", "1.75"), filledLeg("leg-low", LOW, "buy", "5.10")],
    });
    expect(settledOptionResult(spread, parent, 15_000)).toMatchObject({
      status: "filled",
      orderId: "mleg-1",
      legOrders: LEG_ORDERS,
    });
  });

  it("names them on a spread still working, and one that ended unfilled — with no fill invented", () => {
    const legs = [leg("leg-low", LOW, "buy"), leg("leg-high", HIGH, "sell")];
    const working = settledOptionResult(
      spread,
      anOrder({ id: "mleg-1", symbol: "", status: "partially_filled", filled_qty: "1", legs }),
      15_000,
    );
    expect(working).toMatchObject({ status: "working", orderId: "mleg-1", legOrders: LEG_ORDERS });
    expect(working).not.toHaveProperty("legFills");

    const unfilled = settledOptionResult(
      spread,
      anOrder({ id: "mleg-1", symbol: "", status: "canceled", legs }),
      15_000,
    );
    expect(unfilled).toMatchObject({ status: "unfilled", legOrders: LEG_ORDERS });
    expect(unfilled).not.toHaveProperty("legFills");
  });

  it("names none on a one-leg order, a contract the decision never placed, or the parent's own id", () => {
    const put = settledOptionResult(
      anOptionIntent(),
      anOrder({ id: "put-1", status: "filled", filled_qty: "1", filled_avg_price: "2.10" }),
      15_000,
    );
    expect(put).not.toHaveProperty("legOrders");

    const odd = settledOptionResult(
      spread,
      anOrder({
        id: "mleg-1",
        symbol: "",
        status: "new",
        legs: [leg("mleg-1", LOW, "buy"), leg("stray", "NVDA261113C00210000", "sell")],
      }),
      15_000,
    );
    expect(odd).not.toHaveProperty("legOrders");
  });
});
