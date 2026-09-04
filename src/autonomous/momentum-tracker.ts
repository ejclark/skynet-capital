import type { MarketContext } from "../domain/types.js";

/**
 * Turns a stream of price ticks into a live `MarketContext` (quotes + momentum) that
 * personas can assess. Momentum is the fractional change across a rolling window of the
 * most recent ticks per symbol. Deliberately simple and tick-based for the first slice —
 * pure and stateful so it's unit-testable without a socket.
 */
export class MomentumTracker {
  private readonly window: number;
  private readonly prices = new Map<string, number[]>();

  constructor(window = 20) {
    this.window = Math.max(2, window);
  }

  /** Record a price tick, keeping only the most recent `window` prices for the symbol. */
  record(symbol: string, price: number): void {
    if (!(price > 0)) {
      return;
    }
    const series = this.prices.get(symbol) ?? [];
    series.push(price);
    if (series.length > this.window) {
      series.shift();
    }
    this.prices.set(symbol, series);
  }

  /** Most recent price for a symbol, or undefined if none seen. */
  lastPrice(symbol: string): number | undefined {
    const series = this.prices.get(symbol);
    return series && series.length > 0 ? series[series.length - 1] : undefined;
  }

  /** Fractional change across the window (0.03 = +3%); 0 until at least two ticks exist. */
  momentum(symbol: string): number {
    const series = this.prices.get(symbol);
    if (!series || series.length < 2) {
      return 0;
    }
    const first = series[0] as number;
    const last = series[series.length - 1] as number;
    return first > 0 ? (last - first) / first : 0;
  }

  /** Every symbol's current price window, for durable persistence. Never mutated by the
   *  caller — treat as a read-only snapshot. */
  snapshot(): Readonly<Record<string, readonly number[]>> {
    return Object.fromEntries(this.prices);
  }

  /** Seed the tracker from a durable snapshot (e.g. at boot, after a restart) — additive: only
   *  called before any live ticks arrive, so there's nothing to merge. Each series is trimmed to
   *  the configured window in case it was persisted under a different window size. */
  restore(entries: Readonly<Record<string, readonly number[]>>): void {
    for (const [symbol, series] of Object.entries(entries)) {
      this.prices.set(symbol, series.slice(-this.window));
    }
  }

  /** Build the decision-ready context from everything tracked so far. */
  context(asOf: string): MarketContext {
    const quotes: Record<string, MarketContext["quotes"][string]> = {};
    const momentum: Record<string, number> = {};
    for (const symbol of this.prices.keys()) {
      const last = this.lastPrice(symbol);
      if (last === undefined) {
        continue;
      }
      quotes[symbol] = { symbol, bid: last, ask: last, last, asOf };
      momentum[symbol] = this.momentum(symbol);
    }
    return { asOf, quotes, momentum };
  }
}
