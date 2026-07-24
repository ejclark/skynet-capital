import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { type Persona, momentumOf, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Day Trader. Config, not hardcoded — same rationale as the others. */
export interface DayTraderConfig {
  /** The big-tech names this trader watches; it ignores everything else. */
  readonly focus: readonly string[];
  /** Momentum at/above which it takes the long side. */
  readonly entryMomentum: number;
  /** Momentum at/below which it cuts a held name (day traders don't sit in losers). */
  readonly exitMomentum: number;
  /** Dollar size per entry. */
  readonly entryNotional: number;
}

export const DEFAULT_DAY_TRADER_CONFIG: DayTraderConfig = {
  focus: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA"],
  entryMomentum: 0.015,
  exitMomentum: -0.01,
  entryNotional: 120_000,
};

/**
 * "The Day Trader." A seasoned Wall Street tape-reader focused on big tech. Rides
 * intraday momentum in a tight watchlist and cuts weakness fast — buys strength it's flat
 * on, sells anything it holds the moment momentum rolls over. Never strays outside its
 * focus list; conviction comes from knowing a handful of names cold, not from breadth.
 */
export class DayTraderPersona implements Persona {
  readonly id = "day-trader";
  readonly name = "The Day Trader";
  readonly thesis = "Seasoned tape-reader; rides big-tech momentum and cuts losers fast.";

  private readonly config: DayTraderConfig;
  private readonly focus: Set<string>;

  constructor(config: DayTraderConfig = DEFAULT_DAY_TRADER_CONFIG) {
    this.config = config;
    this.focus = new Set(config.focus);
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      if (!this.focus.has(symbol)) {
        continue;
      }
      const momentum = momentumOf(context, symbol);
      const held = heldQuantity(portfolio, symbol);

      if (held === 0 && momentum >= this.config.entryMomentum) {
        const quote = context.quotes[symbol];
        const quantity = quote ? sharesForNotional(this.config.entryNotional, quote.ask) : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Momentum long: ${symbol} momentum ${momentum.toFixed(2)} >= ${this.config.entryMomentum}`,
          });
        }
        continue;
      }

      if (held > 0 && momentum <= this.config.exitMomentum) {
        intents.push({
          symbol,
          side: "sell",
          quantity: held,
          type: "market",
          reason: `Cutting weakness: ${symbol} momentum ${momentum.toFixed(2)} <= ${this.config.exitMomentum}`,
        });
      }
    }

    return intents;
  }
}
