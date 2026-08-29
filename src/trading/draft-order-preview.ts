import { type DraftLeg, type DraftOrder, undefinedRiskLegs } from "./draft-order.js";
import { SHARES_PER_CONTRACT } from "./option-economics.js";

/**
 * SLICE 3's pure half (#582): the payoff arithmetic behind the review screen for an ARBITRARY leg
 * set — net debit/credit and max gain/loss, computed the same way for two legs or four. Still no
 * I/O, no account, no broker: it reads only the numbers already sitting on the draft (each leg's
 * `limitPrice`, seeded from the chain the same way the single-leg ticket seeds its own estimate).
 * V1 SIMPLIFICATION per the issue: no shared pricing core (#578) — chain premiums direct.
 *
 * THE UNLIMITED-LOSS CRITERION, stated once: a naked short call (`undefinedRiskLegs`) makes max
 * loss a fact about the sky, not a number — `maxLoss` becomes the literal string `"unlimited"`
 * rather than a numeric placeholder, exactly what the issue's EARS criterion asks for. Everything
 * else here is ordinary piecewise-linear payoff evaluation: a combo's P&L only kinks at a strike,
 * so the extreme values live at the strikes and at $0 (price can't go lower) — no calculus needed,
 * just evaluate at every breakpoint and take the min/max.
 */

export interface DraftPreview {
  readonly legCount: number;
  /** False when any leg has no `limitPrice` — the numbers below then treat that leg's premium as
   *  $0, which is why callers should show the caveat rather than the numbers as gospel. */
  readonly pricedFully: boolean;
  /** Dollars: positive is a net CREDIT (money in), negative a net DEBIT (money out). Undefined
   *  only when the draft has no legs at all. */
  readonly netPremium?: number;
  readonly maxGain: number | "uncapped";
  /** The literal string, not a very large number — see the module doc. */
  readonly maxLoss: number | "unlimited";
  readonly unlimitedLoss: boolean;
  /** Which legs are behind the unlimited-loss warning, for the review screen to point at. */
  readonly undefinedRiskLegIds: readonly string[];
}

function legValueAt(leg: DraftLeg, price: number): number {
  return leg.optionType === "call"
    ? Math.max(price - leg.strike, 0)
    : Math.max(leg.strike - price, 0);
}

/** One leg's P&L at expiration if the underlying settles at `price`. Unpriced legs (no
 *  `limitPrice`, i.e. "at market") are treated as a $0 premium — an optimistic placeholder the
 *  caller must caveat via `pricedFully`, not a claim this module makes on its own. */
function legPnlAt(leg: DraftLeg, price: number): number {
  const premium = leg.limitPrice ?? 0;
  const value = legValueAt(leg, price);
  const perShare = leg.action === "buy" ? value - premium : premium - value;
  return perShare * leg.contracts * SHARES_PER_CONTRACT;
}

function netPnlAt(legs: readonly DraftLeg[], price: number): number {
  return legs.reduce((sum, leg) => sum + legPnlAt(leg, price), 0);
}

/** The slope of net P&L above the highest strike in the set — the only place a combo's payoff can
 *  keep climbing forever, since every put's value is flat up there. Positive means a long call
 *  outweighs any short calls (uncapped upside, the ordinary "long call" case); zero or negative
 *  means the top strike already is the best price gets, and a NEGATIVE slope is exactly the naked
 *  short call `undefinedRiskLegs` already caught. */
function upperSlope(legs: readonly DraftLeg[]): number {
  return legs.reduce((sum, leg) => {
    if (leg.optionType !== "call") return sum;
    const sign = leg.action === "buy" ? 1 : -1;
    return sum + sign * leg.contracts * SHARES_PER_CONTRACT;
  }, 0);
}

export function draftPreview(draft: DraftOrder): DraftPreview {
  const legs = draft.legs;
  const pricedFully = legs.every((leg) => leg.limitPrice !== undefined);
  const netPremium = legs.length
    ? legs.reduce(
        (sum, leg) =>
          sum +
          (leg.action === "sell" ? 1 : -1) *
            (leg.limitPrice ?? 0) *
            leg.contracts *
            SHARES_PER_CONTRACT,
        0,
      )
    : undefined;

  const risky = undefinedRiskLegs(draft);
  // Every kink in a piecewise-linear combo payoff sits at a strike, and price can never go below
  // $0 — so the true min/max over ALL prices is the min/max over just these finitely many points.
  const breakpoints = [0, ...legs.map((leg) => leg.strike)];
  const values = breakpoints.map((price) => netPnlAt(legs, price));
  const minPnl = values.length ? Math.min(...values) : 0;
  const maxPnlFinite = values.length ? Math.max(...values) : 0;
  const uncappedGain = upperSlope(legs) > 0;

  return {
    legCount: legs.length,
    pricedFully,
    ...(netPremium !== undefined ? { netPremium } : {}),
    maxGain: uncappedGain ? "uncapped" : maxPnlFinite,
    maxLoss: risky.length > 0 ? "unlimited" : Math.max(0, -minPnl),
    unlimitedLoss: risky.length > 0,
    undefinedRiskLegIds: risky.map((leg) => leg.id),
  };
}
