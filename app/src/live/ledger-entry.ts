import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import { withMinus } from "../ui/numbers";
import type { DeskActivityEvent, DeskActivityLine, Tone } from "./desk";
import {
  cashMoved,
  dayDate,
  expiryWords,
  instrumentWords,
  orderDayKey,
  priceOf,
  sideWord,
  statusMark,
} from "./order-facts";

/**
 * ONE LEDGER ENTRY, AS ITS LEGS (#5317; #5160 rounds 9–15, the "receipt"). An entry is the orders
 * that make it up, never a symbol header over them (round 14: "i don't like how this converts a
 * single transaction into two lines"):
 *  - a single order is one leg, with where it stands — `open`, `closed Oct 1`, `✕ canceled`;
 *  - a close is a round trip: the close first, then each order it closed, muted and newest first
 *    (round 14: "the latest event (sold) should be listed first"), then a total — what it was, how
 *    long it was held, and the realized result the server's round-trip matcher computed.
 * Both layouts draw from this: the phone's cards (`ledger-cards.tsx`) and the desk's table
 * (`ledger-table.tsx`). Sizes say their unit ("15 shares", "1 contract"), and every figure keeps
 * its sign — no paid / received / booked words (round 15).
 */

interface LegWords {
  /** What happened: "SOLD", "BOUGHT" — "BUY" while unfilled, "EXPIRED" for a broker's report. */
  readonly side: string;
  readonly size: string;
  /** The stock, an option's underlying, or a spread's own name. */
  readonly name: string;
  /** An option's contract: "$80 PUT · Nov 6". */
  readonly contract?: string;
  /** The fill price a share: "$761.00". */
  readonly price?: string;
}

export interface EntryLeg {
  /** Unique within its entry — a list key. */
  readonly key: string;
  readonly words: LegWords;
  /** The cash the leg moved, signed. */
  readonly cash?: number;
  /** An order the entry's close closed: drawn quieter, its own day beside its price. */
  readonly opened?: { readonly orderId: string; readonly day: string };
}

interface EntryTotal {
  /** "META", "CRWV $80 PUT". */
  readonly name: string;
  /** "9 days", "1 day", "same day". */
  readonly held: string;
  /** "Sep 22 → Oct 1". */
  readonly range: string;
}

export interface LedgerEntry {
  /** The order itself first, then any it closed. */
  readonly legs: readonly EntryLeg[];
  /** A round trip's bottom line; absent on a single order. */
  readonly total?: EntryTotal;
  /** The Outcome column: a round trip's (or a closing spread's) realized result, signed; else where
   *  the order stands. */
  readonly outcome?: { readonly text: string; readonly tone?: Tone };
}

const DAY_MS = 86_400_000;

/** "15 shares", "1 contract", "3 of 10 shares" while part of it filled, "1 spread". */
function sizeWords(
  line: Pick<DeskActivityLine, "symbol" | "lifecycle">,
  count: number,
  of?: number,
): string {
  const unit = line.symbol === "" ? "spread" : parseOccSymbol(line.symbol) ? "contract" : "share";
  const whole = of !== undefined && of !== count ? of : count;
  const plural = whole === 1 ? unit : `${unit}s`;
  return of !== undefined && of !== count ? `${count} of ${of} ${plural}` : `${count} ${plural}`;
}

const LIFECYCLE_WORD: Record<NonNullable<DeskActivityLine["lifecycle"]>, string> = {
  OPEXP: "EXPIRED",
  OPASN: "ASSIGNED",
  OPEXC: "EXERCISED",
  OPTRD: "SETTLED",
};

/** A leg's words. `matched` is the part of an opened order the entry's close took. */
function legWords(
  line: DeskActivityLine & Pick<DeskActivityEvent, "legs">,
  matched?: number,
  now: Date = new Date(),
): LegWords {
  const side = line.lifecycle ? LIFECYCLE_WORD[line.lifecycle] : sideWord(line);
  const size =
    matched !== undefined
      ? sizeWords(line, matched, line.filled)
      : line.filled > 0
        ? sizeWords(line, line.filled, line.quantity)
        : sizeWords(line, line.quantity);
  const occ = parseOccSymbol(line.symbol);
  const price =
    line.lifecycle || line.symbol === "" || line.filled <= 0 || priceOf(line.price) === undefined
      ? undefined
      : line.price;
  return {
    side,
    size,
    name: occ ? occ.underlying : line.symbol === "" ? instrumentWords(line, now) : line.display,
    ...(occ
      ? {
          contract: `${occStrikeLabel(occ.strike)} ${occ.type.toUpperCase()} · ${expiryWords(occ.expiration, now)}`,
        }
      : {}),
    ...(price ? { price } : {}),
  };
}

