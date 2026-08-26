/**
 * THE GRADUATED RISK LADDER — warn, then block, then flatten.
 *
 * A boolean risk check ("can I place this or not?") is a strictly worse object than a ladder. IBKR
 * does not tell an account "insufficient margin" the moment it is in trouble; it colours the cushion
 * yellow at 5% and orange at 0%, so the desk sees the wall coming and has room to act before
 * anything is taken out of its hands. This module is that shape for Skynet: one drawdown reading,
 * four named rungs, and a total function from the reading to what the system is allowed to do.
 *
 * The rungs, from the top:
 *
 * - `clear`      — nothing to say.
 * - `watch`      — SOFT. Warn, visibly, and change nothing else. A warning that blocks is not a
 *                  warning; a rung that only sets a flag nobody renders is not visible. The
 *                  companion `risk-ladder-alert.ts` publishes it on the alert bus.
 * - `restricted` — HARDER. New risk-INCREASING orders are refused; existing positions are left
 *                  strictly alone, and exits stay open. A guard that blocks risk reduction is a
 *                  hazard, not a discipline (`src/engine/guards.ts` says the same thing about S2/E1).
 * - `liquidate`  — SEVEREST. The book may be force-flattened automatically — and ONLY for an
 *                  autonomous bot. A human member's positions are never closed on their behalf
 *                  without an explicit action, which is why `RiskActor` defaults to `member`
 *                  everywhere it is read: the permissive value has to be asked for by name.
 *
 * WHAT IS MEASURED: drawdown against the day's opening equity — the same number
 * `SafetyController`'s daily-loss breaker already watches, fed by `equity-watch.ts`. That is
 * deliberate. This ladder generalises a breaker that is already real and already wired rather than
 * standing up a second, parallel risk system that could disagree with the first.
 *
 * Pure by construction: no clock, no I/O, no mutation. Callers supply the two equity numbers.
 */

/** How much trouble the account is in. Ordered least to most severe. */
export type RiskTier = "clear" | "watch" | "restricted" | "liquidate";

/**
 * Whose book this is. `member` is a human and is never auto-flattened; `bot` is an autonomous
 * persona that opted into being flattened when it opted into trading unattended.
 */
export type RiskActor = "bot" | "member";

/** The three rung boundaries, as fractions of the day's opening equity given back. */
export interface RiskLadder {
  /** SOFT — warn from here down. */
  readonly watchAt: number;
  /** HARDER — refuse new risk-increasing orders from here down. */
  readonly restrictAt: number;
  /** SEVEREST — a bot's book may be force-flattened from here down. */
  readonly flattenAt: number;
}

/**
 * STARTING DIALS, NOT FITTED VALUES. These are deliberately conservative round numbers chosen to
 * bracket the breaker we already run; none of them is derived from a backtest, and all three are
 * expected to move once there is live paper evidence to move them with.
 */

/** SOFT rung: 3% off the day's open. Roughly half the existing daily-loss cap — early enough to be
 *  a heads-up rather than an obituary, late enough that ordinary intraday noise does not trip it. */
export const WATCH_DRAWDOWN_PCT = 0.03;

/** HARDER rung: 5% off the day's open. Chosen to COINCIDE with `SafetyController`'s existing
 *  `maxDailyLossPct` default, on purpose: the ladder must not quietly redraw the line the live
 *  breaker already draws. It adds a rung above it and a rung below it, and moves nothing. */
export const RESTRICT_DRAWDOWN_PCT = 0.05;

/** SEVEREST rung: 8% off the day's open. Below the block rung because blocking new orders does not
 *  stop the bleeding — the halt stops *ordering*, while open positions keep marking against you.
 *  This rung exists precisely for the gap the halt leaves open. */
export const FLATTEN_DRAWDOWN_PCT = 0.08;

export const DEFAULT_RISK_LADDER: RiskLadder = {
  watchAt: WATCH_DRAWDOWN_PCT,
  restrictAt: RESTRICT_DRAWDOWN_PCT,
  flattenAt: FLATTEN_DRAWDOWN_PCT,
};

/** Where the account sits on the ladder right now, and how far the next rung is. */
export interface RiskReading {
  readonly tier: RiskTier;
  /** Fraction of the day's opening equity given back. NEGATIVE means up on the day — reported
   *  truthfully rather than clamped to zero, so a consumer can tell "flat" from "ahead". */
  readonly drawdownPct: number;
  /** The threshold that put the account on this rung. Absent on `clear` — no rung was crossed. */
  readonly crossedAt?: number;
  /** The next rung down and the drawdown that reaches it. Absent at `liquidate` — bottom rung. */
  readonly nextRung?: { readonly tier: RiskTier; readonly at: number };
}

/**
 * Which rung a drawdown lands on. Evaluated MOST SEVERE FIRST so a mis-ordered ladder (someone
 * configures `watchAt` below `restrictAt`) degrades to the safer answer instead of a nonsense one.
 *
 * Boundaries are inclusive: a drawdown exactly equal to a threshold is ON that rung, not above it.
 * A threshold you can sit exactly on without it applying is a threshold with a silent gap.
 */
function rungFor(drawdownPct: number, ladder: RiskLadder): Omit<RiskReading, "drawdownPct"> {
  if (drawdownPct >= ladder.flattenAt) {
    return { tier: "liquidate", crossedAt: ladder.flattenAt };
  }
  if (drawdownPct >= ladder.restrictAt) {
    return {
      tier: "restricted",
      crossedAt: ladder.restrictAt,
      nextRung: { tier: "liquidate", at: ladder.flattenAt },
    };
  }
  if (drawdownPct >= ladder.watchAt) {
    return {
      tier: "watch",
      crossedAt: ladder.watchAt,
      nextRung: { tier: "restricted", at: ladder.restrictAt },
    };
  }
  return { tier: "clear", nextRung: { tier: "watch", at: ladder.watchAt } };
}

/**
 * Read the ladder for one account.
 *
 * Returns `null` — ABSENT, never a cheerful `clear` — when the inputs cannot support a reading: no
 * day-opening baseline yet, a non-positive baseline, or a non-finite equity mark. An unknown risk
 * level reported as "clear" is exactly the false zero the house rules forbid, and here it would be
 * the dangerous direction of wrong.
 */
export function readRiskLadder(
  baselineEquity: number,
  equity: number,
  ladder: RiskLadder = DEFAULT_RISK_LADDER,
): RiskReading | null {
  if (!Number.isFinite(baselineEquity) || baselineEquity <= 0) return null;
  if (!Number.isFinite(equity)) return null;
  const drawdownPct = (baselineEquity - equity) / baselineEquity;
  return { drawdownPct, ...rungFor(drawdownPct, ladder) };
}

/**
 * May new RISK-INCREASING orders still be placed? False from the block rung down.
 *
 * Note what this does NOT say: nothing about existing positions, and nothing about exits. Both are
 * untouched at every rung except `liquidate`, and even there only for a bot.
 */
export function blocksRiskIncrease(tier: RiskTier): boolean {
  return tier === "restricted" || tier === "liquidate";
}

/**
 * Should this book be force-flattened right now? Both conditions are required, and the actor check
 * is the load-bearing one: a member at `liquidate` gets the block and the critical alert, and their
 * positions stay exactly where they left them until they act.
 */
export function forceFlattenRequired(tier: RiskTier, actor: RiskActor): boolean {
  return tier === "liquidate" && actor === "bot";
}
