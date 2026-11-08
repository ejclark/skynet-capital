import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import {
  dateWordsOf,
  FAST_TRACK_HORIZON_DAYS,
  type FastTrackEvent,
  NOT_COVERED,
  NOT_RESEARCHED,
  rankEvents,
} from "../domain/fast-track.js";
import { eventsWithin, type MarketEvent } from "../domain/market-events.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import { fastTrackEventOf } from "./fast-track-ledger.js";
import { RESEARCH_DIR } from "./research-service.js";

/**
 * THE CHAT'S CALENDAR LOOKUP (#7034 slice 3a): "What's coming up that I should watch?" answered in
 * Moneypenny's rail from the same fortnight, the same ranking and the same ledger read as the fast
 * track's first card (`src/domain/fast-track.ts`, `./fast-track-ledger.ts`). It is the fast speed of
 * the plan's "one input, two speeds": a question the chat's tools can now answer instead of guessing.
 *
 * ONE RANKING, NOT TWO. The rows come out of `rankEvents` — the member's held names first, then
 * impact, then date — so the chat and the card can never order one fortnight differently. The
 * watchlist is not read: it lives in the app (`app/src/live/watchlist.ts`), not on the server, and
 * the result says so (`rankedBy`) rather than letting "your names first" imply it was checked.
 *
 * FIVE LEDGERS AT MOST. The fortnight holds ~110 events; a ledger is read only for the rows the
 * answer shows, straight from `docs/research/events/<id>.md`. The id comes from the checked-in
 * calendar, never from the member, and is checked against the slug shape before it touches a path.
 *
 * HONESTY. Every row says whether its date is confirmed or an estimate in words, gives the house's
 * written stance or "not researched yet", and the answer names the sources it does not read (news,
 * lawsuits) — criteria 2 and 7, the same strings the card shows. Read-only; nothing here trades.
 */

/** How many events one answer shows; the rest are counted, never dropped silently. */
export const UPCOMING_ROWS = 5;
/** Kill switches per row — enough for "what would prove it wrong", short enough for a chat turn. */
const KILL_SWITCHES_SHOWN = 3;
/** A sector event can name dozens of tickers; the row carries the first few and a count. */
const SYMBOLS_SHOWN = 5;
const LEDGER_SLUG = /^[a-z0-9][a-z0-9-]*$/;

export interface UpcomingEventRow {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly dateWords: "date confirmed" | "date is an estimate";
  readonly impact: MarketEvent["impact"];
  /** Up to five of the event's tickers; empty for a market-wide print (CPI, FOMC). */
  readonly symbols: readonly string[];
  readonly moreSymbols?: number;
  /** The member's own held names this event touches, when it touches any. */
  readonly onYourBook?: readonly string[];
  /** The house's written stance from its ledger, or "not researched yet". */
  readonly stance: string;
  /** The ledger's kill switches that can still fire — what would prove the stance wrong. */
  readonly killSwitches: readonly string[];
}

export interface UpcomingEvents {
  readonly asOf: string;
  readonly horizonDays: number;
  /** Set when the member asked about one ticker: only events naming it are listed. */
  readonly underlying?: string;
  readonly events: readonly UpcomingEventRow[];
  /** Events in the window not shown here — a floor on what else is coming, never zero by omission. */
  readonly more: number;
  readonly rankedBy: string;
  readonly notCovered: string;
}

export interface UpcomingEventsQuery {
  /** The market day, YYYY-MM-DD. */
  readonly asOf: string;
  /** Position symbols on the member's own desk; an option contract counts as its underlying. */
  readonly held: readonly string[];
  /** One ticker to narrow to, already validated as an underlying by the caller. */
  readonly underlying?: string;
  /** Specs pass a frozen calendar, its prints and a fixture shelf; production reads the real ones. */
  readonly events?: readonly MarketEvent[];
  readonly prints?: readonly EarningsPrint[];
  readonly root?: string;
}

/** A desk's position symbols as the tickers events name: an option contract reads as its underlying. */
export function heldNames(symbols: readonly string[]): string[] {
  return [...new Set(symbols.map((s) => parseOccSymbol(s)?.underlying ?? s))];
}

function ledgerOf(root: string, id: string): string | undefined {
  if (!LEDGER_SLUG.test(id)) return undefined;
  const file = join(root, "events", `${id}.md`);
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

function rowOf(item: FastTrackEvent, held: readonly string[]): UpcomingEventRow {
  const { event } = item;
  const mine = event.symbols.filter((s) => held.includes(s));
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    dateWords: dateWordsOf(event),
    impact: event.impact,
    symbols: event.symbols.slice(0, SYMBOLS_SHOWN),
    ...(event.symbols.length > SYMBOLS_SHOWN
      ? { moreSymbols: event.symbols.length - SYMBOLS_SHOWN }
      : {}),
    ...(mine.length > 0 ? { onYourBook: mine } : {}),
    stance: item.stance ?? NOT_RESEARCHED,
    killSwitches: item.killSwitches.slice(0, KILL_SWITCHES_SHOWN),
  };
}

/** The next fortnight's events as the chat reads them: ranked like the card, ledgers for the top five. */
export function upcomingEvents(query: UpcomingEventsQuery): UpcomingEvents {
  const { asOf, underlying } = query;
  const root = query.root ?? RESEARCH_DIR();
  const held = heldNames(query.held);
  const window = eventsWithin(asOf, FAST_TRACK_HORIZON_DAYS, query.events, query.prints).filter(
    (e) => !underlying || e.symbols.includes(underlying),
  );
  const ranked = rankEvents({
    asOf,
    events: window.map((event) => ({ event, killSwitches: [] })),
    book: { held, watched: [] },
  });
  const shown = ranked
    .slice(0, UPCOMING_ROWS)
    .map(({ event }) => rowOf(fastTrackEventOf(event, ledgerOf(root, event.id), asOf), held));
  return {
    asOf,
    horizonDays: FAST_TRACK_HORIZON_DAYS,
    ...(underlying ? { underlying } : {}),
    events: shown,
    more: ranked.length - shown.length,
    rankedBy:
      held.length > 0
        ? "events on the member's held names first, then impact, then date; the watchlist is not read here"
        : "impact, then date; no held names to put first, and the watchlist is not read here",
    notCovered: NOT_COVERED,
  };
}