/** What follows the name — the phone's second line, before any day: "$80 PUT · Nov 6 at $2.55",
 *  "at $761.00". */
export function legTail(words: LegWords): string {
  return [words.contract, words.price ? `at ${words.price}` : undefined].filter(Boolean).join(" ");
}

/** Days from one day key to another: "same day", "1 day", "9 days". */
function heldWords(fromKey: string, toKey: string): string {
  const days = Math.round((Date.parse(toKey) - Date.parse(fromKey)) / DAY_MS);
  if (!Number.isFinite(days) || days <= 0) return "same day";
  return days === 1 ? "1 day" : `${days} days`;
}

/** Where a single order stands: a dead or working order's own mark, else `closed Oct 1` once
 *  nothing of it is open, else `open`. Never on a broker's report, and never where the matcher cannot
 *  see the close — a stock sale with nothing to pair (its buy is older than the ledger), or an option
 *  past its expiry (an exercise or a settlement ends it without a fill the matcher reads), whose
 *  standing is left unsaid rather than guessed. */
function standing(event: DeskActivityEvent, now: Date): string | undefined {
  if (event.lifecycle) return undefined;
  const mark = statusMark(event);
  if (mark) return mark;
  if (event.closedOn) return `closed ${dayDate(orderDayKey({ at: event.closedOn }), now)}`;
  if (event.filled <= 0 || pastExpiry(event, now)) return undefined;
  const stockSale = event.side === "sell" && event.symbol !== "" && !parseOccSymbol(event.symbol);
  return stockSale ? undefined : "open";
}

/** True once an option's (or a spread's first leg's) expiry day is behind New York's today. */
function pastExpiry(event: DeskActivityEvent, now: Date): boolean {
  const occ = parseOccSymbol(event.symbol) ?? parseOccSymbol(event.legs?.[0]?.symbol ?? "");
  if (!occ) return false;
  return occ.expiration < orderDayKey({ at: now.toISOString() });
}

function realized(event: DeskActivityEvent): LedgerEntry["outcome"] {
  if (!event.realizedPl) return undefined;
  return {
    text: withMinus(event.realizedPl),
    ...(event.realizedTone ? { tone: event.realizedTone } : {}),
  };
}

/** An order as its ledger entry. */
export function ledgerEntry(event: DeskActivityEvent, now: Date = new Date()): LedgerEntry {
  const own: EntryLeg = {
    key: "own",
    words: legWords(event, undefined, now),
    ...cashOf(event),
  };
  const opened = event.opened ?? [];
  if (opened.length === 0) {
    const outcome = realized(event) ?? textOutcome(standing(event, now));
    return { legs: [own], ...(outcome ? { outcome } : {}) };
  }
  const legs = opened.map(
    (leg): EntryLeg => ({
      key: `${leg.orderId}|${leg.at}|${leg.matched}`,
      words: legWords(leg, leg.matched, now),
      ...cashOf({ ...leg, filled: leg.matched }),
      opened: { orderId: leg.orderId, day: dayDate(orderDayKey(leg), now) },
    }),
  );
  const firstKey = opened.map((leg) => orderDayKey(leg)).sort()[0] as string;
  const lastKey = orderDayKey(event);
  const outcome = realized(event);
  return {
    legs: [own, ...legs],
    total: {
      name: [own.words.name, totalContract(event.symbol)].filter(Boolean).join(" "),
      held: heldWords(firstKey, lastKey),
      range: `${dayDate(firstKey, now)} → ${dayDate(lastKey, now)}`,
    },
    ...(outcome ? { outcome } : {}),
  };
}

function textOutcome(text: string | undefined): LedgerEntry["outcome"] {
  return text ? { text } : undefined;
}

function cashOf(line: DeskActivityEvent): Pick<EntryLeg, "cash"> {
  const cash = cashMoved(line);
  return cash ? { cash: cash.dollars } : {};
}

/** An option's strike and kind for the total — "$80 PUT"; the expiry stays on the legs. */
function totalContract(symbol: string): string | undefined {
  const occ = parseOccSymbol(symbol);
  return occ ? `${occStrikeLabel(occ.strike)} ${occ.type.toUpperCase()}` : undefined;
}
