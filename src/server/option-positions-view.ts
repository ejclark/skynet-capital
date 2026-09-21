import {
  type AggregateGreeks,
  aggregateGreeks,
  type ContractGreeks,
  isRepresentative,
} from "../options/greeks-aggregator.js";
import { daysToExpiryFrom } from "../options/single-leg-odds.js";
import { humanizeOptionSymbol, parseOccSymbol } from "../trading/option-symbols.js";

/**
 * OPTION POSITIONS AS DATA (#3407 P2 slice 3; parity study row 10) — the Position Statement
 * vocabulary every reference desk prints and ours showed only as a humanized OCC symbol: strike,
 * expiry, days left, an in-the-money word, the contract's live greeks scaled to the holding, and
 * the book's netted greeks with the coverage stated (`greeks-aggregator.ts`: an aggregate over
 * half a book is never presented as the whole).
 *
 * Pure: the caller hands in the desk's positions, the snapshots it fetched by contract, the spots
 * it fetched by underlying, and the clock. Absent means absent — a contract the feed didn't
 * quote has no greeks row and is named in `book.uncovered`, never counted as zero.
 */

export interface ContractSnapshot {
  readonly bid?: number;
  readonly ask?: number;
  readonly greeks?: ContractGreeks;
  readonly impliedVol?: number;
}

export interface HeldPosition {
  readonly symbol: string;
  /** Signed: negative is a written contract. Contracts for options. */
  readonly quantity: number;
  readonly marketValue: number;
}

export interface OptionPositionRow {
  readonly symbol: string;
  readonly display: string;
  readonly underlying: string;
  readonly type: "call" | "put";
  readonly strike: number;
  readonly expiration: string;
  /** Calendar days to the 4 pm ET expiry, floored above zero. */
  readonly daysToExpiry: number;
  /** Signed contracts held. */
  readonly contracts: number;
  /** Against the underlying's last trade; absent when no spot was available. */
  readonly inTheMoney?: boolean;
  readonly spot?: number;
  /** Per-share greeks the feed quoted for the contract. */
  readonly greeks?: ContractGreeks;
  /** The holding's exposure: per-share greeks × contracts × 100, sign included. */
  readonly positionGreeks?: ContractGreeks;
  readonly impliedVol?: number;
  readonly bid?: number;
  readonly ask?: number;
}

export interface OptionPositionsView {
  readonly rows: readonly OptionPositionRow[];
  readonly book: AggregateGreeks;
  /** True only when every option position had greeks — the book figure speaks for the whole. */
  readonly representative: boolean;
}

const SHARES_PER_CONTRACT = 100;

/** Exposure figures to the thousandth — kills float noise (0.55 × −100 = −55.00000000000001)
 *  at the source, once, for every consumer. */
const exposure = (perShare: number, k: number): number => Math.round(perShare * k * 1000) / 1000;

function scaled(greeks: ContractGreeks, contracts: number): ContractGreeks {
  const k = contracts * SHARES_PER_CONTRACT;
  return {
    ...(greeks.delta !== undefined ? { delta: exposure(greeks.delta, k) } : {}),
    ...(greeks.gamma !== undefined ? { gamma: exposure(greeks.gamma, k) } : {}),
    ...(greeks.theta !== undefined ? { theta: exposure(greeks.theta, k) } : {}),
    ...(greeks.vega !== undefined ? { vega: exposure(greeks.vega, k) } : {}),
  };
}

export function optionPositionsView(
  positions: readonly HeldPosition[],
  snapshots: ReadonlyMap<string, ContractSnapshot>,
  spots: ReadonlyMap<string, number>,
  now: Date,
): OptionPositionsView {
  const rows: OptionPositionRow[] = [];
  for (const position of positions) {
    const parts = parseOccSymbol(position.symbol);
    if (!parts || position.quantity === 0) continue;
    const snapshot = snapshots.get(position.symbol);
    const spot = spots.get(parts.underlying);
    const daysToExpiry = daysToExpiryFrom(parts.expiration, now) ?? 0;
    const greeks =
      snapshot?.greeks && Object.keys(snapshot.greeks).length > 0 ? snapshot.greeks : undefined;
    rows.push({
      symbol: position.symbol,
      display: humanizeOptionSymbol(position.symbol),
      underlying: parts.underlying,
      type: parts.type,
      strike: parts.strike,
      expiration: parts.expiration,
      daysToExpiry,
      contracts: position.quantity,
      ...(spot !== undefined
        ? { spot, inTheMoney: parts.type === "call" ? spot > parts.strike : spot < parts.strike }
        : {}),
      ...(greeks ? { greeks, positionGreeks: scaled(greeks, position.quantity) } : {}),
      ...(snapshot?.impliedVol !== undefined ? { impliedVol: snapshot.impliedVol } : {}),
      ...(snapshot?.bid !== undefined ? { bid: snapshot.bid } : {}),
      ...(snapshot?.ask !== undefined ? { ask: snapshot.ask } : {}),
    });
  }
  // The book nets every option leg; shares are left out here on purpose — this card is the
  // option positions card, and a covered call's stock leg is the positions table's to show.
  const book = aggregateGreeks(
    rows.map((row) => ({ symbol: row.symbol, quantity: row.contracts })),
    (occ) => snapshots.get(occ)?.greeks,
  );
  return { rows, book, representative: isRepresentative(book) };
}
