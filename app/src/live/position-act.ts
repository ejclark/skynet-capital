import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";
import type { ChainRow } from "./options";
import { signedDollars, stakeFigure } from "./position-picture";
import { money2, strikeMoney } from "./price-context";
import { held } from "./quantity";

/**
 * ACT IN THE ROW, AS NUMBERS (#5070 slice 3; round 2 of #5037, R2 step 3, Eric's 3a77c6db: "act
 * without breaking context, and hand the action off with little effort"). The opened guidance's
 * Buy back turns the row into a prefilled ticket — 1 of 1 contract, a limit at the mid of the
 * quote, good for today — whose line says what the order does before it is reviewed: "Cash out
 * $550 · locks in −$295 · frees $8,000". The same figures fill the one recap modal (4012b085: "a
 * modal only at the risky decision, as a minimal recap"). Pure: `shell/position-act.tsx` draws it.
 */

/** What closing this position is called, by which side of it you hold. */
export interface ActVerb {
  /** "Buy back" a sold option; "Sell" a bought one, or shares. */
  readonly verb: "Buy back" | "Sell";
  /** The noun on Review and Place: "Review buy-back", "Place sale". */
  readonly noun: "buy-back" | "sale";
  /** Does the order pay cash out (a buy-back), or bring it in (a sale)? */
  readonly pays: boolean;
}

/** The close's verb, or nothing for short shares — those close by a buy to cover, which this
 *  desk doesn't place (`closeRefusal` says so in words). */
export function actVerb(position: DeskPosition): ActVerb | undefined {
  const { short } = held(position.quantity);
  if (!short) return { verb: "Sell", noun: "sale", pays: false };
  return position.isOption ? { verb: "Buy back", noun: "buy-back", pays: true } : undefined;
}

/** The limit the ticket opens with, and where it came from, in words beside it. */
export interface LimitSeed {
  readonly price?: number;
  readonly source: string;
}

const cents = (x: number) => Math.round(x * 100) / 100;

/**
 * An option's limit: the mid of the held contract's quote ("mid of $5.30 / $5.70"), else the side
 * the order crosses (the ask for a buy-back, the bid for a sale), else nothing — the feed's silence
 * is said, never priced.
 */
export function optionLimitSeed(row: ChainRow | undefined, pays: boolean): LimitSeed {
  const bid = row?.bid;
  const ask = row?.ask;
  if (bid !== undefined && ask !== undefined && bid >= 0 && ask > 0 && ask >= bid) {
    return { price: cents((bid + ask) / 2), source: `mid of ${money2(bid)} / ${money2(ask)}` };
  }
  const side = pays ? ask : bid;
  if (side !== undefined && side > 0) {
    return { price: side, source: `the ${pays ? "ask" : "bid"}, ${money2(side)}` };
  }
  return { source: "the feed hasn't quoted this contract; type a limit" };
}

/** Shares sell at a limit of today's last price, said as such. */
export function sharesLimitSeed(position: DeskPosition): LimitSeed {
  const last = signedDollars(position.price);
  return last !== undefined && last > 0
    ? { price: last, source: "today's last price" }
    : { source: "no price yet today; type a limit" };
}

/** What the close does, in dollars, for `count` of the position at a `limit` per share. */
export interface ActFigures {
  /** The cash the order moves: out for a buy-back, in for a sale. */
  readonly cash: number;
  /** The P/L this part of the position realizes, signed. */
  readonly locksIn: number;
  /** What it frees: the cash a sold put set aside, or the shares that covered a sold call. */
  readonly frees?: string;
  /** How many stay held after it. */
  readonly left: number;
}

/**
 * The close's figures. What opening this part brought in or cost is its share of the cost basis
 * (negative for a credit: a sold put's "−$255" brought $255 in), so the P/L it locks in is that
 * plus what the close moves — collected $255, buy back at $5.50: −$295. `cash` is the server's
 * estimate when the review has one, so the recap never says two amounts for one order.
 */
export function actFigures(
  position: DeskPosition,
  book: readonly DeskPosition[],
  count: number,
  limit: number,
  cash?: number,
): ActFigures | undefined {
  const { count: total, short } = held(position.quantity);
  const basis = signedDollars(position.costBasis);
  if (!(total > 0 && count > 0 && count <= total && limit > 0) || basis === undefined) {
    return undefined;
  }
  const size = position.isOption ? 100 : 1;
  const moved = cents(cash ?? limit * size * count);
  const opened = (-basis * count) / total;
  const locksIn = cents(opened + (short ? -moved : moved));
  const occ = parseOccSymbol(position.symbol);
  const stake = stakeFigure(position, book);
  const frees =
    occ && stake.kind === "cash"
      ? strikeMoney(cents(occ.strike * 100 * count))
      : occ && stake.kind === "shares"
        ? `${(count * 100).toLocaleString("en-US")} ${occ.underlying} shares`
        : undefined;
  return { cash: moved, locksIn, ...(frees ? { frees } : {}), left: total - count };
}

/** "$550", "$5,512.40" — whole dollars unless the cents say something. */
export const dollars = (x: number) => strikeMoney(cents(Math.abs(x)));

/** "−$295", "+$200", "$0". */
export const signedMoney = (x: number) => `${x < 0 ? "−" : x > 0 ? "+" : ""}${dollars(x)}`;

/** The ticket's one line: "Cash out $550 · locks in −$295 · frees $8,000". */
export function actLine(figures: ActFigures, verb: ActVerb): string {
  const cash = `${verb.pays ? "Cash out" : "Cash in"} ${dollars(figures.cash)}`;
  const frees = figures.frees ? ` · frees ${figures.frees}` : "";
  return `${cash} · locks in ${signedMoney(figures.locksIn)}${frees}`;
}

/** The recap's "Risk after": what is still at stake on this position once the order fills. */
export function riskAfter(position: DeskPosition, left: number): string {
  if (left > 0) {
    const unit = position.isOption ? "contract" : "share";
    return `${left.toLocaleString("en-US")} ${unit}${left === 1 ? "" : "s"} stay open, at the risk they carry now.`;
  }
  return position.isOption && held(position.quantity).short
    ? "None from this position: it closes, so it can't be assigned."
    : "None from this position: it closes.";
}
