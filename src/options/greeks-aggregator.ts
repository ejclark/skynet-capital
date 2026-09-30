import { fin } from "../domain/finite.js";
import { isOccSymbol, parseOccSymbol } from "../trading/option-symbols.js";

/**
 * PORTFOLIO GREEKS — one book's total exposure, and its delta beta-weighted to one benchmark.
 *
 * WHY THIS EXISTS. Per-leg greeks answer "what is this contract doing"; nothing answered
 * "what is this ACCOUNT doing", which is the number a member needs before adding risk and the one
 * an autonomous bot needs before sizing. thinkorswim's beta-weighting is the portable idea: a delta
 * on NVDA and a delta on KO are not the same dollar of directional risk, so re-express every one
 * against a common benchmark and they become additive.
 *
 * PURE. No I/O, no clock. The caller supplies the greeks it already fetched (the chain snapshot)
 * and the betas and prices it already has; this module only does the arithmetic.
 *
 * TWO STEPS, ON PURPOSE (#4327). `aggregateGreeks` sums the raw greeks and keeps each underlying's
 * delta apart; `betaWeightDelta` then re-expresses those deltas in benchmark shares. Until #4327
 * the weighting lived inside the sum as `Δ × β` — which still is not additive, because a delta of
 * 1 on a $900 stock and on a $60 one are different dollars. The thinkorswim formula carries the
 * price ratio: benchmark-share delta = Δ × β × P(stock) ÷ P(benchmark).
 *
 * HONESTY: a position whose greeks we do not have is NOT silently dropped and NOT counted as zero.
 * It lands in `uncovered`, and `covered`/`total` say how much of the book the number actually
 * speaks for — an aggregate over half a book, presented as the whole, is the false-confidence case
 * this repo's absence rule exists to prevent.
 */

/** The per-contract greeks this module needs. Mirrors `OptionChainRow`'s optional greek fields. */
export interface ContractGreeks {
  readonly delta?: number;
  readonly gamma?: number;
  readonly theta?: number;
  readonly vega?: number;
}

/** One holding, reduced to what the arithmetic needs. */
export interface GreekPosition {
  /** OCC symbol for an option leg, or a plain ticker for shares. */
  readonly symbol: string;
  /** Signed: negative is short. Options are in CONTRACTS, shares in shares. */
  readonly quantity: number;
}

export interface AggregateGreeks {
  /** Raw share-equivalent delta, summed across names — see `betaWeightDelta` for the additive one. */
  readonly delta: number;
  readonly gamma: number;
  readonly theta: number;
  readonly vega: number;
  /** Raw share-equivalent delta per underlying (stock and option legs netted), for weighting. */
  readonly deltaByUnderlying: Readonly<Record<string, number>>;
  /** Positions the figures speak for, and the total considered. */
  readonly covered: number;
  readonly total: number;
  /** Symbols with no greeks available — named, so the gap is visible rather than inferred. */
  readonly uncovered: readonly string[];
}

/** One option contract controls 100 shares; a share position is one delta each and nothing else. */
const CONTRACT_MULTIPLIER = 100;

/**
 * Sum a book's greeks.
 *
 * @param positions  every holding; equities are included for their delta, which is the whole point
 *                   of beta-weighting (a covered call's stock leg offsets its short call).
 * @param greeksFor  per-contract greeks by OCC symbol. Return `undefined` when unknown — that is
 *                   what puts a position in `uncovered` rather than fabricating a zero.
 */
