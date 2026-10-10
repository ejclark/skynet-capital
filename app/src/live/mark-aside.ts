import { closeHasPassed, nextSessionAfterToday } from "./market-session";
import type { MarkKind, MarkWatch, PositionMark } from "./position-mark";

/**
 * NOT NOW (#5070; Eric, 468e3897: "worth a look first" is a setting, "easy to dismiss or
 * bypass"). Not now steps one row's mark aside until a stated return condition:
 *  - the close of the next trading session (a mark set aside on a Thursday afternoon is back after
 *    Friday's close; weekends and the exchange's holidays skipped by `market-calendar.ts`), or
 *  - sooner, when the stock trades through the price the mark names (a sold option's strike).
 * Only that mark is set aside: a different mark on the row is a new fact and shows at once.
 *
 * Per viewer and per account, in this browser alone, like the pager's snoozes it replaces: a way
 * of looking, never a record. Every read is wrapped; without storage it lasts the visit.
 */

export interface AsideEntry {
  /** The position's own symbol (an OCC symbol for an option). */
  readonly symbol: string;
  /** The mark that was set aside. */
  readonly kind: MarkKind;
  /** The New York date whose close brings the mark back. */
  readonly until: string;
  readonly watch?: MarkWatch;
}

const key = (deskId: string) => `skynet.marks.aside.${deskId}`;

const KINDS: readonly string[] = ["review", "consider", "onplan"];

function isEntry(x: unknown): x is AsideEntry {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  const w = e.watch as Record<string, unknown> | undefined;
  return (
    typeof e.symbol === "string" &&
    typeof e.kind === "string" &&
    KINDS.includes(e.kind) &&
    typeof e.until === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.until) &&
    (w === undefined ||
      (typeof w.symbol === "string" &&
        typeof w.price === "number" &&
        (w.side === "below" || w.side === "above")))
  );
}

export function readAside(deskId: string): AsideEntry[] {
  try {
    const raw = window.localStorage.getItem(key(deskId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function writeAside(deskId: string, entries: readonly AsideEntry[]): void {
  try {
    window.localStorage.setItem(key(deskId), JSON.stringify(entries));
  } catch {
    // Private windows and blocked storage: the mark just stays aside for this visit.
  }
}

/** Set `mark` aside on `symbol` at `now`. */
export function asideFor(symbol: string, mark: PositionMark, now: Date = new Date()): AsideEntry {
  return {
    symbol,
    kind: mark.kind,
    until: nextSessionAfterToday(now),
    ...(mark.watch ? { watch: mark.watch } : {}),
  };
}

/** Is `mark` still set aside? `spot` is the watched stock's price, when the book has one. */
export function asideHolds(
  entry: AsideEntry,
  mark: PositionMark,
  now: Date = new Date(),
  spot?: number,
): boolean {
  if (entry.kind !== mark.kind) return false;
  if (closeHasPassed(entry.until, now)) return false;
  const w = entry.watch;
  if (w && spot !== undefined && (w.side === "below" ? spot < w.price : spot > w.price))
    return false;
  return true;
}

const weekday = (date: string, style: "short" | "long") =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: style, timeZone: "UTC" });

/** The return condition, short for the row ("till Fri close") and in full where there is room. */
export function asideWords(entry: AsideEntry): { readonly short: string; readonly full: string } {
  const w = entry.watch;
  const sooner = w ? `, or sooner if ${w.symbol} trades ${w.side} $${w.price.toFixed(2)}` : "";
  return {
    short: `till ${weekday(entry.until, "short")} close`,
    full: `Back after ${weekday(entry.until, "long")}'s close${sooner}.`,
  };
}
