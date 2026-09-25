import type { OptionChainRow } from "../alpaca/alpaca-options-client.js";
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { EarningsWindow, GuidanceQuote } from "../options/position-guidance-types.js";
import { impliedVolatility } from "../options/pricing.js";

/**
 * The position guidance's market arithmetic (#3729) — pure transforms from what the feed returned to
 * what the engine reads. No I/O, no clock; every "no honest answer" is `undefined`, never a guess.
 */

/** Trading days per year for annualizing daily realized volatility. */
const TRADING_DAYS = 252;
/** Realized vol wants about a month of sessions; fewer returns than this is noise, not a reading. */
export const MIN_RETURNS = 10;
export const RV_SESSIONS = 20;

/** Annualized close-to-close realized volatility over the last `RV_SESSIONS` returns. */
export function realizedVolatility(closes: readonly number[]): number | undefined {
  const tail = closes.filter((c) => Number.isFinite(c) && c > 0).slice(-(RV_SESSIONS + 1));
  const returns = tail.slice(1).map((c, i) => Math.log(c / (tail[i] as number)));
  if (returns.length < MIN_RETURNS) return undefined;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * TRADING_DAYS);
}

const midOf = (row: OptionChainRow): number | undefined =>
  row.bid !== undefined && row.ask !== undefined && row.ask >= row.bid && row.ask > 0
    ? (row.bid + row.ask) / 2
    : undefined;

/**
 * The underlying implied by put-call parity at the strike nearest spot: S ≈ C − P + K·e^(−rT).
 * An independent second read of spot, derived from the option market rather than the IEX tape —
 * if the two disagree by more than a percent, one of them is wrong and the guidance refuses to answer.
 * (American early-exercise premium near the money over a few weeks is cents; the tolerance absorbs it.)
 */
export function parityImpliedSpot(
  calls: readonly OptionChainRow[],
  puts: readonly OptionChainRow[],
  spot: number,
  daysToExpiry: number,
  rate = 0,
): number | undefined {
  const byStrike = new Map(puts.map((p) => [p.strike, p]));
  const pairs = calls
    .map((c) => ({ c, p: byStrike.get(c.strike) }))
    .filter((x): x is { c: OptionChainRow; p: OptionChainRow } => x.p !== undefined)
    .sort((a, b) => Math.abs(a.c.strike - spot) - Math.abs(b.c.strike - spot));
  const atm = pairs[0];
  if (!atm) return undefined;
  const c = midOf(atm.c);
  const p = midOf(atm.p);
  if (c === undefined || p === undefined) return undefined;
  const implied = c - p + atm.c.strike * Math.exp((-rate * daysToExpiry) / 365);
  return implied > 0 ? implied : undefined;
}

/** A chain row as the guidance reads it: the bid a seller receives, the IV solved from the mid. */
export function toGuidanceQuote(
  row: OptionChainRow,
  expiration: string,
  type: "call" | "put",
  spot: number,
  daysToExpiry: number,
): GuidanceQuote {
  const mid = midOf(row);
  const iv =
    mid === undefined
      ? undefined
      : impliedVolatility({ spot, strike: row.strike, daysToExpiry, type, marketPrice: mid });
  return {
    expiration,
    strike: row.strike,
    type,
    ...(row.bid !== undefined ? { bid: row.bid } : {}),
    ...(row.ask !== undefined ? { ask: row.ask } : {}),
    ...(iv !== undefined ? { iv } : {}),
    ...(row.delta !== undefined ? { feedDelta: row.delta } : {}),
  };
}

/** Days either side of an unbounded ESTIMATE the guidance treats as the print's window. */
export const ESTIMATE_WINDOW_DAYS = 7;

const shift = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * The print as a window. A confirmed date is the day itself through the reaction day; an estimate
 * uses the research's own bounded window when it has one, else ±`ESTIMATE_WINDOW_DAYS` — wide on
 * purpose: excluding one clean expiry costs a little premium, including a spanning one is the
 * exact mistake the DTE-PRINT rule exists to prevent.
 */
export function earningsWindowOf(print: EarningsPrint | undefined): EarningsWindow | undefined {
  if (!print) return undefined;
  if (print.status === "confirmed") {
    return {
      start: print.date,
      end: shift(print.date, 1),
      status: "confirmed",
      source: print.source,
    };
  }
  const window = print.window ?? {
    start: shift(print.date, -ESTIMATE_WINDOW_DAYS),
    end: shift(print.date, ESTIMATE_WINDOW_DAYS),
  };
  return {
    ...window,
    status: "estimate",
    source: print.window
      ? `${print.source}; research-bounded window`
      : `${print.source}; ±${ESTIMATE_WINDOW_DAYS}d`,
  };
}

/**
 * The print a guidance read must respect TODAY: the earliest one whose window has not yet closed. Not
 * `nextPrint`, which drops an estimate the moment its point date passes (and on a UTC date) —
 * while the research-bounded window says the print may still be days away.
 */
export function activePrint(
  prints: readonly EarningsPrint[],
  symbol: string,
  today: string,
): { readonly print: EarningsPrint; readonly window: EarningsWindow } | undefined {
  return prints
    .filter((p) => p.symbol === symbol)
    .map((print) => ({ print, window: earningsWindowOf(print) as EarningsWindow }))
    .filter(({ window }) => window.end >= today)
    .sort((a, b) => a.print.date.localeCompare(b.print.date))[0];
}
