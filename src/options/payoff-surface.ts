/**
 * PAYOFF SURFACE — what a HYPOTHETICAL structure would be worth across price × time × IV.
 *
 * thinkorswim's Risk Profile is the reference bar: P/L at ANY date, not just expiration, with an
 * independent volatility adjustment. This module is that engine's arithmetic — a pure, total
 * function from (legs, grid) to a surface of marks. Every option leg is priced through the one
 * shared core in `pricing.ts`; there is deliberately no second Black–Scholes in this repo.
 *
 * The honesty rules this module lives under:
 *
 * - **What-if only.** Every number here is a MODEL mark, never a quote, a fill, or a realised
 *   P/L. Real order economics stay in `src/trading/option-ticket.ts` and Alpaca's live quotes; a
 *   surface value must never be rendered as money that moved.
 * - **Absence renders as ABSENT.** Inputs that cannot describe a structure return `undefined`,
 *   never a zero-filled surface a chart would draw as a real, flat $0 line.
 * - Degenerate-but-describable inputs are NOT absences: zero volatility, zero days-forward, and a
 *   leg already past its expiry are analytic limits and always produce defined numbers, matching
 *   `pricing.ts`'s own contract.
 * - Every caveat of the pricing core carries over: European, dividend-free, constant-vol,
 *   continuous-rate. No early exercise, no dividends, no skew across strikes.
 * - **A leg past its expiry is marked at intrinsic against the SLICE price**, i.e. as though it
 *   settled there. A real leg settled at the price on its own expiry day, which a price × time
 *   grid cannot know — so a slice drawn past a front-month expiry is a sketch, not a settlement.
 */

import { SHARES_PER_CONTRACT } from "../trading/option-economics.js";
import { priceOption } from "./pricing.js";

/** One option leg of a hypothetical structure. Nothing here has been ordered or filled. */
export interface OptionLeg {
  readonly kind: "call" | "put";
  /** Signed CONTRACTS: `+2` is long two, `−1` is short one. */
  readonly quantity: number;
  readonly strike: number;
  /** Calendar days from the grid's origin (t=0) until this leg expires; fractional allowed. */
  readonly daysToExpiry: number;
  /** Annualized implied volatility for this leg as a decimal — 0.32 is 32%. */
  readonly volatility: number;
  /** Premium per share paid (long) or received (short) to open it. */
  readonly entryPrice: number;
}

/** A share leg — the stock half of a covered call, a collar, or a synthetic. */
export interface StockLeg {
  readonly kind: "stock";
  /** Signed SHARES: `+100` is long a round lot, `−100` short one. */
  readonly quantity: number;
  /** Price per share paid (long) or received (short) to open it. */
  readonly entryPrice: number;
}

export type StructureLeg = OptionLeg | StockLeg;

/** One point in the what-if space: where the underlying is, how far forward, and what IV did. */
export interface StructureMark {
  readonly spot: number;
  /** Calendar days forward from t=0. `0` is today; fractional allowed. */
  readonly daysForward: number;
  /** Additive shift on EVERY option leg's vol, in decimal (0.05 = +5 vol points). Default 0. */
  readonly volatilityShift?: number;
  /** Annualized risk-free rate as a decimal. Defaults to 0. */
  readonly rate?: number;
}

export interface PayoffGrid {
  /** Underlying prices to evaluate, in the order the caller wants them back. */
  readonly prices: readonly number[];
  /** Calendar days forward to evaluate — the "any date" axis, not just expiration. */
  readonly daysForward: readonly number[];
  /** The independent IV adjustment, applied to every option leg. Default 0. */
  readonly volatilityShift?: number;
  readonly rate?: number;
}

export interface PayoffPoint {
  readonly price: number;
  readonly daysForward: number;
  /** Mark-to-model dollar value of the whole structure at this point. */
  readonly value: number;
  /** `value − entryCost`: dollars made or lost versus what opening it cost. */
  readonly profit: number;
}

export interface PayoffSurface {
  readonly prices: readonly number[];
  readonly daysForward: readonly number[];
  /** One row per `daysForward`, each holding one point per `prices`, both in the given order. */
  readonly rows: readonly (readonly PayoffPoint[])[];
  /** Dollars to open: positive is a net debit paid, negative a net credit received. */
  readonly entryCost: number;
}

