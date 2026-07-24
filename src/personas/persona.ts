import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";

/**
 * A trading persona: a named strategy with a point of view.
 *
 * Contract, deliberately narrow so personas stay easy to write and to test:
 *  - `decide` is a PURE function of (context, portfolio). No I/O, no randomness,
 *    no reading the clock. Same inputs → same intents. This is what makes BDD specs
 *    possible: feed a hand-built context, assert on the intents.
 *  - Personas express DIRECTION and CONVICTION. They do NOT enforce risk limits or
 *    check cash — the engine owns that (see engine/guards.ts). A persona may over-ask;
 *    the engine clamps. Keeping risk out of personas means one place to change it.
 */
export interface Persona {
  readonly id: string;
  readonly name: string;
  /** One-line thesis, surfaced in reports and touch-point recaps. */
  readonly thesis: string;
  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[];
}

/** Read a symbol's momentum signal, defaulting to flat when absent. */
export function momentumOf(context: MarketContext, symbol: string): number {
  return context.momentum?.[symbol] ?? 0;
}

/** Read a symbol's news sentiment, defaulting to neutral when absent. */
export function sentimentOf(context: MarketContext, symbol: string): number {
  return context.newsSentiment?.[symbol] ?? 0;
}

/** Whole-share quantity a target notional buys at the given price (0 if price invalid). */
export function sharesForNotional(notional: number, price: number): number {
  if (price <= 0) {
    return 0;
  }
  return Math.floor(notional / price);
}
