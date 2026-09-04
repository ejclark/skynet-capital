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
 * How assertively a playbook is being run. One play, three parameterizations — sizing, entry
 * threshold, stop width scale with the mode. Running modes side-by-side on paper triples the
 * evidence each live window yields (docs/plans/trade-playbooks.md → play modes).
 */
export type PlaybookMode = "conservative" | "standard" | "aggressive";
export const PLAYBOOK_MODES: readonly PlaybookMode[] = ["conservative", "standard", "aggressive"];

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
  /**
   * Structured attribution: which named playbook produced this intent (e.g. "S1-NVDA",
   * "G1-GOOG"). Optional — a bare persona reflex has none. Structured on purpose: the metrics
   * layer scores per-playbook effectiveness from this field, never by parsing `reason` prose
   * (docs/plans/trade-playbooks.md → pre-settled forks).
   */
  readonly playbookId?: string;
  /** The mode the playbook ran in. Meaningless without `playbookId`. */
  readonly playbookMode?: PlaybookMode;
  /**
   * Explicit opt-OUT of the S2 flat-through-print guard — the eight-symbol sweep's one
   * universal finding is that every print gap is a fat-tailed coin flip, so holding through
   * one must be a deliberate, recorded choice, never a default.
   */
  readonly allowThroughPrint?: boolean;
  /**
   * Explicit opt-out of the E1 defer-the-open guard, for genuinely time-critical entries
   * (an event play whose edge IS the open). The first hour carries ~30% of daily volatility
   * at zero mean drift on every symbol measured — urgency must be claimed, not assumed.
   */
  readonly urgent?: boolean;
  /**
   * Structured strategy tag for research/observation modes (e.g. "hc-panic-claim"). Like
   * `playbookId`, this exists so trades group by strategy WITHOUT parsing `reason` prose —
   * Eric's hardcore-mode directive (2026-08-20): the context that drove an action must be
   * first-class data, because it later feeds per-strategy confidence ratings.
   */
  readonly strategy?: string;
  /**
   * How we expect the market to behave from here, and what would invalidate the thesis. The
   * forward-looking half of the trade's context: `reason` says why we acted, `expectation` says
   * what we predicted — so intent can be scored against outcome later.
   */
  readonly expectation?: string;
}

/**
 * An account's subscription to a playbook: a hard capital sub-allocation reserved out of the
 * account, delegated to that playbook's execution. Same shape for a bot account or a human
 * account — subscribing is always against your OWN capital, never another
 * account's. `capitalAllocated` is a currency amount, not a fraction of equity (unlike
 * `Playbook.size`) — the engine derives how much of it is currently deployed live from the
 * portfolio rather than tracking a separate running ledger (a playbook trades exactly one
 * symbol, so the held value of that symbol already tells the guard what's deployed).
 */
export interface PlaybookSubscription {
  readonly accountId: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number;
  readonly enabled: boolean;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

type OrderStatus = "filled" | "rejected";

/** The outcome of submitting a single order to a broker. */
export interface OrderResult {
  readonly intent: OrderIntent;
  readonly status: OrderStatus;
  readonly filledQuantity?: number;
  readonly filledPrice?: number;
  readonly reason?: string;
  /**
   * The broker's own order id — present whenever the broker actually created an order (filled, or
   * rejected after being accepted); absent only when the submission never reached that point (a
   * transport failure, or a paper-broker rejection with no order object at all). This is the join
   * key `trading/playbook-attribution.ts` uses to attach `intent.playbookId`/`playbookMode` onto
   * the persisted trade/round-trip record — closing the `OrderIntent` → persisted-trade
   * attribution gap named in #885.
   */
  readonly orderId?: string;
}
