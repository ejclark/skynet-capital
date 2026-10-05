import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { computeEquity } from "../../src/domain/portfolio.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { aQuote } from "../support/builders.js";

/**
 * The reference broker's unit rule (#4643): a quote is per share, as a broker quotes it, and an
 * option contract moves 100 shares' worth of cash — the same rule `computeEquity` values the
 * book by. Without it, a flat round trip on a contract showed a phantom gain of 99x its premium.
 */
const call = "NVDA261113C00240000";
const order = (side: OrderIntent["side"], quantity: number): OrderIntent => ({
  symbol: call,
  side,
  quantity,
  type: "market",
  reason: "test",
});

describe("InMemoryBroker — option contracts", () => {
  it("debits a contract's premium at 100 shares, keeping avgPrice per share like the broker", async () => {
    const quote = aQuote({ symbol: call, last: 5, bid: 5, ask: 5 });
    const broker = new InMemoryBroker(10_000, [quote]);

    await broker.submit(order("buy", 2));
    const portfolio = await broker.getPortfolio();

    expect(portfolio.cash).toBe(9_000);
    expect(portfolio.positions).toEqual([{ symbol: call, quantity: 2, avgPrice: 5 }]);
    // Cash and the book's own valuation agree: nothing gained or lost on a flat fill.
    expect(computeEquity(portfolio, { [call]: quote })).toBe(10_000);
  });

  it("credits a sale at 100 shares per contract and keeps the remainder's mark honest", async () => {
    const quote = aQuote({ symbol: call, last: 5, bid: 5, ask: 5 });
    const broker = new InMemoryBroker(10_000, [quote]);

    await broker.submit(order("buy", 2));
    await broker.submit(order("sell", 1));
    const portfolio = await broker.getPortfolio();

    expect(portfolio.cash).toBe(9_500);
    expect(portfolio.positions).toEqual([{ symbol: call, quantity: 1, avgPrice: 5 }]);
  });

  it("refuses a contract the cash cannot cover at 100 shares", async () => {
    const broker = new InMemoryBroker(400, [aQuote({ symbol: call, last: 5, bid: 5, ask: 5 })]);

    const result = await broker.submit(order("buy", 1));

    expect(result).toMatchObject({ status: "rejected", reason: "insufficient cash" });
  });
});
