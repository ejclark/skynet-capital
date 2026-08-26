import type { IvAbsence, IvReading } from "../research/iv-rank.js";
import { DAYS_PER_YEAR } from "./pricing.js";

/**
 * THE OUTLOOK — a stated forecast, expressed in the model's own units.
 *
 * IBKR's Strategy Lab and tastytrade's bullish/bearish/neutral filter both start here: a human
 * says where they think a name is going, and the machine answers with structures that would pay
 * if that happened. This module is the vocabulary half of that — it turns a plain view
 * ("moderately bullish on NVDA over the next month") into the two numbers candidate generation
 * actually needs: an expected move, and the price the view implies.
 *
 * The translation is deliberately MECHANICAL, not clever:
 *
 * - **Magnitude is measured in expected moves, never in dollars or percent.** One expected move is
 *   `spot · σ · √T` — the same σ that prices the contracts and the same calendar-day convention
 *   `pricing.ts` uses, so a "moderate" view on a 20-vol utility and on an 80-vol small cap mean
 *   the same thing about *surprise*, not the same thing about distance.
 * - **A neutral view reads magnitude differently, and says so.** For a directional view magnitude
 *   is how FAR the underlying travels. For a neutral view nothing travels, so magnitude is how
 *   TIGHTLY the range is expected to hold — a stronger neutral conviction sells closer strikes.
 *   Collapsing those two readings into one number is how a "strong" neutral view would otherwise
 *   come out meaning "strong move", which is the opposite of what was said.
 * - **This module forecasts nothing.** It restates a forecast a human supplied. σ here is the
 *   caller's uncertainty about the outcome, not a prediction that the outcome is likely.
 *
 * PURE: no I/O, no clock, no randomness. `undefined` means "no honest answer", never zero.
 */

/** Which way the view points. The three tastytrade exposes, and the three a chain can express. */
export type OutlookDirection = "bullish" | "bearish" | "neutral";

/** How hard the view is held. Read as distance when directional, as tightness when neutral. */
export type OutlookMagnitude = "slight" | "moderate" | "strong";

/** A stated view on one underlying over one horizon. Nothing here has been ordered or filled. */
export interface Outlook {
  /** The UNDERLYING's ticker (e.g. "NVDA") — never an OCC option symbol. */
  readonly symbol: string;
  readonly direction: OutlookDirection;
  readonly magnitude: OutlookMagnitude;
  /** Calendar days over which the view is held; fractional allowed. */
  readonly horizonDays: number;
}

/** What the market looks like right now, as far as ranking needs to know. */
export interface UnderlyingContext {
  readonly spot: number;
  /**
   * Annualized volatility of the UNDERLYING as a decimal, used to build the terminal
   * distribution — the caller's uncertainty about the outcome, not one leg's quoted IV.
   */
  readonly volatility: number;
  /** Annualized risk-free rate as a decimal. Defaults to 0. */
  readonly rate?: number;
  /** Where today's IV sits in its own history. ABSENT when history cannot support a rank. */
  readonly ivReading?: IvReading;
}

/**
 * One quotable contract off the chain. Both `volatility` and `price` are optional because both are
 * genuinely missing sometimes — a thin listing with no two-sided market, a snapshot feed that
 * carries a mid but no solved IV. A candidate that needs a contract missing either is reported
 * ABSENT with that reason, never priced off a substituted number.
 */
export interface ChainContract {
  readonly kind: "call" | "put";
  readonly strike: number;
  /** Calendar days from today until this contract expires; fractional allowed. */
  readonly daysToExpiry: number;
  /** ISO date the contract expires, e.g. "2026-09-18" — carried so an explanation can name it. */
  readonly expiration?: string;
  /** Annualized implied volatility as a decimal. ABSENT when the feed did not report it. */
  readonly volatility?: number;
  /** Mid premium per share. ABSENT when the contract has no honest two-sided quote. */
  readonly price?: number;
}

/**
 * How many expected moves each magnitude means for a DIRECTIONAL view. Defensible, not tuned:
 * roughly a half, a whole and a bit under two standard deviations, which is the span a desk means
 * by "a drift", "a real move" and "a repricing". They have not been fitted against this app's own
 * chains — named constants precisely so that pass is one edit in one place.
 */
export const MAGNITUDE_SIGMAS: Readonly<Record<OutlookMagnitude, number>> = {
  slight: 0.5,
  moderate: 1,
  strong: 1.75,
};

