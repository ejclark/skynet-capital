import type { OrderIntent, OrderResult, Portfolio, Position, Quote } from "../domain/types.js";
import type { BrokerPort } from "../ports/broker.js";
import { contractMultiplier } from "../trading/option-symbols.js";

/**
 * A fully in-memory paper broker. Fills market orders against a price book:
 * buys lift the ask, sells hit the bid. It is the reference `BrokerPort` — the same
 * one the tests drive and the local paper simulator will use — so its fill semantics
 * are the contract every other broker adapter should match.
 *
 * Not thread-safe and intentionally simple: one account, long-only, market orders. Prices are
 * per share, as a broker quotes them, and an option contract moves 100 shares' worth of cash —
 * the same unit rule `computeEquity` values the book by, so cash and equity never disagree (#4643).
 */
export class InMemoryBroker implements BrokerPort {
  private cash: number;
  private readonly positions = new Map<string, Position>();
  private readonly prices = new Map<string, Quote>();

  constructor(initialCash: number, quotes: readonly Quote[] = []) {
    this.cash = initialCash;
    this.mark(quotes);
  }

  /** Update the price book used to fill orders. Call before submitting in a sim loop. */
  mark(quotes: readonly Quote[]): void {
    for (const quote of quotes) {
      this.prices.set(quote.symbol, quote);
    }
  }

  getPortfolio(): Promise<Portfolio> {
    return Promise.resolve({
      cash: this.cash,
      positions: [...this.positions.values()],
    });
  }

  submit(order: OrderIntent): Promise<OrderResult> {
    // An option order names the UNDERLYING in `symbol`; filling it here would buy or sell shares.
    if (order.option) {
      return Promise.resolve(this.reject(order, "options are not simulated in-memory"));
    }
    const quote = this.prices.get(order.symbol);
    if (!quote) {
      return Promise.resolve(this.reject(order, `no price for ${order.symbol}`));
    }
    return Promise.resolve(
      order.side === "buy" ? this.fillBuy(order, quote) : this.fillSell(order),
    );
  }

  private fillBuy(order: OrderIntent, quote: Quote): OrderResult {
    const cost = order.quantity * quote.ask * contractMultiplier(order.symbol);
    if (cost > this.cash) {
      return this.reject(order, "insufficient cash");
    }

    this.cash -= cost;
    const existing = this.positions.get(order.symbol);
    if (existing) {
      const newQuantity = existing.quantity + order.quantity;
      const newAvgPrice =
        (existing.quantity * existing.avgPrice + order.quantity * quote.ask) / newQuantity;
      this.positions.set(order.symbol, {
        symbol: order.symbol,
        quantity: newQuantity,
        avgPrice: newAvgPrice,
      });
    } else {
      this.positions.set(order.symbol, {
        symbol: order.symbol,
        quantity: order.quantity,
        avgPrice: quote.ask,
      });
    }

    return {
      intent: order,
      status: "filled",
      filledQuantity: order.quantity,
      filledPrice: quote.ask,
    };
  }

  private fillSell(order: OrderIntent): OrderResult {
    const existing = this.positions.get(order.symbol);
    if (!existing || existing.quantity < order.quantity) {
      return this.reject(order, "insufficient position");
    }

    // Price already validated in submit(); re-read for the fill.
    const quote = this.prices.get(order.symbol);
    if (!quote) {
      return this.reject(order, `no price for ${order.symbol}`);
    }

    this.cash += order.quantity * quote.bid * contractMultiplier(order.symbol);
    const remaining = existing.quantity - order.quantity;
    if (remaining === 0) {
      this.positions.delete(order.symbol);
    } else {
      // Rebuilt, not spread: a seeded `marketValue` is a dollar mark for the OLD quantity.
      this.positions.set(order.symbol, {
        symbol: existing.symbol,
        quantity: remaining,
        avgPrice: existing.avgPrice,
      });
    }

    return {
      intent: order,
      status: "filled",
      filledQuantity: order.quantity,
      filledPrice: quote.bid,
    };
  }

  private reject(order: OrderIntent, reason: string): OrderResult {
    return { intent: order, status: "rejected", reason };
  }
}
