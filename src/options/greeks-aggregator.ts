import { fin } from "../domain/finite.js";
import { isOccSymbol, parseOccSymbol } from "../trading/option-symbols.js";

/**
 * PORTFOLIO GREEKS — one book's total exposure, beta-weighted to a single benchmark.
 *
 * WHY THIS EXISTS. Per-leg greeks answer "what is this contract doing"; nothing answered
 * "what is this ACCOUNT doing", which is the number a member needs before adding risk and the one
 * an autonomous bot needs before sizing. thinkorswim's beta-weighting is the portable idea: a delta
 * on NVDA and a delta on KO are not the same dollar of directional risk, so re-express every one
 * against a common benchmark and they become additive.
 *
 * PURE. No I/O, no clock. The caller supplies the greeks it already fetched (the chain snapshot)
 * and the betas it already has; this module only does the arithmetic.
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
  /** Beta-weighted where a beta was supplied, raw otherwise — see `weightedTo`. */
  readonly delta: number;
  readonly gamma: number;
  readonly theta: number;
  readonly vega: number;
  /** The benchmark deltas are expressed against, or `undefined` when nothing was weighted. */
  readonly weightedTo?: string;
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
 * @param betaFor    beta of an UNDERLYING against the benchmark. Return `undefined` to leave that
 *                   underlying unweighted (counted raw) rather than assuming 1.0.
 * @param benchmark  the symbol deltas are expressed against, e.g. "SPY".
 */
export function aggregateGreeks(
  positions: readonly GreekPosition[],
  greeksFor: (occSymbol: string) => ContractGreeks | undefined,
  betaFor: (underlying: string) => number | undefined = () => undefined,
  benchmark?: string,
): AggregateGreeks {
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;
  let covered = 0;
  let weightedAny = false;
  const uncovered: string[] = [];

  for (const position of positions) {
    const qty = fin(position.quantity);
    if (qty === 0) continue;

    // A plain ticker is one delta per share. There are no other greeks on stock — reporting a
    // gamma of 0 for it is correct, not an absence.
    if (!isOccSymbol(position.symbol)) {
      const beta = betaFor(position.symbol);
      if (beta !== undefined) weightedAny = true;
      delta += qty * (beta ?? 1);
      covered += 1;
      continue;
    }

    const greeks = greeksFor(position.symbol);
    if (!greeks) {
      uncovered.push(position.symbol);
      continue;
    }

    const underlying = parseOccSymbol(position.symbol)?.underlying;
    const beta = underlying ? betaFor(underlying) : undefined;
    if (beta !== undefined) weightedAny = true;

    const shares = qty * CONTRACT_MULTIPLIER;
    // Only DELTA is beta-weighted. Gamma/theta/vega are not directional exposure to the benchmark,
    // so scaling them by beta would produce a number that looks additive and means nothing.
    delta += shares * fin(greeks.delta) * (beta ?? 1);
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
    ...(weightedAny && benchmark ? { weightedTo: benchmark } : {}),
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
