/**
 * THE POSITION BRIEF — the template contract (#3729). One fixed shape, rendered identically by the
 * React component, the markdown renderer (`position-guidance-markdown.ts`), the companion and an issue
 * comment. The fixed order is the point: a member scanning the same sections in the same place on
 * every visit reads a change at a glance (Eric, 2026-09-25: "a standardize template/form … to
 * quickly parse information over repetition/time").
 *
 * Position guidance is the research call sheet (`docs/research/events/TEMPLATE.md` — Call · Confidence · Why
 * · Proves it wrong), keyed by LEVER instead of by horizon and personalised by the member's stake.
 * It follows that contract rather than `recommend.ts`'s "a list, never a suggestion": calls are
 * graded, a low grade renders as a stand-aside (never a small bet), and every call carries the
 * dated observation that proves it wrong.
 */

/** Graded exactly like the research call sheet. Low is a stand-aside, never a small bet. */
export type Confidence = "high" | "medium" | "low" | "none";

/** Every input's freshness, computed by the server's pulse assembler against a LIVE source. */
export type PulseStatus = "fresh" | "aging" | "stale";

/**
 * The inputs the pulse strip reports on. The engine never reads a clock (it stays pure): the
 * server measures each input against its live source and hands the status in; the engine only
 * applies the demotion each status carries (see `applyPulse` in `position-guidance-rules.ts`).
 */
export type PulseInputId = "spot" | "chain" | "research" | "earnings-date" | "filings" | "session";

export interface PulseItem {
  readonly id: PulseInputId;
  /** Where the value came from — "Alpaca IEX last trade", "SEC EDGAR 8-K index", … */
  readonly source: string;
  /** ISO-8601 time the value is OF (not when it was fetched). Absent when the source gave none. */
  readonly asOf?: string;
  readonly status: PulseStatus;
  /** One plain line: why this status ("2 new 8-Ks since research", "quotes 3 min old"). */
  readonly note: string;
  /**
   * The input is unfit to PRICE from, even though it is fit to show: out of hours with the option
   * marks and the stock's price disagreeing, every yield and delta would be solved from mismatched
   * data. The engine then drops the strike rows and waits for the open.
   */
  readonly blocksPricing?: boolean;
}

/** What the member wants out of the position — it changes which calls are sensible. */
export type GuidanceGoal = "income" | "keep-shares" | "exit";

/** The member's stake. Every field optional: a cash-only member has no shares, a holder may have no cash. */
export interface GuidanceStake {
  readonly shares?: number;
  /** Average cost per share. Shapes strikes (never below basis); never drives SELL — sunk cost. */
  readonly costBasis?: number;
  readonly cash?: number;
  /** Unset until the member picks one — nothing defaults to acting on their behalf. */
  readonly goal?: GuidanceGoal;
  /** The price the member would happily own more at — the ceiling for a cash-secured put strike. */
  readonly happyToOwnAt?: number;
  /** Whole-portfolio value, for the concentration line. */
  readonly portfolioValue?: number;
  /** Covered calls already open against these shares, in contracts — those lots are spoken for. */
  readonly callsSold?: number;
  /** Premium already received on this position, in dollars — it lowers the strike floor. */
  readonly premiumsCollected?: number;
}

/** One listed contract as the feed quoted it. Bid is what a SELLER receives — every yield uses it. */
export interface GuidanceQuote {
  readonly expiration: string;
  readonly strike: number;
  readonly type: "call" | "put";
  readonly bid?: number;
  readonly ask?: number;
  /** Annualized IV as a decimal, solved from this contract's own premium. */
  readonly iv?: number;
  /** The feed's delta, kept only to cross-check our own Black-Scholes delta. */
  readonly feedDelta?: number;
  /** When the feed says this bid/ask was quoted — a strike older than the stale bar is dropped. */
  readonly quotedAt?: string;
  /** Contracts open — under the liquidity floor, a quote is a number nobody trades against. */
  readonly openInterest?: number;
}

