/**
 * PROBABILITY OF PROFIT — will this hypothetical structure actually make money?
 *
 * `terminal-odds.ts` says where the underlying might be; `payoff-surface.ts` says what the
 * structure is worth there. This module multiplies the two together: it finds every break-even
 * the structure has and totals the lognormal probability mass sitting on the profitable side.
 * That is the POP number a risk graph prints beside the curve.
 *
 * The method, stated plainly so nobody mistakes it for a closed form:
 *
 * - The structure is marked at ~240 log-uniform prices spanning ±8σ, with every strike inserted
 *   so no kink is stepped over, then each break-even is pinned by bisection between the two
 *   samples that straddle it. For the piecewise payoffs options actually make, that is exact to
 *   floating point; a pathological structure that flips sign twice inside one sampled interval
 *   would be missed, which is why the samples are dense and the strikes are forced in.
 * - It inherits every caveat of the two modules underneath — risk-neutral, constant-vol, no
 *   jumps, and a leg past its expiry marked at intrinsic against the slice price.
 * - **POP is not expectancy.** A 90%-POP structure that loses 10× when it loses is a bad trade.
 *   Never render this number without the loss it is paired with.
 * - Pure: no I/O, no clock, no randomness. `undefined` means "no honest answer", never zero.
 */

import { type StructureLeg, structureEntryCost, structureValue } from "./payoff-surface.js";
import {
  clampProbability,
  DEGENERATE_SIGMA_ROOT_T,
  type TerminalTerms,
  terminalCdf,
  terminalTerms,
} from "./terminal-odds.js";

/** Log-uniform sample points across the terminal band when hunting profit boundaries. */
const PROFIT_SAMPLES = 240;
/** How far out the sampling band reaches; beyond 8σ the remaining mass is ~1e-15. */
const BAND_SIGMAS = 8;
/** Bisection steps used to pin a break-even between two sampled prices. */
const BOUNDARY_STEPS = 60;

export interface ProfitProbabilityInput {
  readonly spot: number;
  /** Calendar days forward at which the structure is marked and the odds are taken. */
  readonly daysForward: number;
  /** Annualized volatility of the UNDERLYING, used to build the terminal distribution. */
  readonly volatility: number;
  readonly rate?: number;
  /** IV shift applied to the LEGS when marking them at the horizon (see `payoff-surface`). */
  readonly volatilityShift?: number;
}

/** The structure's P/L at one price; `undefined` when it cannot be marked there. */
type ProfitEvaluator = (price: number) => number | undefined;
/** P(S_T ≤ price) for the horizon being integrated over. */
type PriceProbability = (price: number) => number;

/** The structure's modelled P/L at the horizon, in dollars, at one underlying price. */
function profitAt(
  legs: readonly StructureLeg[],
  price: number,
  input: ProfitProbabilityInput,
  entryCost: number,
): number | undefined {
  const value = structureValue(legs, {
    spot: price,
    daysForward: input.daysForward,
    volatilityShift: input.volatilityShift,
    rate: input.rate,
  });
  return value === undefined ? undefined : value - entryCost;
}

/** Log-uniform prices across ±8σ, with every strike inserted so no kink is stepped over. */
function samplePrices(legs: readonly StructureLeg[], terms: TerminalTerms, spot: number): number[] {
  const centre = Math.log(spot) + terms.driftT;
  const half = BAND_SIGMAS * terms.sigmaRootT;
  const prices: number[] = [];
  for (let step = 0; step <= PROFIT_SAMPLES; step += 1) {
    prices.push(Math.exp(centre - half + (2 * half * step) / PROFIT_SAMPLES));
  }
  for (const leg of legs) {
    if (leg.kind !== "stock") prices.push(leg.strike);
  }
  return [...new Set(prices)].filter((price) => price > 0).sort((a, b) => a - b);
}

/** Mark the structure at every sampled price. `undefined` if any one of them cannot be marked. */
function sampleProfits(prices: readonly number[], evaluate: ProfitEvaluator): number[] | undefined {
  const profits: number[] = [];
  for (const price of prices) {
    const profit = evaluate(price);
    if (profit === undefined) return undefined;
    profits.push(profit);
  }
  return profits;
}

