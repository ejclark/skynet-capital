import {
  estimateOrder,
  liveWarnings,
  renderOrderEstimate,
} from "../../src/observatory/order-estimate.js";
import { previewOrder, type TicketContext } from "../../src/trading/order-ticket.js";

/**
 * The review screen's headline number. Every case here is stated as a member would experience
 * it — "buy 100 MSFT with no MSFT in the account" — because the whole point of the feature is
 * that the screen stops saying "unknown" at exactly the moment a first-time buyer needs it most.
 */

const CASH = 748_645;

const context = (over: Partial<TicketContext> = {}): TicketContext => ({
  cash: CASH,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200 }],
  tradingEnabled: true,
  isSelf: true,
  ...over,
});

describe("order estimate — what the trade is worth before it is confirmed", () => {
  it("prices a first buy of an unheld symbol off the latest market quote", () => {
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context());
    // The money-moving layer can't price it — that's the gap this closes, not a bug in it.
    expect(preview.estNotional).toBeUndefined();

    const estimate = estimateOrder(preview, CASH, 512.5);
    expect(estimate?.basis).toBe("quote");
    expect(estimate?.notional).toBe(51_250);
    expect(estimate?.cashAfter).toBe(697_395);
  });

  it("says so honestly when no price is available anywhere", () => {
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context());
    expect(estimateOrder(preview, CASH)).toBeUndefined();

    const html = renderOrderEstimate(preview, CASH, estimateOrder(preview, CASH));
    expect(html).toContain("unknown until it fills");
    // No price means no cash-after claim — a number we can't stand behind is worse than none.
    expect(html).not.toContain("Estimated cash after order");
  });

  it("prices a limit order off the trader's own limit price, not the position mark", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 20, action: "buy", orderType: "limit", limitPrice: 110 },
      context(),
    );
    expect(preview.estPrice).toBe(120); // the mark is $120/sh...
    const estimate = estimateOrder(preview, CASH);
    expect(estimate?.basis).toBe("limit"); // ...but the order references $110
    expect(estimate?.notional).toBe(2_200);
  });

  it("prices a stop order off the trigger and says the trigger is not the fill", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 10, action: "sell", orderType: "stop", stopPrice: 90 },
      context(),
    );
    const estimate = estimateOrder(preview, CASH);
    expect(estimate?.basis).toBe("stop");
    expect(estimate?.notional).toBe(900);

    const html = renderOrderEstimate(preview, CASH, estimateOrder(preview, CASH));
    expect(html).toContain("stop trigger");
    expect(html).toContain("only starts a market order");
  });

  it("counts a sell as proceeds coming in, not cost going out", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 10, action: "sell" }, context());
    const estimate = estimateOrder(preview, CASH);
    expect(estimate?.cashAfter).toBe(CASH + 1_200);

    const html = renderOrderEstimate(preview, CASH, estimateOrder(preview, CASH));
    expect(html).toContain("Estimated proceeds");
    expect(html).not.toContain("Estimated cost");
  });

  it("puts the disclaimer directly beneath every estimated figure", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 10, action: "buy" }, context());
    const html = renderOrderEstimate(preview, CASH, estimateOrder(preview, CASH));
    expect(html).toContain("Estimated cost");
    expect(html).toContain("≈ $1,200");
    expect(html).toContain("Estimated cash after order*");
    expect(html).toContain("Estimate only.");
    expect(html).toContain("may vary depending on the execution price when the order fills");
  });

  // The screen must not state a price and deny having one in the same breath. This is also the
  // drift alarm: if the ticket layer's wording changes, this goes red instead of shipping a
  // contradiction — the filter itself fails safe by leaving the warning up.
  it("retires the 'no recent price' warning once a live quote has answered it", () => {
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context());
    expect(preview.warnings.some((w) => w.startsWith("No recent price for this symbol"))).toBe(
      true,
    );

    expect(liveWarnings(preview, estimateOrder(preview, CASH, 512.5))).toEqual([]);
    // ...but with no quote the warning is still true, so it stays.
    expect(liveWarnings(preview, estimateOrder(preview, CASH))).toEqual(preview.warnings);
  });

  it("keeps the warning for a limit order on an unheld symbol — a limit is not a market price", () => {
    const preview = previewOrder(
      { symbol: "MSFT", quantity: 100, action: "buy", orderType: "limit", limitPrice: 500 },
      context(),
    );
    const estimate = estimateOrder(preview, CASH);
    expect(estimate?.basis).toBe("limit");
    expect(liveWarnings(preview, estimate)).toEqual(preview.warnings);
  });

  // The ticket layer only refuses "costs more than your cash" when it had a mark to price from,
  // so an unheld-symbol buy can reach the screen confirmable and unaffordable. A negative
  // "cash after" must never render in silence — the screen doesn't block it (that's the
  // money-moving layer's call) but it says what it is.
  it("warns when the estimate drains the account past zero", () => {
    const preview = previewOrder({ symbol: "MSFT", quantity: 10_000, action: "buy" }, context());
    expect(preview.refusals).toEqual([]); // the ticket layer had no price to refuse on

    const estimate = estimateOrder(preview, CASH, 512.5);
    expect(estimate?.cashAfter).toBeLessThan(0);
    const warnings = liveWarnings(preview, estimate);
    expect(warnings.some((w) => w.startsWith("Estimated cost is about"))).toBe(true);
    expect(warnings.some((w) => w.includes("more than your available cash"))).toBe(true);
  });

  // 6,000 AAPL is affordable at the $120 mark the ticket layer prices off ($720,000 of $748,645),
  // so it is NOT refused — but at the $130 limit the order actually references it costs $780,000.
  // That gap between the two bases is exactly where a silent negative balance could appear.
  it("warns the same way when a limit above the mark is what overspends", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 6_000, action: "buy", orderType: "limit", limitPrice: 130 },
      context(),
    );
    expect(preview.refusals).toEqual([]);

    const warnings = liveWarnings(preview, estimateOrder(preview, CASH));
    expect(warnings.some((w) => w.includes("more than your available cash"))).toBe(true);
  });

  it("stays quiet about overspending on an order that is already refused", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 99, action: "sell" }, context());
    expect(preview.ok).toBe(false);
    expect(liveWarnings(preview, estimateOrder(preview, CASH))).toEqual(preview.warnings);
  });

  it("refuses to price a quantity that isn't a real number of shares", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: Number.NaN, action: "buy" },
      context(),
    );
    expect(estimateOrder(preview, CASH, 120)).toBeUndefined();
  });
});
