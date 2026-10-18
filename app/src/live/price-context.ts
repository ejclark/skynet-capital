import type { Bar } from "./bars";
import type { ChainRow } from "./options";

/**
 * PRICE CONTEXT ON THE POSITION'S AXIS (#5070 slice 2b; round 2 of #5037, R2). Eric (af4f8295):
 * Bollinger bands and heavy in-the-money volume "as support, and as a guide to strike placement".
 * Round 2 drew it as two layers on the price strip's own axis, read by one plain fact line:
 *  - the 20-DAY RANGE: the lowest low and highest high of the last 20 daily bars, with their
 *    average close (the middle of a 20-day Bollinger band) marked inside it;
 *  - OPEN CONTRACTS BY STRIKE: the held contract's own expiry and kind, one bar per strike that
 *    falls on the axis, its height the open interest the feed reported.
 * Facts only: the line names what sits between today's price and the side the position loses on;
 * it never calls a level "support" — whether the stock respects it is the tape's to say.
 * Pure: `shell/position-picture.tsx` draws what this returns.
 */

/** Daily bars the range reads, at most: round 2's "20-day". */
const RANGE_BARS = 20;

export interface PriceRange {
  readonly low: number;
  readonly high: number;
  /** The mean close over the same bars. */
  readonly average: number;
  /** How many daily bars it covers — 20, or fewer for a stock with a shorter history. */
  readonly days: number;
}

/** The last 20 daily bars' range and average close; undefined without a bar to read. */
export function priceRange(bars: readonly Bar[]): PriceRange | undefined {
  const last = bars.slice(-RANGE_BARS).filter((b) => b.l > 0 && b.h >= b.l && Number.isFinite(b.c));
  if (last.length === 0) return undefined;
  return {
    low: Math.min(...last.map((b) => b.l)),
    high: Math.max(...last.map((b) => b.h)),
    average: last.reduce((sum, b) => sum + b.c, 0) / last.length,
    days: last.length,
  };
}

/** One strike's bar on the axis. */
export interface StrikeBar {
  readonly strike: number;
  readonly contracts: number;
  /** 0..100 along the axis. */
  readonly at: number;
  /** The strike this position holds. */
  readonly held: boolean;
}

/** The price axis the strip draws on, in dollars. */
export interface PriceAxis {
  readonly lo: number;
  readonly hi: number;
}

/**
 * Open contracts at each strike that falls on the axis. A strike the feed reported no open
 * interest for is left out — never drawn as zero — and so is one with none open.
 */
export function strikeBars(
  rows: readonly ChainRow[],
  axis: PriceAxis,
  heldStrike: number | undefined,
): StrikeBar[] {
  const span = axis.hi - axis.lo;
  if (!(span > 0)) return [];
  return rows
    .filter(
      (r) =>
        r.openInterest !== undefined &&
        r.openInterest > 0 &&
        r.strike >= axis.lo &&
        r.strike <= axis.hi,
    )
    .map((r) => ({
      strike: r.strike,
      contracts: r.openInterest ?? 0,
      at: ((r.strike - axis.lo) / span) * 100,
      held: r.strike === heldStrike,
    }));
}

/** The strike with the most open contracts, when there is one. */
export function busiest(bars: readonly StrikeBar[]): StrikeBar | undefined {
  return bars.reduce<StrikeBar | undefined>(
    (top, b) => (top === undefined || b.contracts > top.contracts ? b : top),
    undefined,
  );
}

export const money2 = (x: number) =>
  `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A strike reads as "$80", or "$82.50" when it has cents. */
export const strikeMoney = (x: number) =>
  Number.isInteger(x) ? `$${x.toLocaleString("en-US")}` : money2(x);

/** "3.2k", "940", "1.1M" — a contract count at a glance. */
export const contractsText = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
    .format(n)
    .replace("K", "k");

/** "20-day range $78.90–$96.30 · average $87.60". */
export const rangeWords = (r: PriceRange) =>
  `${r.days}-day range ${money2(r.low)}–${money2(r.high)} · average ${money2(r.average)}`;

/**
 * The one fact line under the strip: what sits between today's price and the side the position
 * loses on — the range's edge on that side and the busiest strike there. `losesBelow` is true for
 * a sold put, a bought call and long shares (they lose as the stock falls). Undefined without a
 * price today, or when neither fact lies on that side.
 */
export function contextLine(
  now: number | undefined,
  losesBelow: boolean,
  range: PriceRange | undefined,
  bars: readonly StrikeBar[],
): string | undefined {
  if (now === undefined) return undefined;
  const past = (x: number) => (losesBelow ? x < now : x > now);
  const facts: string[] = [];
  if (range) {
    const edge = losesBelow ? range.low : range.high;
    if (past(edge))
      facts.push(`the ${range.days}-day ${losesBelow ? "low" : "high"} (${money2(edge)})`);
  }
  const top = busiest(bars.filter((b) => past(b.strike)));
  if (top)
    facts.push(
      `the busiest strike (${strikeMoney(top.strike)}, ${contractsText(top.contracts)} open)`,
    );
  if (facts.length === 0) return undefined;
  return `${losesBelow ? "Under" : "Over"} today's ${money2(now)}: ${facts.join(" and ")}.`;
}
