import { type DraftLeg, type DraftOrder, undefinedRiskLegs } from "./draft-order.js";
import { SHARES_PER_CONTRACT } from "./option-economics.js";

/**
 * The pure half: the payoff arithmetic behind the review screen for an ARBITRARY leg
 * set — net debit/credit and max gain/loss, computed the same way for two legs or four. Still no
 * I/O, no account, no broker: it reads only the numbers already sitting on the draft (each leg's
 * `limitPrice`, seeded from the chain the same way the single-leg ticket seeds its own estimate).
 * V1 SIMPLIFICATION: no shared pricing core — chain premiums direct.
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
  /** The at-expiration curve the review draws (#3407; the study's row 8: max loss unavoidable
   *  on screen) — sampled server-side so the chart is the same arithmetic as the numbers above,
   *  never a second copy in the browser. Absent for an empty draft. */
  readonly payoff?: PayoffCurve;
}

export interface PayoffPoint {
  readonly price: number;
  readonly pnl: number;
}

export interface PayoffCurve {
  /** Evenly spaced across the window, plus every strike, ascending by price. */
  readonly points: readonly PayoffPoint[];
  /** Where the curve crosses $0, interpolated between samples; empty when it never does. */
  readonly breakevens: readonly number[];
  /** The sampled window: 20% below the lowest strike to 20% above the highest. */
  readonly from: number;
  readonly to: number;
}

/** How many evenly spaced samples the curve carries besides the strikes themselves. */
export const PAYOFF_SAMPLES = 40;

/**
 * The curve as points: even samples across the window plus the strikes (the only kinks), so a
 * polyline through them is exact, and the zero crossings between consecutive points by linear
 * interpolation — exact too, since each segment is linear.
 */
export function payoffCurve(legs: readonly DraftLeg[]): PayoffCurve | undefined {
  if (legs.length === 0) return undefined;
  const strikes = legs.map((leg) => leg.strike);
  const from = Math.max(0, Math.min(...strikes) * 0.8);
  const to = Math.max(...strikes) * 1.2;
  const prices = new Set<number>(strikes);
  for (let i = 0; i <= PAYOFF_SAMPLES; i += 1) {
    prices.add(round2(from + ((to - from) * i) / PAYOFF_SAMPLES));
  }
  const points = [...prices]
    .sort((a, b) => a - b)
    .map((price) => ({ price, pnl: round2(netPnlAt(legs, price)) }));
  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (!(a && b)) continue;
    if (a.pnl === 0 && (i === 1 || (points[i - 2]?.pnl ?? 0) !== 0)) breakevens.push(a.price);
    if ((a.pnl < 0 && b.pnl > 0) || (a.pnl > 0 && b.pnl < 0)) {
      breakevens.push(round2(a.price + ((b.price - a.price) * -a.pnl) / (b.pnl - a.pnl)));
    }
  }
  return { points, breakevens, from: round2(from), to: round2(to) };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
    ...(legs.length > 0 ? { payoff: payoffCurve(legs) } : {}),
  };
}