/**
 * The earnings print as a WINDOW. A cadence estimate is not a date: while `status` is `estimate`
 * the honest window is wider than the point guess (CRWV: est. 11-10, window Nov 9–16), and every
 * DTE cut keys on `start`, never the point date.
 */
export interface EarningsWindow {
  readonly start: string;
  readonly end: string;
  readonly status: "confirmed" | "estimate";
  readonly source: string;
}

/** A dated event the calls are waiting on (a conference, a peer's print, an IR announcement). */
export interface GuidanceCatalyst {
  readonly date: string;
  readonly label: string;
  readonly source: string;
}

/** What the symbol's research ledger currently licenses on the buy side. */
export interface LedgerStance {
  /** Does any house playbook license a buy right now? (CRWV: no — S1 is kill-listed.) */
  readonly buySignal: boolean;
  readonly buyConfidence: Confidence;
  /** The ledger's one-line stance, quoted — "Stand aside · S2 · E1 — no buy signal exists". */
  readonly stance: string;
  readonly source: string;
}

export interface GuidanceInputs {
  readonly symbol: string;
  /** ISO-8601. Supplied by the caller — the engine has no clock. */
  readonly now: string;
  readonly spot: number;
  readonly sessionOpen: boolean;
  readonly stake: GuidanceStake;
  readonly chain: readonly GuidanceQuote[];
  /**
   * Every listed expiration, when the caller fetched quotes for only some of them — the strip must
   * still show an expiry as "spans print" even though no one should price it. Defaults to the
   * chain's own expirations.
   */
  readonly expirations?: readonly string[];
  /** Annualized realized volatility (decimal) over ~20 sessions — the richness yardstick. */
  readonly realizedVol?: number;
  /** IV rank 0–100 when the IV instrument has a full window; absent until it does. */
  readonly ivRank?: number;
  readonly earnings?: EarningsWindow;
  /**
   * This name's own researched finding on how its options price its prints, quoted from its ledger
   * (CRWV: "its options have underpriced its print moves — Q2 implied ~15.5% vs ~18.6% realized
   * (FT-15)"). Symbol-specific evidence is an INPUT, never baked into the engine's text; absent, the
   * guidance falls back to the generic model caveat.
   */
  readonly printEvidence?: string;
  readonly catalysts: readonly GuidanceCatalyst[];
  readonly ledger?: LedgerStance;
  readonly pulse: readonly PulseItem[];
  /** Risk-free rate for the odds; defaults to 0 like the rest of `src/options/`. */
  readonly rate?: number;
}

/**
 * Everything the engine needs except the member's stake — what `/api/trade/guidance` returns. The
 * stake is applied in the member's own browser, so shares, cost basis and cash never travel in a
 * URL or land in a server log.
 */
export type GuidanceMarket = Omit<GuidanceInputs, "stake">;

export type Lever = "shares" | "covered-calls" | "cash-secured-puts";
export type SharesCall = "BUY" | "HOLD" | "SELL" | "DECIDE" | "STAND ASIDE" | "NO ANSWER";
export type OptionCall = "WRITE" | "WAIT" | "NOT AVAILABLE" | "NO ANSWER";

/** Every reason names the rule that produced it, so the "why" is templated and auditable. */
export type RuleId =
  | "DTE-PRINT"
  | "DTE-FLOOR"
  | "STRIKE-BASIS"
  | "STRIKE-OWN"
  | "PRICE-AT-BID"
  | "RICHNESS"
  | "CONCENTRATION"
  | "SHARES"
  | "LEDGER"
  | "GOAL"
  | "COVERAGE"
  | "SIZE"
  | "PULSE";

export interface GuidanceReason {
  readonly rule: RuleId;
  readonly text: string;
}

