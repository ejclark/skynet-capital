import type { OptionPlayCode } from "../trading/option-economics.js";
import { DAYS_PER_YEAR, standardNormalCdf } from "./pricing.js";
import {
  DEGENERATE_SIGMA_ROOT_T,
  probabilityAbove,
  probabilityBelow,
  terminalTerms,
} from "./terminal-odds.js";

/**
 * SINGLE-LEG ODDS — the two numbers the order screen was missing (#3407 P2 slice 2; parity study
 * row 7): the chance a play finishes profitable at expiry, and what it is worth on average when
 * it does and when it doesn't, so "72% to win $1 vs 28% to lose $5" is legible at the moment of
 * commitment. Every reference desk prints the first; the study's ledger (#20) says never print it
 * without the second, because POP is not expectancy.
 *
 * Method, stated plainly: the underlying at expiry is lognormal under the risk-neutral measure
 * with the volatility handed in (the IV solved from the contract's own mid — `pricing.ts`);
 * chance of profit is the mass on the profitable side of the play's breakeven
 * (`terminal-odds.ts`); expected value is the payoff at expiry integrated against that density
 * on a log-uniform grid. It inherits every caveat of the modules underneath — constant vol, no
 * jumps, no early assignment, no dividends — and a covered call is priced against the shares'
 * P/L from today's spot, not the member's cost basis. Pure: no I/O, no clock. `undefined` means
 * "no honest answer", never zero.
 */

export interface SingleLegOddsInput {
  readonly code: OptionPlayCode;
  readonly strike: number;
  /** Premium per share the member will pay or receive. */
  readonly premium: number;
  readonly spot: number;
  readonly daysToExpiry: number;
  /** Annualized volatility as a decimal. */
  readonly volatility: number;
  readonly rate?: number;
}

export interface SingleLegOdds {
  /** P(the play finishes profitable at expiry), 0..1. */
  readonly chanceOfProfit: number;
  /** Expected P/L per share at expiry, dollars; multiply by contracts × 100 for the ticket. */
  readonly expectedValuePerShare: number;
}

/** Log-uniform samples across ±BAND_SIGMAS of the terminal distribution. */
const SAMPLES = 400;
const BAND_SIGMAS = 8;

/** The play's P/L per share at expiry, at one underlying price. */
export function payoffAtExpiry(
  code: OptionPlayCode,
  strike: number,
  premium: number,
  spot: number,
  price: number,
): number {
  switch (code) {
    case "201":
      return premium - Math.max(strike - price, 0);
    case "202":
      return Math.min(price, strike) - spot + premium;
    case "301":
      return Math.max(strike - price, 0) - premium;
    default:
      return Math.max(price - strike, 0) - premium;
  }
}

/** Where the play crosses zero P/L at expiry — the same breakeven `option-economics.ts` prints. */
function breakevenOf(code: OptionPlayCode, strike: number, premium: number, spot: number): number {
  if (code === "201" || code === "301") return strike - premium;
  if (code === "202") return spot - premium;
  return strike + premium;
}

function validInput(input: SingleLegOddsInput): boolean {
  const { strike, premium, spot, daysToExpiry, volatility } = input;
  return (
    Number.isFinite(strike) &&
    strike > 0 &&
    Number.isFinite(premium) &&
    premium >= 0 &&
    Number.isFinite(spot) &&
    spot > 0 &&
    Number.isFinite(daysToExpiry) &&
    daysToExpiry >= 0 &&
    Number.isFinite(volatility) &&
    volatility >= 0
  );
}

export function singleLegOdds(input: SingleLegOddsInput): SingleLegOdds | undefined {
  if (!validInput(input)) return undefined;
  const rate = input.rate ?? 0;
  const { code, strike, premium, spot } = input;
  const terms = terminalTerms(spot, input.daysToExpiry, input.volatility, rate);
  if (!terms) return undefined;
  const breakeven = breakevenOf(code, strike, premium, spot);
  if (!(breakeven > 0)) return undefined;
  const profitsAbove = code !== "301";
  const odds = {
    spot,
    target: breakeven,
    daysForward: input.daysToExpiry,
    volatility: input.volatility,
    rate,
  };
  const chanceOfProfit = profitsAbove ? probabilityAbove(odds) : probabilityBelow(odds);
  if (chanceOfProfit === undefined) return undefined;

  if (terms.sigmaRootT <= DEGENERATE_SIGMA_ROOT_T) {
    // No uncertainty left: the underlying arrives at the forward with certainty.
    const forward = spot * Math.exp(rate * terms.years);
    return {
      chanceOfProfit,
      expectedValuePerShare: payoffAtExpiry(code, strike, premium, spot, forward),
    };
  }
  // ∫ payoff(S) φ(u) du over u = ln S, midpoint rule on a log-uniform grid, each cell weighted by
  // the exact normal mass between its edges so the tails sum to one without a density fudge.
  const mean = Math.log(spot) + terms.driftT;
  const sd = terms.sigmaRootT;
  const lo = mean - BAND_SIGMAS * sd;
  const step = (2 * BAND_SIGMAS * sd) / SAMPLES;
  let ev = 0;
  let prevCdf = standardNormalCdf((lo - mean) / sd);
  for (let i = 0; i < SAMPLES; i += 1) {
    const edge = lo + (i + 1) * step;
    const cdf = standardNormalCdf((edge - mean) / sd);
    const mass = cdf - prevCdf;
    prevCdf = cdf;
    const mid = Math.exp(lo + (i + 0.5) * step);
    ev += mass * payoffAtExpiry(code, strike, premium, spot, mid);
  }
  return { chanceOfProfit, expectedValuePerShare: ev };
}

/** Calendar days from `now` to the option's 4 pm ET expiry, floored at a sliver so a same-day
 *  contract still has a describable distribution rather than a divide-by-zero. */
export function daysToExpiryFrom(expiration: string, now: Date): number | undefined {
  const at = Date.parse(`${expiration}T20:00:00Z`);
  if (Number.isNaN(at)) return undefined;
  return Math.max(0.01, (at - now.getTime()) / (DAYS_PER_YEAR / 365) / 86_400_000);
}
