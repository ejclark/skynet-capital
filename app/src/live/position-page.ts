import { priceOption } from "../../../src/options/pricing";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskActivityEvent, DeskActivityLine, DeskPosition } from "./desk";
import { actFigures, actLine, actVerb, signedMoney } from "./position-act";
import { signedDollars, type WaitingStrip } from "./position-picture";
import { money2, type PriceAxis } from "./price-context";
import { held, parseQuantity } from "./quantity";

/**
 * A POSITION'S FULL PAGE, AS NUMBERS (#5070 slice 6; round 2 of #5037, R2's depth ladder step 4,
 * Eric's More 5, 9cda6977: "a page is for a deliberate deep dive and can derail you"). The page is
 * opt-in — reached only from "Full page ›" inside an opened row — and its sections are fixed:
 * Picture · Three ways to play it · Fills · Dates. This module answers each from what the row and
 * the account's reads already carry:
 *  - the PROFIT-AT-PRICE CHART (V2 of round 2, which Eric asked for as an addition on this page,
 *    not a replacement in the row): the P/L across the price strip's own axis, one curve per date —
 *    today, 14 and 7 days left, expiry — Black-Scholes at the contract's own volatility, the same
 *    assumption the waiting strip states;
 *  - the WAYS TO PLAY IT: keep, roll, buy back (or sell), each one line of fact;
 *  - the position's FILLS and its DATES.
 * Pure: `shell/position-page.tsx` draws what this returns.
 */

/** One point on a curve: a price at expiry or on the curve's date, and the P/L there. */
export interface ProfitPoint {
  readonly price: number;
  readonly total: number;
}

/** The P/L across prices on one date. */
export interface ProfitCurve {
  /** "today", "14 days left", "7 days left", "at expiry". */
  readonly label: string;
  /** Days left to expiry on the curve's date. */
  readonly left: number;
  readonly points: readonly ProfitPoint[];
}

export interface ProfitChart {
  readonly axis: PriceAxis;
  /** Today first, expiry last. */
  readonly curves: readonly ProfitCurve[];
  /** The lowest and highest P/L any curve reaches on the axis, $0 always among them. */
  readonly low: number;
  readonly high: number;
  readonly spot: number;
  readonly volatility: number;
}

/** Prices drawn across the axis per curve: enough for a smooth curve at 342px. */
const SAMPLES = 61;

/**
 * The profit-at-price chart for an option the feed priced. Each curve is the position's P/L if the
 * stock sits at a price on that date: today's P/L plus what the contract would then be worth, less
 * what it is worth now. The model's price today rarely equals the feed's mark to the cent, so that
 * gap fades toward expiry, as on the waiting strip — today's curve passes through today's P/L at
 * today's price, and the expiry curve is the contract's intrinsic value alone. Undefined for shares
 * (one straight line says nothing a price strip doesn't), and wherever `waitingStrip` is.
 */
export function profitChart(
  position: DeskPosition,
  wait: WaitingStrip | undefined,
  axis: PriceAxis | undefined,
): ProfitChart | undefined {
  const occ = parseOccSymbol(position.symbol);
  const contracts = parseQuantity(position.quantity);
  const value = signedDollars(position.value);
  if (!(occ && wait && axis && axis.hi > axis.lo) || value === undefined) return undefined;
  const { spot, volatility, daysLeft } = wait;
  const scale = contracts * 100;
  const model = (price: number, left: number) =>
    priceOption({ spot: price, strike: occ.strike, daysToExpiry: left, volatility, type: occ.type })
      ?.price;
  const today = model(spot, daysLeft);
  if (today === undefined) return undefined;
  const gap = value - scale * today;
  const totalAt = (price: number, left: number) =>
    position.totalPlRaw + scale * (model(price, left) ?? 0) + gap * (left / daysLeft) - value;
  const dates = [
    { label: "today", left: daysLeft },
    { label: "14 days left", left: 14 },
    { label: "7 days left", left: 7 },
    { label: "at expiry", left: 0 },
  ].filter((d, i) => i === 0 || d.left < daysLeft);
  const prices = Array.from(
    { length: SAMPLES },
    (_, i) => axis.lo + ((axis.hi - axis.lo) * i) / (SAMPLES - 1),
  );
  const curves = dates.map((d) => ({
    ...d,
    points: prices.map((price) => ({ price, total: totalAt(price, d.left) })),
  }));
  const totals = curves.flatMap((c) => c.points.map((p) => p.total));
  return {
    axis,
    curves,
    low: Math.min(0, ...totals),
    high: Math.max(0, ...totals),
    spot,
    volatility,
  };
}

/** One way to play the position, and what it does, in one line of fact. */
export interface PlayWay {
  readonly way: "Keep" | "Roll" | "Buy back" | "Sell";
  readonly line: string;
}