/** Pin the price where profit crosses zero between two samples that straddle it. */
function bisectBoundary(
  low: number,
  high: number,
  lowIsProfitable: boolean,
  evaluate: ProfitEvaluator,
): number {
  let a = low;
  let b = high;
  for (let step = 0; step < BOUNDARY_STEPS; step += 1) {
    const mid = (a + b) / 2;
    const profit = evaluate(mid);
    if (profit === undefined) return mid;
    if (profit >= 0 === lowIsProfitable) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
}

/** The profitable share of one sampled interval, splitting it at the break-even if it straddles. */
function segmentMass(
  low: number,
  high: number,
  lowProfit: number,
  highProfit: number,
  cdf: PriceProbability,
  evaluate: ProfitEvaluator,
): number {
  if (lowProfit >= 0 && highProfit >= 0) return cdf(high) - cdf(low);
  if (lowProfit < 0 && highProfit < 0) return 0;
  const edge = bisectBoundary(low, high, lowProfit >= 0, evaluate);
  return lowProfit >= 0 ? cdf(edge) - cdf(low) : cdf(high) - cdf(edge);
}

/** Walk the sampled band and total the mass sitting on the profitable side of break-even. */
function profitableMass(
  prices: readonly number[],
  profits: readonly number[],
  cdf: PriceProbability,
  evaluate: ProfitEvaluator,
): number {
  let mass = 0;
  for (let index = 0; index + 1 < prices.length; index += 1) {
    const low = prices[index];
    const high = prices[index + 1];
    const lowProfit = profits[index];
    const highProfit = profits[index + 1];
    if (low === undefined || high === undefined) continue;
    if (lowProfit === undefined || highProfit === undefined) continue;
    mass += segmentMass(low, high, lowProfit, highProfit, cdf, evaluate);
  }
  return mass;
}

/** The two tails past ±8σ: ~1e-15 of mass, counted anyway so the total is honest. */
function tailMass(
  prices: readonly number[],
  profits: readonly number[],
  cdf: PriceProbability,
): number {
  const first = prices[0];
  const last = prices[prices.length - 1];
  const firstProfit = profits[0];
  const lastProfit = profits[profits.length - 1];
  let mass = 0;
  if (first !== undefined && firstProfit !== undefined && firstProfit >= 0) mass += cdf(first);
  if (last !== undefined && lastProfit !== undefined && lastProfit >= 0) mass += 1 - cdf(last);
  return mass;
}

/**
 * Probability that the structure is at or above break-even at the horizon. Always in [0,1];
 * `undefined` when the structure or the distribution cannot be described, so a caller renders
 * ABSENT rather than a 0% that would read as "this cannot win".
 */
export function probabilityOfProfit(
  legs: readonly StructureLeg[],
  input: ProfitProbabilityInput,
): number | undefined {
  const { spot, daysForward, volatility } = input;
  const rate = input.rate ?? 0;
  const entryCost = structureEntryCost(legs);
  const terms = terminalTerms(spot, daysForward, volatility, rate);
  if (entryCost === undefined || !terms) return undefined;
  const evaluate: ProfitEvaluator = (price) => profitAt(legs, price, input, entryCost);

  if (terms.sigmaRootT <= DEGENERATE_SIGMA_ROOT_T) {
    // σ→0 (or a zero-day horizon): one certain outcome, so the odds are 1 or 0, never in between.
    const certain = evaluate(spot * Math.exp(rate * terms.years));
    if (certain === undefined) return undefined;
    return certain >= 0 ? 1 : 0;
  }

  const prices = samplePrices(legs, terms, spot);
  const profits = sampleProfits(prices, evaluate);
  if (!profits) return undefined;

  const cdf: PriceProbability = (price) => terminalCdf(spot, terms, price);
  return clampProbability(
    profitableMass(prices, profits, cdf, evaluate) + tailMass(prices, profits, cdf),
  );
}
