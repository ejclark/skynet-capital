/**
 * Core domain vocabulary for Skynet Capital.
 *
 * These types are the shared language every layer speaks — personas, the engine,
 * broker adapters, and market-data adapters. Keep this file free of behavior and
 * free of I/O: types and constants only. Behavior lives in the modules that import them.
 */

export type Side = "buy" | "sell";
export const SIDES: readonly Side[] = ["buy", "sell"];

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
  /** In-process only: the option quotes this cycle's playbooks price from. Never written to disk or
   *  the wire — the trader records the context it was handed, without these. */
  readonly options?: OptionMarket;
}

/** One option contract as this process read it — in-process only, never persisted or sent. Per-share
 *  prices; a $0.00 bid is a real quote, so an absent side is `undefined`, never 0. */
export interface OptionContractQuote {
  readonly occSymbol: string;
  readonly underlying: string;
  readonly type: "call" | "put";
  readonly strike: number;
  /** `YYYY-MM-DD`. */
  readonly expiration: string;
  readonly bid?: number;
  readonly ask?: number;
  /** The feed's own greek, signed (puts negative). */
  readonly delta?: number;
  readonly openInterest?: number;
  /** The feed's quote stamp (`latestQuote.t`), ISO. */
  readonly quotedAt?: string;
  /** When this process read it, ISO. */
  readonly fetchedAt: string;
}

/** What one cycle knows about the option market: the listed expirations and the quotes it read. */
interface OptionMarket {
  /** Underlying → its listed expirations, sorted ascending. */
  readonly listed: Readonly<Record<string, readonly string[]>>;
  /** Keyed by OCC symbol. */
  readonly contracts: Readonly<Record<string, OptionContractQuote>>;
}

/**
 * A single holding. `quantity` may be negative for short positions. For an option contract (an
 * OCC `symbol`) `quantity` is CONTRACTS and `avgPrice` is the broker's PER-SHARE premium — value
 * it through `contractMultiplier` (`trading/option-symbols.ts`), never as `quantity × avgPrice`.
 */
