import {
  OPTION_MULTIPLIER,
  type OptionContractParts,
  occStrikeLabel,
  parseOccSymbol,
} from "../../../src/trading/option-symbols";
import type { DeskActivityEvent, DeskActivityLeg } from "./desk";

/**
 * WHAT ONE ORDER SAYS, READ OFF ITS ROW (#5101, round 2 of #5037, the activity question). The phone
 * card (`activity-cards.tsx`) draws an order in two lines — what happened, then the bet it made —
 * and every word on them comes from here, computed in the browser from fields the row already
 * carries: the side, the size, the fill price, the contract. Nothing here is a forecast: an order is
 * a past decision, so it says what was bet and what moved, never what a model expects next.
 *
 * Each reader returns `undefined` rather than a guess when the row cannot support it — a spread
 * whose legs are not all in the ledger has no bet in words, an order that never filled moved no
 * cash. Absence is named by the card, never papered over here.
 */

const MINUS = "−";
const ET = "America/New_York";

/** What the order did, as a past-tense word once it filled — "SOLD", "BOUGHT" — and as the
 *  instruction it was while it had not ("SELL", "BUY"): a canceled buy bought nothing. */
export function sideWord(event: Pick<DeskActivityEvent, "side" | "filled">): string {
  if (event.filled > 0) return event.side === "buy" ? "BOUGHT" : "SOLD";
  return event.side === "buy" ? "BUY" : "SELL";
}

/** The size the row states: the filled count, or "3/10" while part of it filled. */
export function sizeWord(event: Pick<DeskActivityEvent, "filled" | "quantity">): string {
  return event.filled > 0 && event.filled !== event.quantity
    ? `${event.filled}/${event.quantity}`
    : String(event.quantity);
}

/** A broker price string ("$1,234.50", "—") as a number; undefined when it names none. */
export function priceOf(text: string): number | undefined {
  const plain = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(plain)) return undefined;
  return Number(plain);
}

