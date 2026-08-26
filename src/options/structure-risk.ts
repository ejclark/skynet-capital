import { SHARES_PER_CONTRACT } from "../trading/option-economics.js";
import { type StructureLeg, structureEntryCost, structureValue } from "./payoff-surface.js";
import { terminalTerms } from "./terminal-odds.js";

/**
 * STRUCTURE RISK — the four numbers a risk graph prints in its corner, derived from the same
 * payoff engine that draws the curve: most it can make, most it can lose, where it breaks even,
 * and therefore how much capital it puts at risk.
 *
 * Why this is not a lookup table of "max profit = the spread width": that shortcut is only true
 * AT EXPIRATION, and this engine marks structures at a stated HORIZON, which is usually earlier.
 * A bull call spread twenty days before expiry has not reached its cap and never touches its
 * floor. Reading the numbers off the marked curve keeps them consistent with the probability of
 * profit computed on the same curve — the alternative is a POP and a max-loss that quietly
 * describe two different trades.
 *
 * The honesty rules:
 *
 * - **Unbounded is a first-class answer, not a big number.** A short call nobody covers loses
 *   without limit; reporting the edge of a sampled band as "max loss" would be a lie with a
 *   dollar sign on it. Boundedness is decided STRUCTURALLY, from the net call lots that survive
 *   as price runs away, not from where the samples happened to stop.
 * - **Downside is always bounded** — price floors at zero, so the worst case for the puts and any
 *   long stock is a real number, however large.
 * - Break-evens are read off the marked curve by interpolating between the two samples that
 *   straddle a sign change. That is a DISPLAY number: precise enough to name a level in a
 *   sentence, and deliberately not the bisection `probability.ts` runs when the same crossing is
 *   being integrated over.
 * - Extremes are measured across a ±6σ band with every strike forced in AND with both asymptotes
 *   marked, so a bounded structure's true extreme is always sampled — including the ones outside
 *   the band, like a covered call's worst case at price zero.
 *
 * PURE: no I/O, no clock. `undefined` means "no honest answer", never zero.
 */

/** How far the sampling band reaches, in standard deviations of the terminal distribution. */
const RISK_BAND_SIGMAS = 6;
/** Log-uniform fill points across the band, on top of every strike and spot itself. */
const RISK_FILL_POINTS = 96;
/**
 * The two anchors that make a BOUNDED extreme true rather than merely sampled. A ±6σ band is where
 * the probability lives, but a covered call's worst case is at price zero and an iron condor's is
 * past its far wing — both outside that band. Marking the structure once at each asymptote is what
 * stops "max loss" from silently meaning "the worst thing inside six standard deviations".
 */
const FLOOR_FRACTION = 1e-6;
const CEILING_MULTIPLE = 1e3;

/** A dollar extreme, or the honest admission that there isn't one. */
export type RiskBound =
  | { readonly kind: "amount"; readonly amount: number }
  | { readonly kind: "unbounded" };

/** Where and how the structure is being marked when its risk is measured. */
export interface RiskHorizon {
  readonly spot: number;
  /** Calendar days forward the structure is marked at; fractional allowed. */
  readonly daysForward: number;
  /** Annualized volatility of the UNDERLYING, used only to size the sampling band. */
  readonly volatility: number;
  readonly rate?: number;
}

export interface StructureRisk {
  /** Dollars to open: positive is a net debit paid, negative a net credit received. */
  readonly entryCost: number;
  /** The most it can make at this horizon, in dollars. */
  readonly maxProfit: RiskBound;
  /** The most it can lose at this horizon, as POSITIVE dollars. */
  readonly maxLoss: RiskBound;
  /** Underlying prices where the marked curve crosses break-even, ascending. */
  readonly breakEvens: readonly number[];
  /** `maxLoss` as a plain number when it is bounded — the denominator a return is measured on. */
  readonly capitalAtRisk?: number;
}

/**
 * The structure's marked P/L in dollars at one underlying price — value at the horizon less what
 * it cost to open. `undefined` when the structure or the mark cannot be described, so a caller
 * renders ABSENT rather than a $0 that would read as "it breaks even there".
 */
export function structureProfitAt(
  legs: readonly StructureLeg[],
  horizon: RiskHorizon,
  price: number,
): number | undefined {
  const entryCost = structureEntryCost(legs);
  if (entryCost === undefined) return undefined;
  const value = structureValue(legs, {
    spot: price,
    daysForward: horizon.daysForward,
    rate: horizon.rate,
  });
  return value === undefined ? undefined : value - entryCost;
}

