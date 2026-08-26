/**
 * OPTIONS PRICING — Black–Scholes valuation for HYPOTHETICAL, what-if contracts ONLY.
 *
 * This module answers "what would this contract be worth if…" for teaching surfaces, payoff
 * sketches and bot reasoning. It is deliberately NOT an order-pricing path, and must never
 * become one:
 *
 * - **Real order pricing stays Alpaca's live quotes** (`src/alpaca/alpaca-options-client.ts`
 *   bid/ask/greeks) and the ticket's own arithmetic (`src/trading/option-ticket.ts`). A model
 *   price must never be rendered as a market price, a fill price, or a P/L number — that would
 *   dress an estimate as a print and break the SIM/LIVE honesty invariant.
 * - The model is European, dividend-free, constant-vol, continuous-rate. Real US equity options
 *   are American and plenty of underlyings pay dividends, so every number here is an ESTIMATE
 *   with a known bias (it under-prices an American put, and any option on a dividend payer).
 *   Early exercise is not modelled.
 * - Φ uses the Abramowitz–Stegun 7.1.26 approximation: |error| ≲ 7.5e-8 **absolute**. That is
 *   far inside anything a what-if surface renders, but the far tails are not accurate in
 *   *relative* terms — never read a 1e-12 probability off this.
 * - Pure: no I/O, no clock, no randomness. The caller supplies days-to-expiry.
 *
 * Absence renders as absent: `priceOption` returns `undefined` when the inputs cannot describe a
 * contract at all, rather than a zero-filled valuation that a surface would show as a real $0.
 */

import type { OptionType } from "../trading/option-symbols.js";

/**
 * Calendar-day year. Options decay on the calendar, not the trading tape. Exported so the
 * probability engine annualizes on exactly the same convention this model discounts on — two
 * day-count conventions in one repo is how a surface and its odds quietly stop agreeing.
 */
export const DAYS_PER_YEAR = 365;
/** Solver search band for annualized vol: 0.0001% to 500%. */
const MIN_VOLATILITY = 1e-6;
const MAX_VOLATILITY = 5;
/** Below this, σ·√T is treated as the σ→0 limit rather than divided by. */
const MIN_SIGMA_ROOT_T = 1e-12;
const NEWTON_MAX_ITERATIONS = 20;
const BISECTION_MAX_ITERATIONS = 80;
/** Premium agreement that counts as solved, in dollars per share. */
const PRICE_TOLERANCE = 1e-10;
/** Below this slope Newton's step is meaningless, so we hand off to bisection. */
const VEGA_FLOOR = 1e-10;
/** A solution this close to the 500% ceiling is a pinned bound, not an answer. */
const PIN_TOLERANCE = 1e-9;

// Abramowitz & Stegun 7.1.26 — erf on the non-negative half line.
const ERF_P = 0.3275911;
const ERF_A1 = 0.254829592;
const ERF_A2 = -0.284496736;
const ERF_A3 = 1.421413741;
const ERF_A4 = -1.453152027;
const ERF_A5 = 1.061405429;

export interface OptionPricingInput {
  readonly spot: number;
  readonly strike: number;
  /** Calendar days until expiry; fractional allowed. 0 or less = expiring now. */
  readonly daysToExpiry: number;
  /** Annualized implied volatility as a decimal — 0.32 is 32%. */
  readonly volatility: number;
  /** Annualized risk-free rate as a decimal — 0.05 is 5%. Defaults to 0. */
  readonly rate?: number;
  readonly type: OptionType;
}

/**
 * Desk conventions, stated per field because the units are the classic downstream bug: theta is
 * per CALENDAR DAY, vega and rho are per ONE POINT (0.01) of vol and rate respectively.
 */
export interface OptionGreeks {
  /** Price change per $1 of spot. Calls (0,1); puts (−1,0). */
  readonly delta: number;
  /** Delta change per $1 of spot. Identical for a call and a put at the same strike. */
  readonly gamma: number;
  /** Dollars per share per CALENDAR DAY. Negative = decay for a long option. */
  readonly theta: number;
  /** Dollars per share per 1 VOLATILITY POINT (0.01 of σ). */
  readonly vega: number;
  /** Dollars per share per 1 RATE POINT (0.01 of r). */
  readonly rho: number;
}

export interface OptionValuation extends OptionGreeks {
  /** Theoretical premium per share. */
  readonly price: number;
  /** What the contract is worth if it expired right now, floored at 0. */
  readonly intrinsic: number;
  /** The time-value slice: `price − intrinsic`, floored at 0. */
  readonly extrinsic: number;
}