/**
 * How far out a strike the view expects to HOLD is placed, in expected moves — a neutral view's
 * two short strikes, and the short strike of a directional credit spread (the side the view says
 * price will not reach). Deliberately the inverse ordering of `MAGNITUDE_SIGMAS`: stronger
 * conviction that a boundary holds means selling closer to the money, not further from it.
 */
export const BOUNDARY_SIGMAS: Readonly<Record<OutlookMagnitude, number>> = {
  slight: 1.5,
  moderate: 1,
  strong: 0.75,
};

/**
 * One expected move in DOLLARS over the horizon — `spot · σ · √(days/365)`. `undefined` when the
 * context cannot describe a distribution at all, or when σ·√T collapses to nothing: a zero-move
 * world has no "moderately bullish" in it, and returning 0 would silently stack every candidate's
 * strikes on top of each other.
 */
export function expectedMove(context: UnderlyingContext, horizonDays: number): number | undefined {
  const { spot, volatility } = context;
  if (!(Number.isFinite(spot) && spot > 0)) return undefined;
  if (!(Number.isFinite(volatility) && volatility > 0)) return undefined;
  if (!(Number.isFinite(horizonDays) && horizonDays > 0)) return undefined;
  const move = spot * volatility * Math.sqrt(horizonDays / DAYS_PER_YEAR);
  return move > 0 ? move : undefined;
}

/** The floor a downside target is clamped to, as a fraction of spot. A total wipe-out is not a view. */
const MIN_TARGET_FRACTION = 0.01;

/**
 * The price the view points at: `spot ± k · expectedMove` for a directional view, and `spot`
 * itself for a neutral one (a neutral view's claim is that the price stays where it is).
 * `undefined` whenever the expected move is, and never a negative price — a view far enough down
 * to imply a sub-zero underlying is clamped to a floor rather than reported as nonsense.
 */
export function outlookTarget(outlook: Outlook, context: UnderlyingContext): number | undefined {
  const move = expectedMove(context, outlook.horizonDays);
  if (move === undefined) return undefined;
  if (outlook.direction === "neutral") return context.spot;
  const sigmas = MAGNITUDE_SIGMAS[outlook.magnitude];
  const signed = outlook.direction === "bullish" ? sigmas * move : -sigmas * move;
  // A price cannot go below zero; a 3σ-down view on a low-vol name would otherwise anchor a strike
  // at a negative number and quietly snap to the chain's lowest strike as though that were the ask.
  return Math.max(context.spot * MIN_TARGET_FRACTION, context.spot + signed);
}

/** Is option premium expensive, ordinary, or cheap for this name right now? */
export type VolRegime = "rich" | "middling" | "cheap";

/** Why no regime could be read. `no-iv-history` is this module's own; the rest are `iv-rank`'s. */
export type VolRegimeAbsence = IvAbsence | "no-iv-history";

export type VolRegimeReading =
  | { readonly kind: "regime"; readonly regime: VolRegime; readonly rank: number }
  | { readonly kind: "absent"; readonly reason: VolRegimeAbsence };

/**
 * IV-rank cut points, in rank units (0–100). Defensible, not tuned: the desk convention that
 * premium above the middle of its own year is worth selling and premium in the bottom quarter is
 * worth owning. tastytrade teaches a single line near 30; splitting it into two leaves an explicit
 * middling band rather than forcing every name into one of two camps.
 */
export const RICH_IV_RANK = 50;
export const CHEAP_IV_RANK = 25;

/**
 * Read the vol regime off an IV reading. ABSENT with a named reason whenever the rank is absent —
 * a candidate whose vol fit is unknown is ranked on its other components with the term dropped,
 * never on a middling default that would read as "checked, and it's fine".
 */
export function volatilityRegime(reading: IvReading | undefined): VolRegimeReading {
  if (!reading) return { kind: "absent", reason: "no-iv-history" };
  if (reading.rank.kind === "absent") return { kind: "absent", reason: reading.rank.reason };
  const rank = reading.rank.value;
  if (rank >= RICH_IV_RANK) return { kind: "regime", regime: "rich", rank };
  if (rank <= CHEAP_IV_RANK) return { kind: "regime", regime: "cheap", rank };
  return { kind: "regime", regime: "middling", rank };
}
