import { occStrikeLabel } from "../../../src/trading/option-symbols";
import type { BookEvent } from "./book-events";
import { type SymbolBook, type SymbolOption, wholeDollars } from "./symbol-book";

/**
 * WHY EACH DATE MATTERS, ON ONE SYMBOL (#6082 slice 2, criterion 7; Eric, round 3: "Dead final week
 * is a confusion point on vernacular"). Events narrowed by `?symbol=` says, under each date, what it
 * does to what you hold on that symbol — in plain words, from the contract's own terms and the house
 * call, never a guess:
 *
 *   an expiry      what each side of the strike does: "above $80 keeps the $255; below buys 100
 *                  shares at $80" (a sold call the mirror; a bought option ends worth what it is in
 *                  the money)
 *   an earnings    whether the option is still alive for it: "the put is gone by then", or "lands
 *                  before the $80 put expires — it can move it" (an estimate is already said in
 *                  the row's title, so never twice)
 *   a market print the house call when the research states one, else that it moves every position
 *                  and the house has no call on it; a print on an option's last day says so
 *
 * Pure; undefined when there is nothing honest to add (the title already says it all).
 */

const shares = (contracts: number): string => `${(contracts * 100).toLocaleString("en-US")} shares`;

/** What an option's last day does, side by side of its strike. */
export function expiryWhy(o: SymbolOption): string {
  const at = occStrikeLabel(o.strike);
  if (!o.short) return `ends worth only what it is past ${at}`;
  const keeps =
    o.premium !== undefined ? `keeps the ${wholeDollars(o.premium)}` : "keeps the premium";
  return o.type === "put"
    ? `above ${at} ${keeps}; below buys ${shares(o.contracts)} at ${at}`
    : `below ${at} ${keeps}; above sells ${shares(o.contracts)} at ${at}`;
}

const options = (book: SymbolBook): SymbolOption[] =>
  book.rows.flatMap((r) => (r.option ? [r.option] : []));

const optionName = (o: SymbolOption): string => `${occStrikeLabel(o.strike)} ${o.type}`;

/** An option whose last day this event is (an expiry or a decision on it). The event's own `on`
 *  names the contract — two options on the symbol can share a last day (a spread's two legs, two
 *  accounts on one expiry), so the date alone would lend one contract's terms to the other (#6284).
 *  A named contract the book does not hold says nothing; the date decides only when `on` is absent. */
function expiringOn(event: BookEvent, book: SymbolBook): SymbolOption | undefined {
  const isExpiry = event.mark === "Expires" || /expires/i.test(event.what ?? "");
  if (!isExpiry) return undefined;
  const { on } = event;
  if (!on) return options(book).find((o) => o.expiry === event.date);
  return book.rows.find((r) => r.key === `${on.deskId} ${on.symbol}`)?.option;
}

function printWhy(event: BookEvent, book: SymbolBook): string {
  const alive = options(book).filter((o) => o.expiry >= event.date);
  const gone = options(book).filter((o) => o.expiry < event.date);
  const [first] = alive;
  if (first) return `lands before the ${optionName(first)} expires — it can move it`;
  const [last] = gone;
  if (last) return `the ${optionName(last)} is gone by then`;
  return "can move the shares";
}

function marketWhy(event: BookEvent, book: SymbolBook): string {
  const call = event.call ? `house call: ${event.call.call.toLowerCase()}` : "no house call on it";
  const last = options(book).find((o) => o.expiry === event.date);
  return last
    ? `same day the ${optionName(last)} expires; ${call}`
    : event.call
      ? call
      : `moves every position; ${call}`;
}

/** The plain-words why for one date on the symbol's view; undefined when nothing honest is left
 *  to say. */
export function whyOn(event: BookEvent, book: SymbolBook): string | undefined {
  const expiring = expiringOn(event, book);
  if (expiring) return expiryWhy(expiring);
  if (event.tier === "market") return marketWhy(event, book);
  if (/earnings/i.test(`${event.mark ?? ""} ${event.title}`)) return printWhy(event, book);
  return undefined;
}

/** A row's why on a one-symbol view, nothing on every symbol — the section asks once per row. */
export const whyFor =
  (book: SymbolBook | undefined) =>
  (event: BookEvent): string | undefined =>
    book ? whyOn(event, book) : undefined;