export interface ImpliedVolInput {
  readonly spot: number;
  readonly strike: number;
  readonly daysToExpiry: number;
  /** Annualized risk-free rate as a decimal. Defaults to 0. */
  readonly rate?: number;
  readonly type: OptionType;
  /** Observed premium per share. */
  readonly marketPrice: number;
}

/**
 * Φ(x), the standard normal CDF. Computed on |x| and mirrored, so `Φ(x) + Φ(−x) === 1` holds by
 * construction — which is what keeps put–call parity an invariant of this module rather than an
 * approximation of one. Exported because the probability/payoff engine needs the same Φ.
 */
export function standardNormalCdf(x: number): number {
  if (Number.isNaN(x)) return Number.NaN;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + ERF_P * z);
  const poly = t * (ERF_A1 + t * (ERF_A2 + t * (ERF_A3 + t * (ERF_A4 + t * ERF_A5))));
  // tail === 0.5·(1 − erf(z)) === Φ(−|x|)
  const tail = 0.5 * poly * Math.exp(-z * z);
  return x >= 0 ? 1 - tail : tail;
}

/** φ(x), the standard normal density. */
function standardNormalPdf(x: number): number {
  return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** The four Φ/φ terms every Greek is built from, with the σ→0 limit taken analytically. */
interface ModelTerms {
  readonly nd1: number;
  readonly nd2: number;
  readonly pdf1: number;
  readonly gamma: number;
}

function modelTerms(
  spot: number,
  strike: number,
  years: number,
  volatility: number,
  rate: number,
): ModelTerms {
  const sigmaRootT = volatility * Math.sqrt(years);
  if (!(sigmaRootT > MIN_SIGMA_ROOT_T)) {
    // σ→0: the contract settles at the forward with certainty, so Φ collapses to an indicator and
    // φ to zero. Exactly at-the-forward we take the out-of-the-money side; it is a knife edge.
    const inTheMoneyForward = spot * Math.exp(rate * years) > strike ? 1 : 0;
    return { nd1: inTheMoneyForward, nd2: inTheMoneyForward, pdf1: 0, gamma: 0 };
  }
  const d1 =
    (Math.log(spot / strike) + (rate + (volatility * volatility) / 2) * years) / sigmaRootT;
  const d2 = d1 - sigmaRootT;
  const pdf1 = standardNormalPdf(d1);
  return {
    nd1: standardNormalCdf(d1),
    nd2: standardNormalCdf(d2),
    pdf1,
    gamma: pdf1 / (spot * sigmaRootT),
  };
}

/** At or past expiry there is no time value left: price is intrinsic and only delta survives. */
function expiredValuation(
  spot: number,
  strike: number,
  isCall: boolean,
  intrinsic: number,
): OptionValuation {
  const inTheMoney = isCall ? spot > strike : spot < strike;
  const sign = isCall ? 1 : -1;
  return {
    price: intrinsic,
    intrinsic,
    extrinsic: 0,
    delta: inTheMoney ? sign : 0,
    gamma: 0,
    theta: 0,
    vega: 0,
    rho: 0,
  };
}

/**
 * Theoretical value plus the full Greek set. `undefined` when the inputs cannot describe a
 * contract (non-finite, or a non-positive spot or strike) — an honest absence, never a fake zero.
 * Zero days-to-expiry and zero volatility are NOT absences: both are defined analytic limits and
 * always return a valuation. A negative volatility or a past expiry collapses onto the same limit
 * rather than inventing a number — there is no such thing as less than zero uncertainty.
 */
export function priceOption(input: OptionPricingInput): OptionValuation | undefined {
  const { spot, strike, daysToExpiry, volatility, type } = input;
  const rate = input.rate ?? 0;
  if (!(isPositiveFinite(spot) && isPositiveFinite(strike))) return undefined;
  if (!(Number.isFinite(daysToExpiry) && Number.isFinite(volatility) && Number.isFinite(rate))) {
    return undefined;
  }

  const isCall = type === "call";
  const intrinsic = Math.max(0, isCall ? spot - strike : strike - spot);
  const years = daysToExpiry / DAYS_PER_YEAR;
  if (years <= 0) return expiredValuation(spot, strike, isCall, intrinsic);

  const discount = Math.exp(-rate * years);
  const rootT = Math.sqrt(years);
  const { nd1, nd2, pdf1, gamma } = modelTerms(spot, strike, years, volatility, rate);
  // Φ(−d) is written as `1 − Φ(d)` so the mirrored CDF makes put–call parity fall out exactly.
  const price = isCall
    ? spot * nd1 - strike * discount * nd2
    : strike * discount * (1 - nd2) - spot * (1 - nd1);
  const decay = (-spot * pdf1 * volatility) / (2 * rootT);
  const theta = isCall
    ? (decay - rate * strike * discount * nd2) / DAYS_PER_YEAR
    : (decay + rate * strike * discount * (1 - nd2)) / DAYS_PER_YEAR;

  return {
    price,
    intrinsic,
    extrinsic: Math.max(0, price - intrinsic),
    delta: isCall ? nd1 : nd1 - 1,
    gamma,
    theta,
    vega: (spot * pdf1 * rootT) / 100,
    rho: isCall
      ? (strike * years * discount * nd2) / 100
      : (-strike * years * discount * (1 - nd2)) / 100,
  };
}

type Pricer = (volatility: number) => OptionValuation | undefined;

/** Newton–Raphson on premium. Bails the moment the slope collapses or a step leaves the band. */
function solveByNewton(price: Pricer, quote: number, seed: number): number | undefined {
  let sigma = Math.min(MAX_VOLATILITY, Math.max(MIN_VOLATILITY, seed));
  for (let step = 0; step < NEWTON_MAX_ITERATIONS; step += 1) {
    const point = price(sigma);
    if (!point) return undefined;
    const gap = point.price - quote;
    if (Math.abs(gap) < PRICE_TOLERANCE) return sigma;
    const slope = point.vega * 100; // vega is per point; Newton needs per unit of σ
    if (!(slope > VEGA_FLOOR)) return undefined;
    const next = sigma - gap / slope;
    if (!(next >= MIN_VOLATILITY && next <= MAX_VOLATILITY)) return undefined;
    sigma = next;
  }
  return undefined;
}

/** Bisection over the whole band. Premium is monotone in σ, so a bracketed root is always found. */
function solveByBisection(price: Pricer, quote: number): number | undefined {
  let low = MIN_VOLATILITY;
  let high = MAX_VOLATILITY;
  for (let step = 0; step < BISECTION_MAX_ITERATIONS; step += 1) {
    const mid = (low + high) / 2;
    const point = price(mid);
    if (!point) return undefined;
    const gap = point.price - quote;
    if (Math.abs(gap) < PRICE_TOLERANCE) return mid;
    if (gap > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return undefined;
}

/**
 * Solve for the annualized volatility that reproduces an observed premium. Bounded iterations and
 * NEVER throws: `undefined` means "no honest answer" — a no-arbitrage violation, an expired
 * contract, unusable inputs, or a search that would only pin the 500% ceiling. A pinned bound is
 * a fabricated number, so we decline to return it.
 */
export function impliedVolatility(input: ImpliedVolInput): number | undefined {
  const { spot, strike, daysToExpiry, type, marketPrice } = input;
  const rate = input.rate ?? 0;
  if (!(isPositiveFinite(spot) && isPositiveFinite(strike) && isPositiveFinite(marketPrice))) {
    return undefined;
  }
  if (!(isPositiveFinite(daysToExpiry) && Number.isFinite(rate))) return undefined;

  const years = daysToExpiry / DAYS_PER_YEAR;
  const discount = Math.exp(-rate * years);
  const isCall = type === "call";
  // No-arbitrage band: below the discounted intrinsic floor or at/above the ceiling, no σ in the
  // search band reproduces the premium.
  const floor = Math.max(0, isCall ? spot - strike * discount : strike * discount - spot);
  const ceiling = isCall ? spot : strike * discount;
  if (marketPrice <= floor || marketPrice >= ceiling) return undefined;

  const price: Pricer = (volatility) =>
    priceOption({ spot, strike, daysToExpiry, volatility, rate, type });
  // Brenner–Subrahmanyam: a closed-form ATM seed that lands Newton close on the common case.
  const seed = Math.sqrt((2 * Math.PI) / years) * (marketPrice / spot);
  const solved = solveByNewton(price, marketPrice, seed) ?? solveByBisection(price, marketPrice);
  if (solved === undefined) return undefined;
  return solved >= MAX_VOLATILITY - PIN_TOLERANCE ? undefined : solved;
}