export interface Position {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
  /**
   * The broker's own total-dollar mark for the holding, when the source has one (Alpaca's
   * `market_value`). The best mark for anything the live price stream does not quote — an option
   * contract above all — because it is already in dollars and already contract-scaled. Optional:
   * in-memory and replayed books have none, and fall back to cost.
   */
  readonly marketValue?: number;
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

/** What one playbook concluded on one decision pass (#3687). `tactical` marks a rule-chain
 *  playbook, which has no single book-level state — only that it was consulted. */
export type PlaybookVerdictState = "long" | "flat" | "no-window" | "tactical";
export const PLAYBOOK_VERDICT_STATES: readonly PlaybookVerdictState[] = [
  "long",
  "flat",
  "no-window",
  "tactical",
];

export interface PlaybookVerdict {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly state: PlaybookVerdictState;
}

export type OrderType = "market" | "limit";
export const ORDER_TYPES: readonly OrderType[] = ["market", "limit"];

/** Whether an option order adds risk (`open`) or takes it off (`close`). An option's risk direction is
 *  this, never `side` — a sold put is a `sell` that OPENS risk. */
export type OptionEffect = "open" | "close";
export const OPTION_EFFECTS: readonly OptionEffect[] = ["open", "close"];

/** The structures a bot may send — a closed set the wire validates and the dashboard words. */
export type OptionStructure = "cash-secured-put" | "covered-call" | "call-debit-spread" | "close";
export const OPTION_STRUCTURES: readonly OptionStructure[] = [
  "cash-secured-put",
  "covered-call",
  "call-debit-spread",
  "close",
];

export interface OptionLegIntent {
  /** OCC symbol; its root MUST equal the owning OrderIntent's `symbol` (the underlying). */
  readonly occSymbol: string;
  readonly side: Side;
  /** Alpaca mleg `ratio_qty`; 1 in every structure a bot may send today. */
  readonly ratio: number;
}

/** The bid/ask the limit was priced inside — per share, in `limitPrice`'s own sign convention. */
export interface OptionQuoteBand {
  readonly low: number;
  readonly high: number;
  /** The OLDEST feed stamp among the legs (`latestQuote.t`), ISO. */
  readonly at: string;
}

/** Why this contract — the audit trail for "why that strike" without storing the chain. */
export interface OptionSelection {
  readonly rule: string;
  readonly phase?: string;
  readonly spot?: number;
  readonly dte?: number;
  readonly targetDelta?: number;
  readonly pickedDelta?: number;
  readonly deltaSource?: "feed" | "model";
  readonly expiryBefore?: string;
  readonly candidates?: number;
  readonly towardNatural?: number;
}

export interface OptionOrderIntent {
  readonly effect: OptionEffect;
  readonly structure: OptionStructure;
  /** One leg, or a same-expiry 1:1 vertical (legs[0] = the long/closing-long leg for a debit
   *  spread open). */
  readonly legs: readonly OptionLegIntent[];
  /** Per share, per unit. One leg: the premium, > 0. Two legs: Alpaca's signed net — + debit paid,
   *  − credit received (`PlaceMultiLegOrderParams.netLimitPrice`). */
  readonly limitPrice: number;
  /** Absent only on a close priced without a live quote, which the guards refuse ("no-quote"). */
  readonly band?: OptionQuoteBand;
  /** Set only by a play that means to be assigned on this short (the CRWV wheel). */
  readonly assignment?: "intended";
  readonly selection?: OptionSelection;
}

/**
 * A persona's proposed trade. Personas express *direction and conviction*; the engine
 * owns *risk and sizing*. `reason` is required — it feeds the touch-point recaps and
 * the future learning loop, and it makes the DX legible when replaying a session.
 */
export interface OrderIntent {
  /** The ticker. For an option order: the UNDERLYING — cooldown, S2/E1, the subscription filter,
   *  basket budget and managed-symbol suppression all key on it. The contracts live in `option.legs`. */
  readonly symbol: string;
  /** One leg: that leg's side. Two legs: "buy" when limitPrice > 0 (net debit), else "sell". */
  readonly side: Side;
  /** Shares; contracts (one leg); or whole structures (two legs). */
  readonly quantity: number;
  /** Shares stay "market"; an option order is always "limit", and only option orders are. */
  readonly type: OrderType;
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
  /**
   * The structured half of `expectation` — a direction/invalidator claim a scoring pass can grade
   * without parsing prose (the calibration gap named in `docs/plans/trade-insights-loop.md` and
   * `docs/plans/metrics-layer.md`: "the signal that fired is prose only"). `magnitudePct` and
   * `horizonMs` are individually optional because a persona's actual rule may state neither — a
   * trigger/exit signal with no time-bound thesis is a true statement about that persona's edge,
   * never a placeholder to fill in later. Optional and additive: a bare persona reflex may still
   * carry only `expectation` prose.
   */
  readonly forecast?: OrderForecast;
  readonly option?: OptionOrderIntent;
  /** Alpaca `client_order_id`, stamped by the trader immediately before submit — never by a
   *  playbook. */
  readonly clientOrderId?: string;
}

/**
 * See `OrderIntent.forecast`. `invalidator` is always stated, even when the honest answer is that
 * the underlying rule has no automatic exit — "none" is a finding worth recording, not an absent
 * field. `direction` is the predicted move of the underlying price, the one thing every forecast
 * can be scored against regardless of what else the persona's rule states.
 */
export interface OrderForecast {
  readonly direction: "up" | "down";
  /** Expected move size, if the persona's rule implies one. Omit rather than guess at a number. */
  readonly magnitudePct?: number;
  /** How long the thesis is expected to hold, if the persona's rule is time-bound. Omit if it
   *  isn't — inventing a horizon the rule doesn't have would score the wrong claim. */
  readonly horizonMs?: number;
  /** What observation would prove THIS directional call wrong — never "not applicable"; even a
   *  full-exit trade with no remaining position is a falsifiable prediction about what happens
   *  next. */
  readonly invalidator: string;
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
  /**
   * Absent = UNCAPPED: no subscription budget, so `clampBuy` sizes exactly as it does for a
   * house-roster entry (cash and the position cap only). This is the shape a subscription seeded
   * from the retiring `SKYNET_PLAYBOOKS` roster takes (#4535 slice 1b) — that roster never had a
   * budget, so any finite seed would have tightened sizing. A member's own subscribe still
   * always sends a number (`subscriptions-api-routes.ts`).
   */
  readonly capitalAllocated?: number;
  readonly enabled: boolean;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
  /**
   * Optional symbol-targeting filter (#885, Eric: "acts as a filter to focus/aim the playbook at
   * specific stocks to execute against") — aims/restricts this subscription's execution to these
   * symbols, WITHOUT changing the playbook's own default `Playbook.symbol`. Absent or empty means
   * unrestricted: the playbook runs exactly as it always has. Enforced in `engine/guards.ts`
   * (`clampBuy`) on the entry side only — it never blocks an exit, same posture as every other
   * discipline guard in that file.
   */
  readonly symbols?: readonly string[];
  /**
   * Compounding opt-in (issue #3527 slice 3, Eric: "whether earnings or loss affect allocated
   * capital can be a standard configuration option of the playbook... disabled state by default
   * keeps this simple for now"). When true, this subscription's effective budget for
   * `clampBuy`'s subscription-budget check is `capitalAllocated + realizedPlForPlaybook(...)`
   * (closed round-trips under this playbook, for this persona) instead of `capitalAllocated`
   * alone — a profitable playbook earns room to grow, a losing one shrinks. Absent/false changes
   * nothing: the budget stays the flat configured number, exactly as every subscription behaves
   * today.
   */
  readonly compoundAllocation?: boolean;
}

/** `unfilled`: was live, ended with nothing filled. `working`: the cancel was not confirmed, so the
 *  broker may still fill it. A result is `filled` only on a broker-confirmed filled quantity > 0. */
export type OrderStatus = "filled" | "rejected" | "unfilled" | "working";
export const ORDER_STATUSES: readonly OrderStatus[] = ["filled", "rejected", "unfilled", "working"];

export interface OptionLegFill {
  readonly occSymbol: string;
  readonly filledQuantity: number;
  /** Per share, as the broker reported the leg. */
  readonly filledPrice?: number;
}

/** The outcome of submitting a single order to a broker. */
export interface OrderResult {
  readonly intent: OrderIntent;
  readonly status: OrderStatus;
  readonly filledQuantity?: number;
  /** Per share. Two legs: the broker's signed net. */
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
  readonly legFills?: readonly OptionLegFill[];
}