export function aggregateGreeks(
  positions: readonly GreekPosition[],
  greeksFor: (occSymbol: string) => ContractGreeks | undefined,
): AggregateGreeks {
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;
  let covered = 0;
  const uncovered: string[] = [];
  const byUnderlying: Record<string, number> = {};
  const addDelta = (underlying: string, d: number) => {
    byUnderlying[underlying] = (byUnderlying[underlying] ?? 0) + d;
    delta += d;
  };

  for (const position of positions) {
    const qty = fin(position.quantity);
    if (qty === 0) continue;

    // A plain ticker is one delta per share. There are no other greeks on stock — reporting a
    // gamma of 0 for it is correct, not an absence.
    if (!isOccSymbol(position.symbol)) {
      addDelta(position.symbol, qty);
      covered += 1;
      continue;
    }

    const greeks = greeksFor(position.symbol);
    if (!greeks) {
      uncovered.push(position.symbol);
      continue;
    }

    const underlying = parseOccSymbol(position.symbol)?.underlying ?? position.symbol;
    const shares = qty * CONTRACT_MULTIPLIER;
    addDelta(underlying, shares * fin(greeks.delta));
    gamma += shares * fin(greeks.gamma);
    theta += shares * fin(greeks.theta);
    vega += shares * fin(greeks.vega);
    covered += 1;
  }

  return {
    delta,
    gamma,
    theta,
    vega,
    deltaByUnderlying: byUnderlying,
    covered,
    total: positions.filter((p) => fin(p.quantity) !== 0).length,
    uncovered,
  };
}

/**
 * Is this aggregate worth showing as a number at all?
 *
 * A book where most positions had no greeks produces a figure that is arithmetically fine and
 * editorially a lie. The view uses this to render ABSENT instead, the same way a trophy with no
 * history renders "—" rather than 0.
 */
export function isRepresentative(aggregate: AggregateGreeks): boolean {
  return aggregate.total > 0 && aggregate.uncovered.length === 0;
}

/** A measured beta for one underlying, with where it came from. */
export interface UnderlyingBeta {
  readonly beta: number;
  /** YYYY-MM-DD — the last close the beta was fitted through. */
  readonly asOf: string;
}

export interface BetaWeightedDelta {
  /** The benchmark every weighted delta is expressed in, e.g. "SPY". */
  readonly benchmark: string;
  readonly benchmarkPrice: number;
  /** Benchmark-share equivalents: Σ Δ × β × P ÷ P(benchmark), over the weighted names only. */
  readonly delta: number;
  /** The book as dollars of benchmark held: Σ Δ × β × P. A 1% benchmark move ≈ 1% of this in P/L. */
  readonly dollarDelta: number;
  /** Underlyings that were weighted, with the beta used — named so the source can be shown. */
  readonly weighted: Readonly<Record<string, UnderlyingBeta>>;
  /** Underlyings with no beta or no price: left out of the weighted sum, their RAW delta kept here. */
  readonly unweighted: Readonly<Record<string, number>>;
}

/**
 * Re-express a book's delta in benchmark shares.
 *
 * Only DELTA is weighted. Gamma/theta/vega are not directional exposure to the benchmark, so
 * scaling them by beta would produce a number that looks additive and means nothing.
 *
 * A name with no measured beta (or no price) is NOT given 1.0: it stays out of the weighted sum
 * and is returned in `unweighted` with its raw delta, so the view can say so beside the figure.
 * Returns `undefined` when the benchmark has no usable price — nothing can be weighted then.
 */
export function betaWeightDelta(
  deltaByUnderlying: Readonly<Record<string, number>>,
  betaFor: (underlying: string) => UnderlyingBeta | undefined,
  priceFor: (underlying: string) => number | undefined,
  benchmark: string,
  benchmarkPrice: number | undefined,
): BetaWeightedDelta | undefined {
  if (benchmarkPrice === undefined || !(benchmarkPrice > 0)) return undefined;
  let dollarDelta = 0;
  const weighted: Record<string, UnderlyingBeta> = {};
  const unweighted: Record<string, number> = {};
  for (const [underlying, rawDelta] of Object.entries(deltaByUnderlying)) {
    const beta = betaFor(underlying);
    const price = priceFor(underlying);
    if (beta === undefined || !Number.isFinite(beta.beta) || price === undefined || !(price > 0)) {
      unweighted[underlying] = rawDelta;
      continue;
    }
    weighted[underlying] = beta;
    dollarDelta += rawDelta * beta.beta * price;
  }
  return {
    benchmark,
    benchmarkPrice,
    delta: dollarDelta / benchmarkPrice,
    dollarDelta,
    weighted,
    unweighted,
  };
}
