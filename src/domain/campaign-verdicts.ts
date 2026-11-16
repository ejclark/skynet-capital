/**
 * THE HOUSE'S WORD ON A NAME — what a campaign's lesson record says about one symbol, and how old
 * it is (#6952 slices 3 and 4). Find names reveals it after the member's pick
 * (campaign-encounters.ts); build a strategy shows it beside the doors a name can go through
 * (campaign-strategy.ts). One function says it for both, so the two modes can never disagree about
 * a name.
 *
 * OLD RESEARCH IS SAID TO BE OLD (criterion 3). Research older than `STALE_AFTER_DAYS` is labelled
 * with its age. The lesson record has no "enterable" kind, so the house's verdict is watch, stand
 * aside, or check first. A watch past the line is check first. A kill past the line still stands
 * aside and says its age: criterion 8 reopens a kill only on its re-check date or on prints that
 * contradict it, never by age, and standing aside is the direction a stale call is safe to err in.
 *
 * Pure: everything it reads is handed in. Paper only; educational. A verdict never places, sizes or
 * recommends an order.
 */
import { dayNumber } from "./campaign-landscape.js";
import type { DiscoveryBrief, Lesson } from "./campaign-lessons.js";
import { anchorOf, type Campaign, type Evidence } from "./campaigns.js";
import { TICKER_DIRECTORY } from "./ticker-directory/index.js";

/** Research older than this many days is labelled stale and re-checked (criterion 3). */
export const STALE_AFTER_DAYS = 30;

/** One statement in an answer or a check, with how sure its record is. */
export interface Claim {
  readonly text: string;
  readonly mark: Evidence;
  readonly source: string;
  /** YYYY-MM-DD: the day the record behind it says it was true. */
  readonly date: string;
}

/** Research past the line: its age, and what a discovery re-checks before it is shown as current. */
export interface Stale {
  readonly since: string;
  readonly days: number;
}

export type HouseVerdict = "watch" | "stand-aside" | "check-first";

/** The house's verdict on one name, why, and the lesson it rests on when one does. */
export interface HouseCall {
  readonly verdict: HouseVerdict;
  readonly why: string;
  readonly lesson?: string;
  readonly stale?: Stale;
}

const ageOf = (date: string, today: string): number =>
  Math.round(dayNumber(today) - dayNumber(date));

export function staleOf(date: string, today: string): Stale | undefined {
  const days = ageOf(date, today);
  return days > STALE_AFTER_DAYS ? { since: date.slice(0, 10), days } : undefined;
}

const FUNDS: ReadonlySet<string> = new Set(
  TICKER_DIRECTORY.filter((e) => e.sector === "ETF").map((e) => e.symbol.toUpperCase()),
);

/** A fund is a benchmark the campaign is read against, not a name to find or build on. */
export const isFund = (campaign: Campaign, symbol: string): boolean =>
  FUNDS.has(symbol) || symbol === anchorOf(campaign).fund;

/** A lesson as a claim: its idea and the day it was recorded. */
export const lessonClaim = (lesson: Lesson): Claim => ({
  text: lesson.idea,
  mark: "reported",
  source: lesson.source,
  date: lesson.on,
});

/** The lessons that name a symbol, closed kills first, as the brief sorts them. */
export const lessonsNaming = (symbol: string, brief: DiscoveryBrief): readonly Lesson[] =>
  [...brief.closed, ...brief.reopened, ...brief.due, ...brief.watching].filter((x) =>
    x.symbols.includes(symbol),
  );

/** The house's verdict on one name, from the lesson that names it. A watch past the line → check first. */
export function houseCall(symbol: string, brief: DiscoveryBrief, today: string): HouseCall {
  const names = (l: Lesson): boolean => l.symbols.includes(symbol);
  const closed = brief.closed.find(names);
  if (closed) {
    const stale = staleOf(closed.on, today);
    return {
      verdict: "stand-aside",
      why: `Killed on ${closed.on}.${closed.recheckOn ? ` Next re-check ${closed.recheckOn}.` : ""}${closed.falsifier ? ` What would reopen it: ${closed.falsifier}` : ""}`,
      lesson: closed.id,
      ...(stale ? { stale } : {}),
    };
  }
  const reopened = brief.reopened.find(names);
  if (reopened)
    return {
      verdict: "check-first",
      why: `Killed on ${reopened.on}, and that kill is open again: its re-check date passed or new prints contradict it.`,
      lesson: reopened.id,
    };
  const due = brief.due.find(names);
  if (due)
    return {
      verdict: "check-first",
      why: `On watch since ${due.on}, and due for its re-check on ${due.recheckOn}.`,
      lesson: due.id,
    };
  const watching = brief.watching.find(names);
  if (watching) {
    const stale = staleOf(watching.on, today);
    if (stale)
      return {
        verdict: "check-first",
        why: `On watch since ${watching.on}, ${stale.days} days ago: past the ${STALE_AFTER_DAYS}-day line.`,
        lesson: watching.id,
        stale,
      };
    return {
      verdict: "watch",
      why: `On watch since ${watching.on}; next re-check ${watching.recheckOn}.${watching.falsifier ? ` What would prove the watch wrong: ${watching.falsifier}` : ""}`,
      lesson: watching.id,
    };
  }
  return {
    verdict: "check-first",
    why: "No finding on record yet: the house checks it before it says anything.",
  };
}