export interface LeverCall {
  readonly lever: Lever;
  readonly call: SharesCall | OptionCall;
  readonly confidence: Confidence;
  /** At most three, most important first. */
  readonly reasons: readonly GuidanceReason[];
  /** The dated observation that would prove this call wrong. */
  readonly provesWrong: string;
  /** "Until when": the date the next decision is due, and what we are waiting to see. */
  readonly until?: { readonly date: string; readonly why: string };
  /** Market closed: the call is a plan for the next open, never an instruction for now. */
  readonly atOpen: boolean;
}

export type DteVerdict = "in" | "too-short" | "after-decision" | "spans-print";

export interface DteMark {
  readonly expiration: string;
  /** Whole calendar days from today's ET date to expiry. */
  readonly dte: number;
  readonly verdict: DteVerdict;
  /** Dated catalysts that land before this expiry — a warning, never an exclusion. */
  readonly catalysts: readonly string[];
}

export interface LadderRow {
  readonly lever: "covered-calls" | "cash-secured-puts";
  readonly expiration: string;
  readonly dte: number;
  readonly strike: number;
  readonly bid: number;
  readonly mid: number;
  /** Bid ÷ capital at work × 365 ÷ DTE. Capital = spot (covered call) or strike (put). */
  readonly annualizedYield: number;
  /** Model P(finishing past the strike) — lognormal, this contract's own IV, no jumps. */
  readonly probAssigned: number;
  /** Model P(trading through the strike at any time before expiry) — roughly 2× the above. */
  readonly probTouch: number;
  /** Covered call: total return if called away, measured from the strike floor (basis less premiums collected) — absent with no basis. */
  readonly returnIfCalled?: number;
  /** Cash-secured put: the effective price paid per share if assigned (strike − bid). */
  readonly effectiveEntry?: number;
  /** Our Black-Scholes delta. */
  readonly delta: number;
  /** Set when the feed's delta disagrees with ours by more than the tolerance — a data-quality flag. */
  readonly deltaDisagreement?: number;
  /** Contracts this row suggests — always 1, so no row ever offers the whole position by default. */
  readonly contracts: number;
  /** The most the stake could cover (all 100-share lots, or all the cash) — shown, never defaulted to. */
  readonly maxContracts: number;
}

/** Whether premium is rich, and how we know — IV rank when history exists, IV ÷ realized otherwise. */
export interface Richness {
  readonly verdict: "rich" | "middling" | "cheap" | "unknown";
  readonly basis: "iv-rank" | "iv-vs-realized" | "none";
  readonly atmIv?: number;
  readonly realizedVol?: number;
  readonly ivRank?: number;
}

export interface WaitingOn {
  readonly date: string;
  readonly label: string;
  readonly source: string;
}

export interface StakeView extends GuidanceStake {
  readonly unrealizedPnl?: number;
  readonly unrealizedPct?: number;
  /** Share of the portfolio in this one name, 0..1. */
  readonly concentration?: number;
}

export interface PositionGuidance {
  readonly symbol: string;
  readonly asOf: string;
  readonly spot: number;
  readonly sessionOpen: boolean;
  readonly pulse: readonly PulseItem[];
  readonly stake: StakeView;
  /** Always three, always in this order: shares · covered calls · cash-secured puts. */
  readonly calls: readonly [LeverCall, LeverCall, LeverCall];
  readonly waitingOn: readonly WaitingOn[];
  readonly richness: Richness;
  readonly dteStrip: readonly DteMark[];
  readonly ladder: readonly LadderRow[];
  readonly assumptions: readonly string[];
  readonly disclosure: string;
}

/** The minimal slice of a guidance read kept per viewer to answer "what changed since you last looked". */
export interface GuidanceSnapshot {
  readonly asOf: string;
  readonly spot: number;
  readonly calls: readonly {
    readonly lever: Lever;
    readonly call: string;
    readonly confidence: Confidence;
  }[];
  readonly richness: Richness["verdict"];
}
