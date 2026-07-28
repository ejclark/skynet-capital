/**
 * Core domain vocabulary for Skynet Capital.
 *
 * These types are the shared language every layer speaks — personas, the engine,
 * broker adapters, and market-data adapters. Keep this file free of behavior and
 * free of I/O: types and constants only. Behavior lives in the modules that import them.
 */

export type Side = "buy" | "sell";

/** A point-in-time two-sided price for a symbol. */
export interface Quote {
  readonly symbol: string;
  readonly bid: number;
  readonly ask: number;
  readonly last: number;
  /** ISO-8601 timestamp. */
  readonly asOf: string;
}

/**
 * Everything a persona is allowed to reason over for a single decision cycle.
 *
 * Derived signals (momentum, newsSentiment) live here rather than being recomputed
 * inside each persona — that keeps signal math in one place (DRY) and lets us test
 * persona behavior by feeding it hand-crafted contexts.
 */
export interface MarketContext {
  /** ISO-8601 timestamp for the whole snapshot. */
  readonly asOf: string;
  /** Keyed by symbol. The key set defines the tradable universe for this cycle. */
  readonly quotes: Readonly<Record<string, Quote>>;
  /** Short-window price change as a fraction (0.05 = +5%). Keyed by symbol. */
  readonly momentum?: Readonly<Record<string, number>>;
  /** News sentiment in [-1, 1]. Keyed by symbol. */
  readonly newsSentiment?: Readonly<Record<string, number>>;
}

/** A single holding. `quantity` may be negative for short positions. */
export interface Position {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
}

/** A persona's full account state at the start of a cycle. */
export interface Portfolio {
  readonly cash: number;
  readonly positions: readonly Position[];
}

/**
 * A persona's proposed trade. Personas express *direction and conviction*; the engine
 * owns *risk and sizing*. `reason` is required — it feeds the touch-point recaps and
 * the future learning loop, and it makes the DX legible when replaying a session.
 */
export interface OrderIntent {
  readonly symbol: string;
  readonly side: Side;
  readonly quantity: number;
  /** Slice 1 supports market orders only; the field exists so adapters can widen later. */
  readonly type: "market";
  readonly reason: string;
}

type OrderStatus = "filled" | "rejected";

/** The outcome of submitting a single order to a broker. */
export interface OrderResult {
  readonly intent: OrderIntent;
  readonly status: OrderStatus;
  readonly filledQuantity?: number;
  readonly filledPrice?: number;
  readonly reason?: string;
}
