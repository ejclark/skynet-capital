import { settledOptionResult } from "../../src/adapters/alpaca-option-result.js";
import { anOptionIntent } from "../support/builders.js";
import { anOrder } from "../support/fake-option-broker.js";

/** A settled spread keeps each leg's own broker order id (#4650): the account reports a spread's
 *  fills one per leg, under the leg's id, so the decision store needs that id to join them back. */

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

const filledLeg = (id: string, symbol: string, side: "buy" | "sell", price: string) =>
  anOrder({ id, symbol, side, status: "filled", filled_qty: "1", filled_avg_price: price });

describe("settledOptionResult — a spread's leg order ids", () => {
  it("carries each filled leg's own order id beside its fill", () => {
    const parent = anOrder({
      id: "mleg-1",
      symbol: "",
      order_class: "mleg",
      status: "filled",
      filled_qty: "1",
      filled_avg_price: "3.35",
      legs: [filledLeg("leg-low", LOW, "buy", "5.10"), filledLeg("leg-high", HIGH, "sell", "1.75")],
    });
    expect(settledOptionResult(spread, parent, 15_000)).toMatchObject({
      status: "filled",
      orderId: "mleg-1",
      legFills: [
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "leg-low" },
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75, orderId: "leg-high" },
      ],
    });
  });

  it("names no leg id on a one-leg order, or where the broker echoed the parent's own id", () => {
    const put = settledOptionResult(
      anOptionIntent(),
      anOrder({ id: "put-1", status: "filled", filled_qty: "1", filled_avg_price: "2.10" }),
      15_000,
    );
    expect(put.legFills?.[0]).not.toHaveProperty("orderId");

    const echoed = settledOptionResult(
      spread,
      anOrder({
        id: "mleg-1",
        symbol: "",
        status: "filled",
        filled_qty: "1",
        legs: [filledLeg("mleg-1", LOW, "buy", "5.10")],
      }),
      15_000,
    );
    expect(echoed.legFills?.[0]).not.toHaveProperty("orderId");
  });
});
