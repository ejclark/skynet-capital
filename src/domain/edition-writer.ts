/**
 * THE EDITION WRITER: the day's edition, built from market data after a close (#8252, #8161 shape 5
 * step 7). The landing page reads `edition.ts`'s record through `/api/edition`; until this module
 * only a hand wrote that record, and the one on file went 17 days stale.
 *
 * NUMBERS FROM CODE ONLY. Every figure on a story's cards (its facts, reports and more lines) and in
 * what's next is computed here from the inputs: closes the caller fetched, the news collector's
 * files, `UPCOMING_PRINTS` and `MARKET_EVENTS`. The words (headline, line) are templates wrapped
 * around those numbers and repeat only numbers already on the cards, which `parseEdition`'s words
 * check (`checkWords`) enforces on every edition, so a figure no code produced cannot reach the
 * page, whoever or whatever writes the words later (#8252 slice 2, a model's narrator line).
 *
 * At most three stories, each only when its data exists, in this order:
 *   1. movers: the session's biggest moves among the campaign's names (up to 4, by absolute change);
 *   2. ahead: reports and events in the next 5 sessions that bear on the campaign's names;
 *   3. news: items the collector linked to the campaign and dated that session (New York day).
 * `next` holds the campaign's prints and linked events of the coming 7 calendar days. Each list is
 * capped (4 reports a story, 6 next) by what bears most: an item naming a campaign's own name
 * first, then the calendar record's impact tier, so a week of minor auctions never crowds out a
 * print.
 *
 * Pure: no clock, no fetch, no file. The CLI (`src/scripts/edition-write.ts`) does the I/O and
 * `parseEdition` judges the result like any hand-written file. Paper only; educational: an edition
 * places no order, sizes none, never frames a time as good to buy, and is one body for every member.
 */

import { linkNews, type NewsItem } from "./campaign-news.js";
import { type Campaign, castSymbols, linkEvents } from "./campaigns.js";
import { type EarningsPrint, printEventId } from "./earnings-calendar.js";
import {
  type Edition,
  type EditionDate,
  type EditionFact,
  type EditionLine,
  type EditionStory,
  isPlainCopy,
} from "./edition.js";
import { formatDateTime } from "./intl-format.js";
import { isSession, nextSession } from "./market-calendar.js";
import { marketDayKey } from "./market-day.js";
import type { MarketEvent } from "./market-events-types.js";
import { sessionBounds } from "./market-session.js";

/** One name's session: the close before and the close on the edition's date. */
export interface SessionClose {
  readonly prev: number;
  readonly close: number;
}

export interface WriterInput {
  /** The session the edition describes, YYYY-MM-DD in New York. */
  readonly date: string;
  readonly campaign: Campaign;
  /** Every cast symbol's session, keyed by symbol. A missing one is the caller's failure to report. */
  readonly closes: Readonly<Record<string, SessionClose>>;
  /** Where the closes came from and when, said plainly ("Yahoo daily closes, fetched …"). */
  readonly closesSource: string;
  /** The news collector's harvest (`loadNews`); only items linked to the campaign and dated that
   *  session are read. */
  readonly news: readonly NewsItem[];
  /** Where the news came from and when; absent when this run collected none. */
  readonly newsSource?: string;
  readonly prints: readonly EarningsPrint[];
  readonly events: readonly MarketEvent[];
}

const MAX_MOVERS = 4;
const AHEAD_SESSIONS = 5;
const NEXT_DAYS = 7;
const MAX_REPORTS = 4;
const MAX_NEXT = 6;
const MAX_NEWS = 4;
const MAX_LINE = 34;

// ── Numbers, formatted once ──────────────────────────────────────────────────────────────────────

/** Percent change, close to close. */
const changeOf = (s: SessionClose): number => ((s.close - s.prev) / s.prev) * 100;

/** A change with its sign, the house's minus (U+2212): one decimal, two when one would print a
 *  zero ("−0.04%"), so a sign never disagrees with its move. Only an exact zero reads "+0.0%". */
export function signedPct(change: number): string {
  const abs = Math.abs(change);
  const digits = abs.toFixed(1) === "0.0" ? abs.toFixed(2) : abs.toFixed(1);
  if (change === 0 || Number(digits) === 0) return "+0.0%";
  return change < 0 ? `−${digits}%` : `+${digits}%`;
}

const price = (n: number): string => n.toFixed(2);

