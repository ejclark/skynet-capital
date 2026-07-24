import type { MarketContext } from "../domain/types.js";

/**
 * The boundary between our engine and wherever market data comes from.
 *
 * A scripted adapter (for tests) and a live Alpaca/market feed both implement this.
 * The port returns a fully-formed `MarketContext` — including derived signals — so
 * signal computation stays out of the personas.
 */
export interface MarketDataPort {
  /** Build a decision-ready snapshot for the given universe of symbols. */
  snapshot(symbols: readonly string[]): Promise<MarketContext>;
}