/** Options settle 100 shares a contract; a stock leg is already counted in shares. */
function legMultiplier(leg: StructureLeg): number {
  return leg.kind === "stock" ? 1 : SHARES_PER_CONTRACT;
}

/** Can this leg describe a contract at all? Zero vol and a past expiry are limits, not absences. */
function isUsableLeg(leg: StructureLeg): boolean {
  if (!(Number.isFinite(leg.quantity) && Number.isFinite(leg.entryPrice))) return false;
  if (leg.kind === "stock") return true;
  return (
    Number.isFinite(leg.strike) &&
    leg.strike > 0 &&
    Number.isFinite(leg.daysToExpiry) &&
    Number.isFinite(leg.volatility)
  );
}

/**
 * Net dollars to open the structure — positive is a debit paid, negative a credit received. This
 * is the zero line every profit number on the surface is measured from. `undefined` for an empty
 * or undescribable structure, because "no legs" has no cost, it has no meaning.
 */
export function structureEntryCost(legs: readonly StructureLeg[]): number | undefined {
  if (legs.length === 0) return undefined;
  let total = 0;
  for (const leg of legs) {
    if (!isUsableLeg(leg)) return undefined;
    total += leg.quantity * legMultiplier(leg) * leg.entryPrice;
  }
  return total;
}

/**
 * Mark the whole structure at one point in price × time × IV space, in dollars. Signed: a short
 * structure marks negative, which is exactly the liability it represents. `undefined` when any
 * leg or the mark itself cannot describe a contract — an honest absence, never a fake zero.
 */
export function structureValue(
  legs: readonly StructureLeg[],
  mark: StructureMark,
): number | undefined {
  const { spot, daysForward } = mark;
  const rate = mark.rate ?? 0;
  const shift = mark.volatilityShift ?? 0;
  if (legs.length === 0) return undefined;
  if (!(Number.isFinite(spot) && spot > 0)) return undefined;
  if (!(Number.isFinite(daysForward) && Number.isFinite(rate) && Number.isFinite(shift))) {
    return undefined;
  }

  let total = 0;
  for (const leg of legs) {
    if (!isUsableLeg(leg)) return undefined;
    if (leg.kind === "stock") {
      total += leg.quantity * spot;
      continue;
    }
    // A big downward what-if can push a leg's vol below zero. Clamp to the σ→0 limit rather than
    // invent a negative uncertainty — there is no such thing as less than zero of it.
    const volatility = Math.max(0, leg.volatility + shift);
    const valuation = priceOption({
      spot,
      strike: leg.strike,
      daysToExpiry: leg.daysToExpiry - daysForward,
      volatility,
      rate,
      type: leg.kind,
    });
    if (!valuation) return undefined;
    total += leg.quantity * SHARES_PER_CONTRACT * valuation.price;
  }
  return total;
}

/**
 * The surface itself: a value and a profit at every (price, daysForward) the grid asks for. This
 * is the whole point of the module — a structure's life is a surface, not the single
 * expiration-day number a canned trade type reports. `undefined` if the structure or any point on
 * the grid is undescribable, so a caller can render ABSENT rather than a misleading plane.
 */
export function payoffSurface(
  legs: readonly StructureLeg[],
  grid: PayoffGrid,
): PayoffSurface | undefined {
  const entryCost = structureEntryCost(legs);
  if (entryCost === undefined) return undefined;
  if (grid.prices.length === 0 || grid.daysForward.length === 0) return undefined;

  const rows: PayoffPoint[][] = [];
  for (const daysForward of grid.daysForward) {
    const row: PayoffPoint[] = [];
    for (const price of grid.prices) {
      const value = structureValue(legs, {
        spot: price,
        daysForward,
        volatilityShift: grid.volatilityShift,
        rate: grid.rate,
      });
      if (value === undefined) return undefined;
      row.push({ price, daysForward, value, profit: value - entryCost });
    }
    rows.push(row);
  }
  return {
    prices: [...grid.prices],
    daysForward: [...grid.daysForward],
    rows,
    entryCost,
  };
}