/** "Nov 6" from "2026-11-06". */
export const shortDate = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * The ways to play it, in the round's order — keep, roll, buy back — each one line of what it does,
 * never a verdict on which to pick (that is the guidance's call, slice 5). Keep on an option says
 * where waiting lands if the stock holds today's price; roll is an option's alone; the close is
 * priced at today's mark, the price the row's P/L already uses, so it locks in that P/L exactly.
 * Short shares get no close: this desk doesn't place a buy to cover.
 */
export function waysToPlay(
  position: DeskPosition,
  book: readonly DeskPosition[],
  wait: WaitingStrip | undefined,
): PlayWay[] {
  const occ = parseOccSymbol(position.symbol);
  const stock = occ?.underlying ?? position.symbol;
  const ways: PlayWay[] = [];
  if (occ) {
    const last = wait?.points[wait.points.length - 1];
    ways.push({
      way: "Keep",
      line:
        wait && last
          ? `Hold to expiry, ${shortDate(occ.expiration)}. If ${stock} holds ${money2(wait.spot)}, the P/L ends at ${signedMoney(last.total)}.`
          : `Hold to expiry, ${shortDate(occ.expiration)}. Where that lands needs a live price for this contract, which the feed has not quoted.`,
    });
    ways.push({
      way: "Roll",
      line: `Close it and open the same strike at a later expiry, in one ticket that prices both.`,
    });
  } else {
    ways.push({
      way: "Keep",
      line: `Nothing expires: the P/L moves with ${stock}'s price.`,
    });
  }
  const verb = actVerb(position);
  const { count } = held(position.quantity);
  const markValue = signedDollars(position.value);
  const perShare =
    markValue === undefined || count === 0
      ? undefined
      : Math.abs(markValue) / (count * (position.isOption ? 100 : 1));
  const figures =
    verb && perShare !== undefined && perShare > 0
      ? actFigures(position, book, count, perShare)
      : undefined;
  if (verb && figures) {
    ways.push({ way: verb.verb, line: `At today's mark: ${lowerFirst(actLine(figures, verb))}.` });
  }
  return ways;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * This contract's (or these shares') fills, newest first, out of the stock's narrowed activity:
 * an order on the symbol itself, or the leg of a spread that holds it. Only what filled, or what the
 * broker reported happening to it (an expiry, an assignment) — an order that never filled made no
 * part of this position.
 */
export function positionFills(
  events: readonly DeskActivityEvent[],
  symbol: string,
): DeskActivityLine[] {
  const out: DeskActivityLine[] = [];
  for (const e of events) {
    const line = e.symbol === symbol ? e : e.legs?.find((l) => l.symbol === symbol);
    if (line && (line.filled > 0 || line.lifecycle)) out.push(line);
  }
  return out;
}

/** One dated thing on the page's Dates list. */
export interface PositionDate {
  /** `YYYY-MM-DD`, for ordering. */
  readonly at: string;
  /** "Opened", "Earnings Oct 28", "Expires". */
  readonly label: string;
  /** "before expiry", "in 29 days", "estimated". */
  readonly note?: string;
}

const dayOf = (iso: string): string | undefined => {
  const stamp = new Date(iso);
  return Number.isNaN(stamp.getTime())
    ? undefined
    : stamp.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
};

/**
 * The position's dates, earliest first: when it opened (its oldest fill still on the page's read),
 * the next dated thing that can move it (the server's own `nextEvent`, else the stock's next print),
 * and an option's expiry. A date the reads don't carry is left out, never estimated here.
 */
export function positionDates(
  position: DeskPosition,
  fills: readonly DeskActivityLine[],
): PositionDate[] {
  const out: PositionDate[] = [];
  const opened = fills
    .filter((f) => !f.lifecycle)
    .map((f) => dayOf(f.at))
    .filter((d): d is string => d !== undefined)
    .sort()[0];
  if (opened) out.push({ at: opened, label: "Opened" });
  const occ = parseOccSymbol(position.symbol);
  const event = position.nextEvent;
  if (event) {
    out.push({
      at: event.at.slice(0, 10),
      label: event.label,
      ...(occ && event.scope === "stock" && event.beforeExpiry ? { note: "before expiry" } : {}),
    });
  } else if (position.nextPrint && position.nextPrint.status !== "unknown") {
    out.push({ at: position.nextPrint.at.slice(0, 10), label: position.nextPrint.label });
  }
  if (occ) {
    const left = position.expiresIn;
    out.push({
      at: occ.expiration,
      label: "Expires",
      ...(left && left !== "no expiry" ? { note: left === "today" ? "today" : `in ${left}` } : {}),
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}
