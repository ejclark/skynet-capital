import type { OptionLeg } from "./payoff-surface.js";
import {
  type RiskBound,
  type RiskHorizon,
  type StructureRisk,
  structureProfitAt,
} from "./structure-risk.js";
import type { StructureKind } from "./structure-templates.js";

/**
 * MECHANICS, NOT ADVICE — the sentence that explains a ranked candidate.
 *
 * This module exists because of a settled constraint, not a style preference. A ranked list of
 * option structures is one sentence away from reading as a personal recommendation, and this app
 * is educational and paper-only. So every explanation it produces is assembled from FIXED
 * TEMPLATES describing what the structure does — where it makes money, by when, and what it can
 * lose — and there is no path through this file that emits a second-person instruction. There is
 * no free text to drift: a phrase not written here cannot appear in the output.
 *
 * The line the templates hold:
 *
 * - **What it does, never what to do.** "Profits if NVDA is above $183.06" is a fact about a
 *   payoff curve. "Buy this" is a claim about the reader, which this app does not get to make.
 * - **Both sides of the trade, in the same breath.** A structure's upside never appears without
 *   its downside, and an uncapped loss is stated as uncapped rather than as the edge of a
 *   sampled band. A high probability of profit next to a hidden tail is the classic way an honest
 *   number tells a lie.
 * - **Every level in the sentence comes off the marked curve** (`structure-risk.ts`), so the prose
 *   and the numbers beside it cannot quietly disagree.
 *
 * PURE: no I/O, no clock, no locale lookup. The horizon is stated in days, exactly as it came in.
 */

/** Display names, in the order a chain quotes them. */
const STRUCTURE_LABELS: Readonly<Record<StructureKind, string>> = {
  "long-call": "Long call",
  "bull-call-spread": "Bull call spread",
  "short-put-spread": "Short put spread",
  "long-put": "Long put",
  "bear-put-spread": "Bear put spread",
  "short-call-spread": "Short call spread",
  "iron-condor": "Iron condor",
  "short-strangle": "Short strangle",
  "long-call-butterfly": "Long call butterfly",
};

/** Where on the price line the structure is above water at the horizon. */
type ProfitRegion =
  | { readonly kind: "above" | "below"; readonly level: number }
  | { readonly kind: "between" | "outside"; readonly low: number; readonly high: number }
  | { readonly kind: "everywhere" | "nowhere" }
  | { readonly kind: "banded"; readonly levels: readonly number[] };

/** Dollars, rounded to cents and grouped — a display string, never a number to compute on. */
function asDollars(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const grouped = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "−" : ""}$${grouped}`;
}

/** A price level, at the two decimals a strike or a break-even is quoted to. */
function asLevel(price: number): string {
  return asDollars(Math.round(price * 100) / 100);
}

/** "long 1 NVDA 180 call" — signed lots stated as long or short, never as buy or sell. */
function describeLeg(leg: OptionLeg, symbol: string): string {
  const side = leg.quantity >= 0 ? "long" : "short";
  const lots = Math.abs(leg.quantity);
  return `${side} ${lots} ${symbol} ${leg.strike} ${leg.kind}`;
}

/** Read the profitable region off the marked curve, using the break-evens already found. */
function profitRegion(
  legs: readonly OptionLeg[],
  horizon: RiskHorizon,
  breakEvens: readonly number[],
): ProfitRegion {
  const isUp = (price: number): boolean => (structureProfitAt(legs, horizon, price) ?? -1) > 0;
  const low = breakEvens[0];
  const high = breakEvens[breakEvens.length - 1];
  if (low === undefined || high === undefined) {
    return { kind: isUp(horizon.spot) ? "everywhere" : "nowhere" };
  }
  if (breakEvens.length === 1) {
    return isUp(low * 0.5) ? { kind: "below", level: low } : { kind: "above", level: low };
  }
  if (breakEvens.length === 2) {
    return isUp((low + high) / 2) ? { kind: "between", low, high } : { kind: "outside", low, high };
  }
  return { kind: "banded", levels: breakEvens };
}

/** The clause that says where the structure is above water. */
function regionClause(region: ProfitRegion, symbol: string): string {
  switch (region.kind) {
    case "above":
      return `profits if ${symbol} is above ${asLevel(region.level)}`;
    case "below":
      return `profits if ${symbol} is below ${asLevel(region.level)}`;
    case "between":
      return `profits if ${symbol} is between ${asLevel(region.low)} and ${asLevel(region.high)}`;
    case "outside":
      return `profits if ${symbol} is outside ${asLevel(region.low)} to ${asLevel(region.high)}`;
    case "everywhere":
      return `is above break-even at every ${symbol} price the model reaches`;
    case "nowhere":
      return `does not reach break-even at any ${symbol} price the model reaches`;
    case "banded":
      return `profits inside bands bounded by ${region.levels.map(asLevel).join(", ")}`;
  }
}

/** "Most it can make" / "most it can lose", with uncapped stated as uncapped. */
function boundClause(label: string, bound: RiskBound): string {
  return bound.kind === "unbounded"
    ? `${label} is not capped`
    : `${label} is ${asDollars(bound.amount)}`;
}

/** Everything the sentence needs that isn't the structure itself. */
export interface MechanicsContext {
  readonly symbol: string;
  readonly horizon: RiskHorizon;
  /** ISO expiry date the legs share, when the chain carried one. */
  readonly expiration?: string;
}

/**
 * The mechanics sentence for one ranked candidate: what it is made of, where it makes money, by
 * when, and what it can make or lose. Assembled from the templates above — it states what the
 * structure does and never what the reader should do.
 */
export function describeMechanics(
  kind: StructureKind,
  legs: readonly OptionLeg[],
  risk: StructureRisk,
  context: MechanicsContext,
): string {
  const { symbol, horizon, expiration } = context;
  const label = STRUCTURE_LABELS[kind];
  const composition = legs.map((leg) => describeLeg(leg, symbol)).join(", ");
  const days = Math.round(horizon.daysForward);
  const dated = expiration === undefined ? "" : `, expiring ${expiration}`;
  const region = regionClause(profitRegion(legs, horizon, risk.breakEvens), symbol);
  const upside = boundClause("the most it can make", risk.maxProfit);
  const downside = boundClause("the most it can lose", risk.maxLoss);
  return (
    `${label} on ${symbol} — ${composition}${dated}. ` +
    `At ${days} days out it ${region}; ${upside} and ${downside}. ` +
    `Modelled mechanics only — educational, paper trading, not financial advice.`
  );
}