/** Whole dollars past $100 and cents below, signed with a true minus: "+$255", "−$9,044", "+$45.50". */
export function signedDollars(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 2;
  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${value < 0 ? MINUS : "+"}$${body}`;
}

export interface CashMoved {
  /** "paid" when cash left the account, "received" when it came in. */
  readonly word: "paid" | "received";
  /** Signed: negative for paid, positive for received. */
  readonly dollars: number;
}

/**
 * The cash the order moved — shares × price, or contracts × 100 × price; a spread's net as the
 * server worded it once ("$335.00 paid"). Undefined when nothing filled at a known price, and on an
 * expiry or assignment report, which is not a trade at a price.
 */
export function cashMoved(event: DeskActivityEvent): CashMoved | undefined {
  if (event.lifecycle) return undefined;
  if (event.net !== undefined) {
    const match = /^\$?([\d,]+(?:\.\d+)?)\s+(paid|received)/.exec(event.net.trim());
    if (!match) return undefined;
    const amount = Number((match[1] as string).replace(/,/g, ""));
    const word = match[2] as CashMoved["word"];
    return { word, dollars: word === "paid" ? -amount : amount };
  }
  const price = priceOf(event.price);
  if (event.filled <= 0 || price === undefined) return undefined;
  // To the cent: 1 × $2.55 × 100 is 254.99999999999997 in floating point.
  const amount =
    Math.round(
      event.filled * price * (parseOccSymbol(event.symbol) ? OPTION_MULTIPLIER : 1) * 100,
    ) / 100;
  return event.side === "buy"
    ? { word: "paid", dollars: -amount }
    : { word: "received", dollars: amount };
}

/** "Nov 6" for an expiry this year, "Jan 15, 2027" for one in another — never a bare "6 NOV 26". */
export function expiryWords(expiration: string, now: Date = new Date()): string {
  const [year, month, day] = expiration.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(year === now.getUTCFullYear() ? {} : { year: "numeric" }),
  });
}

/** The row's first line after its side and size: "CRWV $80 PUT · Nov 6", "NVDA at $226.10", or a
 *  spread's own name as the server wrote it. */
export function instrumentWords(
  event: Pick<DeskActivityEvent, "symbol" | "display" | "price" | "lifecycle" | "legs">,
  now: Date = new Date(),
): string {
  const occ = parseOccSymbol(event.symbol);
  if (occ) {
    return `${occ.underlying} ${occStrikeLabel(occ.strike)} ${occ.type.toUpperCase()} · ${expiryWords(occ.expiration, now)}`;
  }
  if (event.symbol === "") {
    // A spread's name as the server wrote it, its expiry said the way a single contract's is.
    const expiry = parseOccSymbol(event.legs?.[0]?.symbol ?? "")?.expiration;
    return expiry
      ? event.display.replace(/ · \d{1,2} [A-Z]{3} \d{2}$/, ` · ${expiryWords(expiry, now)}`)
      : event.display;
  }
  if (event.lifecycle || priceOf(event.price) === undefined) return event.display;
  return `${event.display} at ${event.price}`;
}

/**
 * The bet an order made, as a shape and a few words — the row's second line. Read off the contract,
 * never off a direction word: a sold put is a bet the stock STAYS ABOVE its strike, which "▼ SELL"
 * beside a rising arrow once read as a contradiction (round 1's C).
 *  - `rises` / `falls`: a bought share, call or put; a debit spread.
 *  - `above` / `below`: a sold put or call; a credit spread — the stock only has to stay put.
 *  - `closed`: a fill that closed what an earlier one opened (it booked a result).
 *  - `sold`: a share sale whose opening buy this ledger does not show, so whether it closed a
 *    holding or opened a short is not on the row — said as what happened, no direction claimed.
 */
export type BetShape = "rises" | "falls" | "above" | "below" | "closed" | "sold";

export interface Bet {
  readonly shape: BetShape;
  readonly words: string;
}

/** A two-leg vertical, read off its legs: which strike the account holds and which it wrote. */
function spreadBet(legs: readonly DeskActivityLeg[]): Bet | undefined {
  if (legs.length !== 2) return undefined;
  const parts = legs.map((leg) => ({ leg, occ: parseOccSymbol(leg.symbol) }));
  const long = parts.find((p) => p.leg.side === "buy");
  const short = parts.find((p) => p.leg.side === "sell");
  if (!(long?.occ && short?.occ)) return undefined;
  if (long.occ.type !== short.occ.type || long.occ.expiration !== short.occ.expiration) {
    return undefined;
  }
  return verticalBet(long.occ, short.occ);
}

function verticalBet(long: OptionContractParts, short: OptionContractParts): Bet | undefined {
  if (long.strike === short.strike) return undefined;
  if (long.type === "call") {
    return long.strike < short.strike
      ? { shape: "rises", words: `Rises above ${occStrikeLabel(long.strike)}` }
      : { shape: "below", words: `Stays below ${occStrikeLabel(short.strike)}` };
  }
  return long.strike > short.strike
    ? { shape: "falls", words: `Falls below ${occStrikeLabel(long.strike)}` }
    : { shape: "above", words: `Stays above ${occStrikeLabel(short.strike)}` };
}

export function orderBet(event: DeskActivityEvent): Bet | undefined {
  if (event.lifecycle) return undefined;
  if (event.realizedPl !== undefined) return { shape: "closed", words: "Closed" };
  if (event.symbol === "") return event.legs ? spreadBet(event.legs) : undefined;
  const occ = parseOccSymbol(event.symbol);
  const strike = occ ? occStrikeLabel(occ.strike) : "";
  if (!occ) {
    return event.side === "buy"
      ? { shape: "rises", words: "Rises" }
      : { shape: "sold", words: "Sold" };
  }
  if (event.side === "buy") {
    return occ.type === "call"
      ? { shape: "rises", words: `Rises above ${strike}` }
      : { shape: "falls", words: `Falls below ${strike}` };
  }
  return occ.type === "put"
    ? { shape: "above", words: `Stays above ${strike}` }
    : { shape: "below", words: `Stays below ${strike}` };
}

/** A status worth a word on the row — never "filled", which is what a row is by default. A dead
 *  order wears ✕, a live one ◷: a shape with the word, so the state is never a tone alone. */
export function statusMark(
  event: Pick<DeskActivityEvent, "status" | "lifecycle">,
): string | undefined {
  if (event.lifecycle) return undefined;
  const word = event.status.replace(/_/g, " ").trim().toLowerCase();
  if (word === "" || word === "filled") return undefined;
  return /^(canceled|cancelled|expired|rejected|done for day|stopped)$/.test(word)
    ? `✕ ${word}`
    : `◷ ${word}`;
}

/** The market day an order belongs to: an order's in New York time, where the session is; an
 *  expiry or assignment report's in UTC, its stamp being a date with a synthetic end-of-day time
 *  (`lifecycle-day.ts` says why that matters). */
export function orderDayKey(event: Pick<DeskActivityEvent, "at" | "lifecycle">): string {
  const stamp = new Date(event.at);
  if (Number.isNaN(stamp.getTime())) return event.at.slice(0, 10);
  if (event.lifecycle) return stamp.toISOString().slice(0, 10);
  return stamp.toLocaleDateString("en-CA", { timeZone: ET });
}

/** A day key's weekday and date — ["Tue", "Oct 6"], the year added when it is not this one. */
function dayParts(key: string, now: Date): [string, string] | undefined {
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  if (!(year && month && day)) return undefined;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const thisYear = new Date(now).toLocaleDateString("en-CA", { timeZone: ET }).slice(0, 4);
  return [weekday, `${monthDay}${String(year) === thisYear ? "" : `, ${year}`}`];
}

/** A day key as the cards' header: "TUE · OCT 6", the year added when it is not this one. */
export function dayHeader(key: string, now: Date = new Date()): string {
  const parts = dayParts(key, now);
  return parts ? parts.join(" · ").toUpperCase() : key;
}

/** A day key in a sentence: "Tue Oct 6". */
export function dayWords(key: string, now: Date = new Date()): string {
  return dayParts(key, now)?.join(" ") ?? key;
}

/** The time of day an order filled or was placed, in New York time and saying so — "10:31 AM ET".
 *  Undefined for an expiry or assignment, whose stamp is a date, not a moment. */
export function orderTime(event: Pick<DeskActivityEvent, "at" | "lifecycle">): string | undefined {
  if (event.lifecycle) return undefined;
  const stamp = new Date(event.at);
  if (Number.isNaN(stamp.getTime())) return undefined;
  const time = stamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ET,
  });
  return `${time} ET`;
}

/** Rows grouped under their market day, in the order the days first appear (the ledger is newest
 *  first), each day's rows in the order given — one header a day even when a report's UTC day
 *  lands it among another day's orders. */
export function byDay<T extends Pick<DeskActivityEvent, "at" | "lifecycle">>(
  events: readonly T[],
): { readonly key: string; readonly events: readonly T[] }[] {
  const days = new Map<string, T[]>();
  for (const event of events) {
    const key = orderDayKey(event);
    const day = days.get(key);
    if (day) day.push(event);
    else days.set(key, [event]);
  }
  return [...days].map(([key, rows]) => ({ key, events: rows }));
}