/** "Tue Nov 24" for a YYYY-MM-DD. */
export function dayLabel(date: string): string {
  return formatDateTime(new Date(`${date}T00:00:00Z`), "en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).replace(",", "");
}

/** The move a change draws, read from the same rounding its value prints, so the two agree. */
const moveOf = (change: number): EditionFact["move"] => {
  const shown = signedPct(change);
  return shown === "+0.0%" ? "mixed" : shown.startsWith("−") ? "down" : "up";
};

/** "the AI buildout" from "The AI buildout", for use mid-sentence. */
const inText = (title: string): string => title.replace(/^The /, "the ");

const shift = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** The `n`th session after `date`. */
function sessionsAfter(date: string, n: number): string {
  let at = date;
  for (let i = 0; i < n; i++) at = nextSession(at);
  return at;
}

/** The first candidate that fits the one line at 390. */
const fit = (...candidates: readonly string[]): string =>
  candidates.find((c) => c.length <= MAX_LINE) ?? (candidates.at(-1) as string);

// ── The free scan ────────────────────────────────────────────────────────────────────────────────

export type Due = { readonly due: true } | { readonly due: false; readonly why: string };

/**
 * Whether an edition is due for `date` at `now`: the date is a session, its close (4:00 PM ET, 1:00
 * PM on an early close) has passed, and no edition exists for it. The run's first act, before any
 * fetch, so a holiday, a weekend or a second run costs nothing (#8252 criterion 1).
 */
export function editionDue(date: string, now: Date, exists: boolean): Due {
  if (!isSession(date)) return { due: false, why: `${date} is not a session` };
  if (now.getTime() < sessionBounds(date).closeAt)
    return { due: false, why: `${date}'s session has not closed yet` };
  if (exists) return { due: false, why: `the ${date} edition is already written` };
  return { due: true };
}

// ── The cards ────────────────────────────────────────────────────────────────────────────────────

interface Move {
  readonly symbol: string;
  readonly session: SessionClose;
  readonly change: number;
}

function movesOf(symbols: readonly string[], closes: WriterInput["closes"]): Move[] {
  return symbols
    .flatMap((symbol) => {
      const session = closes[symbol];
      return session ? [{ symbol, session, change: changeOf(session) }] : [];
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || a.symbol.localeCompare(b.symbol));
}

function factOf(m: Move, date: string): EditionFact {
  return {
    label: m.symbol,
    value: signedPct(m.change),
    move: moveOf(m.change),
    note: `${dayLabel(date)} · closed at ${price(m.session.close)}`,
  };
}

function closeLine(m: Move, source: string): EditionLine {
  return {
    text: `${m.symbol} closed at ${price(m.session.close)}, ${signedPct(m.change)} from ${price(m.session.prev)} the session before.`,
    mark: "measured",
    source,
  };
}

/** The facts for a story about `symbols`: their moves, or the campaign's average when none closed. */
function factsFor(symbols: readonly string[], input: WriterInput): EditionFact[] {
  const moves = movesOf(symbols, input.closes).slice(0, MAX_MOVERS);
  if (moves.length > 0) return moves.map((m) => factOf(m, input.date));
  const all = movesOf(castSymbols(input.campaign), input.closes);
  const avg = all.reduce((sum, m) => sum + m.change, 0) / all.length;
  return [
    {
      label: `${input.campaign.title}: its ${all.length} names, average`,
      value: signedPct(avg),
      move: moveOf(avg),
      note: dayLabel(input.date),
    },
  ];
}

/**
 * The facts for a story whose one line names `lead`: that name's own move first, then the story's
 * other movers. The closed row draws the line beside `facts[0]`'s move and figure
 * (`app/src/shell/edition-story.tsx`), so the first fact must be the named ticker's, never the
 * biggest mover's (#8353: 11 of 28 live rows read "Next: GOOG quarterly results ▲ +1.5%", MSFT's).
 * A named ticker with no close (the CLI refuses that run, so a hand-built input) leads with the
 * campaign's average, whose label says what it is, rather than another ticker's move.
 */
function factsLedBy(
  lead: string | undefined,
  symbols: readonly string[],
  input: WriterInput,
): EditionFact[] {
  if (lead === undefined) return factsFor(symbols, input);
  const [own] = movesOf([lead], input.closes);
  if (!own) return factsFor([], input);
  const rest = factsFor(symbols, input).filter((f) => f.label !== lead);
  return [factOf(own, input.date), ...rest].slice(0, MAX_MOVERS);
}

/** Whether `text` carries `symbol` as a whole token ("GOOG quarterly results" names GOOG). */
const names = (text: string, symbol: string): boolean =>
  text.split(/[^A-Za-z0-9.]+/).some((t) => t.replace(/\.$/, "") === symbol);

/** A dated item on the calendar, as an edition lists it, with the record's source beside it. */
interface Dated {
  readonly item: EditionDate;
  readonly symbols: readonly string[];
  readonly source: string;
  /** Lower first: an item naming a cast symbol, then by the record's impact tier. */
  readonly rank: number;
}

const IMPACT_RANK: Readonly<Record<MarketEvent["impact"], number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** A calendar title up to its commentary: records append research notes after " — ", and the
 *  edition shows the event, not the note. Nothing is reworded, so every number left is the record's. */
const eventWhat = (title: string): string => title.split(" — ")[0]?.trim() || title;

/** A record's source up to its first clause, with the record it came from: enough to find it. */
const sourceOf = (source: string, record: string): string => {
  const clause = source.split(/ — | \(|; /)[0]?.trim() ?? source;
  return `${clause.length > 120 ? `${clause.slice(0, 119)}…` : clause} (${record})`;
};

/** The campaign's prints and linked events dated in `(from, to]`, by date, each once. */
function datedFor(input: WriterInput, from: string, to: string): Dated[] {
  const cast = new Set(castSymbols(input.campaign));
  const inSpan = (d: string): boolean => d > from && d <= to;
  const prints: Dated[] = input.prints
    .filter((p) => cast.has(p.symbol) && inSpan(p.date))
    .map((p) => ({
      item: { date: p.date, what: `${p.symbol} quarterly results`, status: p.status },
      symbols: [p.symbol],
      source: sourceOf(p.source, `src/domain/earnings-calendar.ts, ${printEventId(p)}`),
      rank: 0,
    }));
  const events: Dated[] = linkEvents(input.campaign, input.events)
    .filter((l) => inSpan(l.event.date) && isPlainCopy(l.event.title))
    .map((l) => {
      const symbols = l.event.symbols.filter((s) => cast.has(s));
      return {
        item: { date: l.event.date, what: eventWhat(l.event.title), status: l.event.status },
        symbols,
        source: sourceOf(l.source, `the event calendar, ${l.event.id}`),
        rank: symbols.length > 0 ? 0 : 1 + IMPACT_RANK[l.event.impact],
      };
    });
  const seen = new Set<string>();
  return [...prints, ...events]
    .sort(
      (a, b) => a.item.date.localeCompare(b.item.date) || a.item.what.localeCompare(b.item.what),
    )
    .filter((d) => {
      const key = `${d.item.date} ${d.item.what}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** The `n` items that bear most on the campaign (its own names first, then by impact), by date. */
const mostBearing = (list: readonly Dated[], n: number): Dated[] =>
  [...list]
    .sort((a, b) => a.rank - b.rank || a.item.date.localeCompare(b.item.date))
    .slice(0, n)
    .sort(
      (a, b) => a.item.date.localeCompare(b.item.date) || a.item.what.localeCompare(b.item.what),
    );

// ── The stories ──────────────────────────────────────────────────────────────────────────────────

function moversStory(input: WriterInput, ahead: readonly Dated[]): EditionStory | undefined {
  const all = movesOf(castSymbols(input.campaign), input.closes);
  const top = all.slice(0, MAX_MOVERS);
  const lead = top[0];
  if (!lead) return undefined;
  const up = all.filter((m) => moveOf(m.change) === "up").length;
  const down = all.filter((m) => moveOf(m.change) === "down").length;
  const verb = lead.change < 0 ? "fell" : "rose";
  const abs = signedPct(lead.change).slice(1, -1);
  const symbols = top.map((m) => m.symbol);
  const title = inText(input.campaign.title);
  return {
    id: "movers",
    headline: `${up} of ${all.length} names in ${title} rose on ${dayLabel(input.date)}; ${lead.symbol} moved most, ${verb === "fell" ? "falling" : "rising"} ${abs}%.`,
    line: fit(`${lead.symbol} ${verb} ${abs}%`),
    symbols,
    facts: top.map((m) => factOf(m, input.date)),
    reports: ahead
      .filter((d) => d.symbols.some((s) => symbols.includes(s)))
      .slice(0, MAX_REPORTS)
      .map((d) => d.item),
    more: [
      {
        text: `${up} of ${all.length} names in ${title} rose on ${dayLabel(input.date)} and ${down} fell.`,
        mark: "measured",
        source: input.closesSource,
      },
      ...top.map((m) => closeLine(m, input.closesSource)),
    ],
  };
}

function aheadStory(input: WriterInput, ahead: readonly Dated[]): EditionStory | undefined {
  const shown = mostBearing(ahead, MAX_REPORTS);
  // The headline leads with what bears most (a campaign name's own item), not the earliest date.
  const first = [...shown].sort((a, b) => a.rank - b.rank)[0];
  if (!first) return undefined;
  const symbols = [...new Set(shown.flatMap((d) => d.symbols))];
  const estimate = first.item.status === "estimate" ? ", our estimate" : "";
  const day = dayLabel(first.item.date).slice(0, 3);
  // The row's figure is the lead's move, so the line names the lead even when the event's title
  // does not ("AWS re:Invent" is AMZN's): a figure never sits beside no name, or another's (#8353).
  const lead = first.symbols[0];
  const line =
    lead === undefined
      ? fit(`Next: ${first.item.what}`, "Reports and events ahead")
      : fit(
          ...(names(first.item.what, lead) ? [`Next: ${first.item.what}`] : []),
          `Next for ${lead}: ${first.item.what}`,
          `Next for ${lead} on ${day}`,
        );
  return {
    id: "ahead",
    headline: `Dated next for ${inText(input.campaign.title)}: ${first.item.what} on ${day}${estimate}.`,
    line,
    symbols,
    facts: factsLedBy(lead, symbols, input),
    reports: shown.map((d) => d.item),
    more: shown.map((d) => ({
      text: `${d.item.what}, ${d.item.date}: ${d.item.status === "confirmed" ? "a confirmed date" : "our estimate, not yet confirmed by the company or publisher"}.`,
      mark: d.item.status === "confirmed" ? "measured" : "modeled",
      source: d.source,
    })),
  };
}

function newsStory(input: WriterInput, ahead: readonly Dated[]): EditionStory | undefined {
  if (!input.newsSource) return undefined;
  const seen = new Set<string>();
  const links = linkNews(input.campaign, input.news)
    .filter((l) => marketDayKey(l.at) === input.date && isPlainCopy(l.item.title))
    // The company's and the Fed's own words before press, then the newest first.
    .sort(
      (a, b) =>
        Number(a.evidence !== "measured") - Number(b.evidence !== "measured") ||
        b.at.localeCompare(a.at),
    )
    .filter((l) => {
      if (seen.has(l.item.title)) return false;
      seen.add(l.item.title);
      return true;
    })
    .slice(0, MAX_NEWS);
  if (links.length === 0) return undefined;
  const symbols = [
    ...new Set(
      links.flatMap((l) => l.reasons.flatMap((r) => (r.via === "cast" ? [r.symbol] : []))),
    ),
  ];
  const named = symbols.slice(0, 3);
  return {
    id: "news",
    headline:
      named.length > 0
        ? `Filings and press that named ${named.join(", ")} on ${dayLabel(input.date).slice(0, 3)}.`
        : `Filings and press on ${inText(input.campaign.title)}'s forces.`,
    line: fit(named.length > 0 ? `${named[0]} in the news` : "In the news"),
    symbols,
    facts: factsLedBy(named[0], symbols, input),
    reports: ahead
      .filter((d) => d.symbols.some((s) => symbols.includes(s)))
      .slice(0, MAX_REPORTS)
      .map((d) => d.item),
    more: links.map((l) => ({
      text: l.item.title,
      mark: l.evidence,
      source: `${l.item.source}, ${l.item.at}, ${l.item.url}`,
    })),
  };
}

/** The day's edition for `input.date`. `parseEdition` judges it before anything writes it. */
export function writeEdition(input: WriterInput): Edition {
  const ahead = datedFor(input, input.date, sessionsAfter(input.date, AHEAD_SESSIONS));
  const stories = [
    moversStory(input, ahead),
    aheadStory(input, ahead),
    newsStory(input, ahead),
  ].filter((s): s is EditionStory => s !== undefined);
  const next = mostBearing(datedFor(input, input.date, shift(input.date, NEXT_DAYS)), MAX_NEXT).map(
    (d) => d.item,
  );
  const news = input.newsSource ?? "no news collected on this run";
  return {
    date: input.date,
    campaign: input.campaign.id,
    writtenBy:
      `Written by code after the ${input.date} close (src/domain/edition-writer.ts, npm run edition:write), from: ` +
      `${input.closesSource}; ${news}; the earnings table (src/domain/earnings-calendar.ts); the event calendar ` +
      "(src/domain/market-events-data.ts). No model wrote it: every number comes from those sources, and the words are templates around them.",
    stories,
    next,
  };
}
