/**
 * TERMINAL ODDS — where the underlying might BE, under the same model that prices the contracts.
 *
 * A payoff surface says what a structure is worth wherever the underlying goes. This module says
 * how likely each of those places is: the odds of FINISHING above or below a price, and the odds
 * of TOUCHING one at any point along the way. It shares `pricing.ts`'s Φ and its calendar-day
 * convention, so a risk graph and the odds printed beside it can never quietly disagree.
 *
 * Read these numbers narrowly:
 *
 * - They are **risk-neutral** probabilities under geometric Brownian motion — the same measure
 *   Black–Scholes prices in, log-drift `r − σ²/2`. That is a pricing convention, NOT a forecast
 *   of where the stock is going. "70% chance" here is the model's odds, never a promise.
 * - Constant volatility, no dividends, no jumps, no skew. Real tape gaps; this model does not.
 * - Φ is the Abramowitz–Stegun approximation (|error| ≲ 7.5e-8 absolute), so a far-tail number is
 *   directionally right and not accurate in relative terms. Never read a 1e-12 probability here.
 * - Pure: no I/O, no clock, no randomness. `undefined` means "no honest answer", never zero.
 */

import { DAYS_PER_YEAR, standardNormalCdf } from "./pricing.js";

/** Below this, σ·√T is the σ→0 limit: the underlying rides the forward with certainty. */
export const DEGENERATE_SIGMA_ROOT_T = 1e-12;

export interface TerminalProbabilityInput {
  readonly spot: number;
  /** The price being asked about — a strike, a break-even, a target. */
  readonly target: number;
  /** Calendar days forward; fractional allowed. */
  readonly daysForward: number;
  /** Annualized volatility of the UNDERLYING as a decimal — the forecast, not one leg's IV. */
  readonly volatility: number;
  /** Annualized risk-free rate as a decimal. Defaults to 0. */
  readonly rate?: number;
}

/** The lognormal terms every function here shares: log-drift over T, and σ·√T. */
export interface TerminalTerms {
  readonly years: number;
  readonly driftT: number;
  readonly sigmaRootT: number;
  readonly rate: number;
  readonly variance: number;
}

/**
 * The shared terminal distribution of the underlying at the horizon. `undefined` when the inputs
 * cannot describe one — a non-positive spot, a horizon in the past, negative uncertainty.
 */
export function terminalTerms(
  spot: number,
  daysForward: number,
  volatility: number,
  rate: number,
): TerminalTerms | undefined {
  if (!(Number.isFinite(spot) && spot > 0)) return undefined;
  if (!(Number.isFinite(daysForward) && daysForward >= 0)) return undefined;
  if (!(Number.isFinite(volatility) && volatility >= 0)) return undefined;
  if (!Number.isFinite(rate)) return undefined;
  const years = daysForward / DAYS_PER_YEAR;
  const variance = volatility * volatility;
  return {
    years,
    driftT: (rate - variance / 2) * years,
    sigmaRootT: volatility * Math.sqrt(years),
    rate,
    variance,
  };
}

/** A probability is a probability: no −0.0000001, no 1.0000001, and never a NaN in a percentage. */
export function clampProbability(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** P(S_T ≤ price) at the horizon these terms describe. */
export function terminalCdf(spot: number, terms: TerminalTerms, price: number): number {
  return clampProbability(
    standardNormalCdf((Math.log(price / spot) - terms.driftT) / terms.sigmaRootT),
  );
}

/** A validated question: a describable distribution AND a target price worth asking about. */
interface ResolvedTarget {
  readonly spot: number;
  readonly target: number;
  readonly rate: number;
  readonly terms: TerminalTerms;
}

/** Both public odds functions need exactly the same four things validated the same way. */
function resolveTarget(input: TerminalProbabilityInput): ResolvedTarget | undefined {
  const rate = input.rate ?? 0;
  const terms = terminalTerms(input.spot, input.daysForward, input.volatility, rate);
  if (!(terms && Number.isFinite(input.target) && input.target > 0)) return undefined;
  return { spot: input.spot, target: input.target, rate, terms };
}

/** P(S_T ≤ target) under the risk-neutral measure. */
export function probabilityBelow(input: TerminalProbabilityInput): number | undefined {
  const resolved = resolveTarget(input);
  if (!resolved) return undefined;
  const { spot, target, rate, terms } = resolved;
  if (terms.sigmaRootT <= DEGENERATE_SIGMA_ROOT_T) {
    // σ→0 (or zero days): the underlying arrives at the forward with certainty. At the knife edge
    // the forward counts as "at or below", which mirrors the pricing core's out-of-the-money side.
    return spot * Math.exp(rate * terms.years) <= target ? 1 : 0;
  }
  return terminalCdf(spot, terms, target);
}

/** P(S_T > target). The exact complement of `probabilityBelow`, degenerate cases included. */
export function probabilityAbove(input: TerminalProbabilityInput): number | undefined {
  const below = probabilityBelow(input);
  return below === undefined ? undefined : 1 - below;
}

/** e^exponent · φ, evaluated in log space so a far barrier underflows to 0 instead of Inf·0=NaN. */
function scaledTerm(exponent: number, phi: number): number {
  if (!(phi > 0)) return 0;
  const scaled = exponent + Math.log(phi);
  return scaled > 0 ? 1 : Math.exp(scaled);
}

/**
 * P(the underlying trades at `target` at ANY time before the horizon) — the first-passage
 * probability, from the reflection principle for Brownian motion with drift. Roughly twice the
 * probability of FINISHING there, which is exactly why a "safe" short strike is less safe than
 * its delta suggests: touching is what gets you assigned, not closing.
 */
export function probabilityOfTouch(input: TerminalProbabilityInput): number | undefined {
  const resolved = resolveTarget(input);
  if (!resolved) return undefined;
  const { spot, target, rate, terms } = resolved;

  const barrier = Math.log(target / spot);
  if (barrier === 0) return 1; // already there; a touch has happened at t=0
  if (terms.sigmaRootT <= DEGENERATE_SIGMA_ROOT_T) {
    // σ→0: the path is the deterministic forward curve, so it touches iff the barrier lies on it.
    const forward = spot * Math.exp(rate * terms.years);
    return target >= Math.min(spot, forward) && target <= Math.max(spot, forward) ? 1 : 0;
  }

  const reflection = (2 * terms.driftT * barrier) / (terms.variance * terms.years);
  const first =
    barrier > 0
      ? standardNormalCdf((terms.driftT - barrier) / terms.sigmaRootT)
      : standardNormalCdf((barrier - terms.driftT) / terms.sigmaRootT);
  const mirrored =
    barrier > 0
      ? standardNormalCdf((-barrier - terms.driftT) / terms.sigmaRootT)
      : standardNormalCdf((barrier + terms.driftT) / terms.sigmaRootT);
  return clampProbability(first + scaledTerm(reflection, mirrored));
}