/**
 * Net call-equivalent LOTS — the exposure that survives as price runs away to infinity, where
 * every call is worth its full delta and every put is worthless. Long stock counts as its own
 * lot-equivalent, which is exactly why a covered call comes out BOUNDED (+1 lot of shares, −1
 * call, net zero) while a naked short call does not.
 */
function netCallLots(legs: readonly StructureLeg[]): number {
  let lots = 0;
  for (const leg of legs) {
    if (leg.kind === "call") lots += leg.quantity;
    else if (leg.kind === "stock") lots += leg.quantity / SHARES_PER_CONTRACT;
  }
  return lots;
}

/** Every price the extremes are hunted at: the band's fill, spot, and every strike. */
function riskBandPrices(legs: readonly StructureLeg[], horizon: RiskHorizon): number[] {
  const terms = terminalTerms(
    horizon.spot,
    horizon.daysForward,
    horizon.volatility,
    horizon.rate ?? 0,
  );
  const reach = terms ? RISK_BAND_SIGMAS * terms.sigmaRootT : 0;
  const centre = Math.log(horizon.spot) + (terms?.driftT ?? 0);
  const span = Math.max(reach, Math.log(2));
  const prices = [horizon.spot, horizon.spot * FLOOR_FRACTION, horizon.spot * CEILING_MULTIPLE];
  for (let step = 0; step <= RISK_FILL_POINTS; step += 1) {
    prices.push(Math.exp(centre - span + (2 * span * step) / RISK_FILL_POINTS));
  }
  for (const leg of legs) if (leg.kind !== "stock") prices.push(leg.strike);
  return [...new Set(prices)].filter((price) => price > 0).sort((a, b) => a - b);
}

/**
 * Where the marked curve crosses break-even, by straight-line interpolation between the two
 * samples that straddle it. "Above water" is `profit ≥ 0`, matching `probability.ts`'s own
 * convention — which is what makes a sample landing exactly on zero fall out correctly instead of
 * needing a special case: it belongs to the profitable side, so the crossing is found at the edge
 * of the interval next to it, once, wherever in the series it sits.
 */
function crossingPrices(prices: readonly number[], profits: readonly number[]): number[] {
  const aboveWater = (profit: number): boolean => profit >= 0;
  const crossings: number[] = [];
  for (let index = 0; index + 1 < prices.length; index += 1) {
    const low = prices[index];
    const high = prices[index + 1];
    const before = profits[index];
    const after = profits[index + 1];
    if (low === undefined || high === undefined) continue;
    if (before === undefined || after === undefined) continue;
    if (aboveWater(before) === aboveWater(after)) continue;
    crossings.push(low + ((high - low) * -before) / (after - before));
  }
  return crossings;
}

/**
 * The structure's risk profile at the horizon. `undefined` when the structure cannot be described
 * or cannot be marked somewhere in the band — an honest absence, never a zeroed profile that a
 * ranking would happily sort on.
 */
export function structureRisk(
  legs: readonly StructureLeg[],
  horizon: RiskHorizon,
): StructureRisk | undefined {
  const entryCost = structureEntryCost(legs);
  if (entryCost === undefined) return undefined;
  if (!(Number.isFinite(horizon.spot) && horizon.spot > 0)) return undefined;

  const prices = riskBandPrices(legs, horizon);
  const profits: number[] = [];
  for (const price of prices) {
    const profit = structureProfitAt(legs, horizon, price);
    if (profit === undefined) return undefined;
    profits.push(profit);
  }
  if (profits.length === 0) return undefined;

  const runaway = netCallLots(legs);
  const bestSampled = Math.max(...profits);
  const worstSampled = Math.min(...profits);
  const maxProfit: RiskBound =
    runaway > 0 ? { kind: "unbounded" } : { kind: "amount", amount: bestSampled };
  const maxLoss: RiskBound =
    runaway < 0 ? { kind: "unbounded" } : { kind: "amount", amount: Math.max(0, -worstSampled) };

  const breakEvens = crossingPrices(prices, profits);
  return maxLoss.kind === "amount"
    ? { entryCost, maxProfit, maxLoss, breakEvens, capitalAtRisk: maxLoss.amount }
    : { entryCost, maxProfit, maxLoss, breakEvens };
}
