/**
 * MARKET HOURS FROM THE BROKER'S CALENDAR (#8248) — the one place a member-facing hour, date or
 * countdown is derived. Pure: a list of session days plus `now` in, the clock's facts out, so the
 * server's reader (`src/server/market-clock.ts`) and the shell both import it and a spec pins the
 * clock.
 *
 * WHY THIS EXISTS. Three copies of "weekdays 9:30 to 4:00 ET" (shell `market-hours.ts`, shell
 * `market-session.ts`, server `market-session.ts`) disagreed with the exchange on holidays and half
 * days whenever the checked-in table ran out, and one read an Intl failure as OPEN. The broker's
 * `/v2/calendar` lists each day's real open and close, so the days come from there; the checked-in
 * table (`market-calendar.ts`) builds the SAME day shape through `tableDays`, so the fallback and
 * the broker share one code path and the fallback says so (`source: "table"`) — never a guess.
 *
 * SHAPES (docs.alpaca.markets is not reachable from the build sessions, 2026-11-24; the field names
 * were read from three independent clients that pin Alpaca's OpenAPI spec — the Ruby, Rust and
 * Deno SDKs — and their example bodies are frozen in `tests/fixtures/alpaca-market-clock.ts`):
 *  - `GET /v2/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` → `[{ date, open: "HH:MM", close: "HH:MM",
 *    session_open, session_close, settlement_date }]`, `open`/`close` on New York's wall clock.
 *  - `GET /v3/clock?markets=NYSE` → `{ clocks: [{ market: { acronym: "NYSE", … }, timestamp,
 *    is_market_day, phase: "closed"|"pre"|"core"|"lunch"|"post", phase_until, next_market_open,
 *    next_market_close }] }`, times as ISO with the market's own offset.
 */
import { cachedDateTimeFormat } from "./intl-format.js";
import { isSession } from "./market-calendar.js";
import { newYorkInstant, sessionBounds } from "./market-session.js";

/** One trading day: its New York date and its regular session's open and close, epoch ms. */
export interface SessionDay {
  readonly date: string;
  readonly openAt: number;
  readonly closeAt: number;
}

/** Alpaca's `/v3/clock` phases for a market; NYSE never reports `lunch`, but the enum has it. */
export type MarketPhase = "closed" | "pre" | "core" | "lunch" | "post";
const PHASES: readonly MarketPhase[] = ["closed", "pre", "core", "lunch", "post"];

/** The broker's `/v3/clock` answer for NYSE, parsed. */
export interface BrokerClock {
  readonly phase: MarketPhase;
  readonly phaseUntil: number;
  readonly nextOpenAt: number;
  readonly nextCloseAt: number;
}

/** A day as the route serves it. `designatedPicksLockAt` only on a full day from the start date. */
export interface MarketClockDay {
  readonly date: string;
  readonly openAt: string;
  readonly closeAt: string;
  readonly halfDay: boolean;
  readonly picksLockAt: string;
  readonly designatedPicksLockAt?: string;
}

/** `GET /api/market/clock`'s body (#8248 criterion 3). Instants are ISO strings. */
export interface MarketClockView {
  readonly asOf: string;
  /** `broker` when the calendar came from Alpaca; `table` when the checked-in table answered. */
  readonly source: "broker" | "table";
  readonly isOpen: boolean;
  /** Present only when `/v3/clock` answered — the table never invents a phase. */
  readonly phase?: MarketPhase;
  readonly phaseUntil?: string;
  readonly nextOpenAt?: string;
  readonly nextCloseAt?: string;
  readonly days: readonly MarketClockDay[];
}

/** 4:00 PM ET in minutes; a close before it is a half day (the exchange's is 1:00 PM). */
const FULL_CLOSE_MINUTES = 16 * 60;

/**
 * THE DESIGNATED-NAME LOCK. From 2026-12-04 Alpaca opens a 4:00–4:15 PM ET options session for the
 * names it flags `has_options_extended_hours` (24 stocks and 5 ETFs), so a game-day pick on one of
 * them locks 15 minutes after the close. Only on a full day: a half day has no extended options
 * session to lock after. SOURCE: #8161 stage 1, platform limits row 4 ("From Dec 4, a 7:30-9:25am
 * and a 4:00-4:15pm options session open for 24 designated stocks and 5 ETFs"), read from
 * docs.alpaca.markets' options extended-hours page by that session; carried here 2026-11-24. Which
 * names are designated is #8161 step 9's read, not this module's.
 */
export const DESIGNATED_LOCK = {
  from: "2026-12-04",
  afterCloseMs: 15 * 60_000,
  source: "#8161 stage 1, platform limits row 4 (Alpaca options extended hours)",
  read: "2026-11-24",
} as const;

/** How far ahead the clock lists days — the reader asks the broker for the same window. */
export const CLOCK_HORIZON_DAYS = 30;

/** `date` moved by whole calendar days, as `YYYY-MM-DD`. */
export function shiftDate(date: string, days: number): string {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** New York's calendar date for `now`, `YYYY-MM-DD`. */
export function newYorkDate(now: Date): string {
  // en-CA prints ISO-ordered dates; one shared formatter (intl-format.ts → ONE FORMATTER PER SHAPE).
  return cachedDateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .slice(0, 10);
}

/** The table's sessions in `[from, to]`: weekdays minus full closures, early closes at 1:00 PM. */
export function tableDays(from: string, to: string): SessionDay[] {
  const days: SessionDay[] = [];
  for (let at = from; at <= to; at = shiftDate(at, 1)) {
    if (isSession(at)) days.push({ date: at, ...sessionBounds(at) });
  }
  return days;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WALL_RE = /^(\d{2}):(\d{2})$/;

/** `"09:30"` → minutes past midnight, or undefined when it isn't that shape. */
function wallMinutes(text: unknown): number | undefined {
  const m = typeof text === "string" ? WALL_RE.exec(text) : null;
  if (!m) return undefined;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes < 24 * 60 ? minutes : undefined;
}

/**
 * Alpaca's `/v2/calendar` body as session days, or undefined when ANY row is not the expected
 * shape — a half-parsed calendar would silently drop a session, so it is refused whole and the
 * reader keeps its last good one (#8248 criterion 2).
 */
export function calendarDays(body: unknown): SessionDay[] | undefined {
  if (!Array.isArray(body)) return undefined;
  const days: SessionDay[] = [];
  for (const row of body) {
    const r = row as { date?: unknown; open?: unknown; close?: unknown } | null;
    const date = r && typeof r.date === "string" && DATE_RE.test(r.date) ? r.date : undefined;
    const open = wallMinutes(r?.open);
    const close = wallMinutes(r?.close);
    if (!date || open === undefined || close === undefined || close <= open) return undefined;
    days.push({ date, openAt: newYorkInstant(date, open), closeAt: newYorkInstant(date, close) });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/** Alpaca's `/v3/clock` body, NYSE's entry, or undefined when it is missing or not the shape. */
export function brokerClock(body: unknown): BrokerClock | undefined {
  const clocks = (body as { clocks?: unknown } | null)?.clocks;
  if (!Array.isArray(clocks)) return undefined;
  const nyse = clocks.find(
    (c) => (c as { market?: { acronym?: unknown } } | null)?.market?.acronym === "NYSE",
  ) as Record<string, unknown> | undefined;
  if (!nyse) return undefined;
  const phase = PHASES.find((p) => p === nyse.phase);
  const at = (v: unknown): number => (typeof v === "string" ? Date.parse(v) : Number.NaN);
  const phaseUntil = at(nyse.phase_until);
  const nextOpenAt = at(nyse.next_market_open);
  const nextCloseAt = at(nyse.next_market_close);
  if (!phase || [phaseUntil, nextOpenAt, nextCloseAt].some(Number.isNaN)) return undefined;
  return { phase, phaseUntil, nextOpenAt, nextCloseAt };
}

/**
 * The dates where the broker's days and the table disagree inside `[from, to]` (both cover it):
 * a session one has and the other lacks, or a different close. The reader warns with these and the
 * broker's date wins (#8248 criterion 5); fixing the table is a follow-up, never automatic.
 */
export function calendarDrift(broker: readonly SessionDay[], from: string, to: string): string[] {
  // Both cover only up to the broker's last listed day: past it, a missing row is no evidence.
  const last = broker[broker.length - 1]?.date;
  if (last === undefined) return [];
  if (last < to) to = last;
  const table = new Map(tableDays(from, to).map((d) => [d.date, d]));
  const theirs = new Map(broker.map((d) => [d.date, d]));
  const dates = new Set([...table.keys(), ...theirs.keys()]);
  return [...dates]
    .filter((date) => date >= from && date <= to)
    .filter((date) => {
      const a = table.get(date);
      const b = theirs.get(date);
      return !(a && b) || a.openAt !== b.openAt || a.closeAt !== b.closeAt;
    })
    .sort();
}

/** True when `day` closes before 4:00 PM ET — the exchange's 1:00 PM early close. */
export function isHalfDay(day: SessionDay): boolean {
  return day.closeAt < newYorkInstant(day.date, FULL_CLOSE_MINUTES);
}

function servedDay(day: SessionDay): MarketClockDay {
  const halfDay = isHalfDay(day);
  const iso = (ms: number): string => new Date(ms).toISOString();
  return {
    date: day.date,
    openAt: iso(day.openAt),
    closeAt: iso(day.closeAt),
    halfDay,
    picksLockAt: iso(day.closeAt),
    ...(!halfDay && day.date >= DESIGNATED_LOCK.from
      ? { designatedPicksLockAt: iso(day.closeAt + DESIGNATED_LOCK.afterCloseMs) }
      : {}),
  };
}

/**
 * The clock's facts at `now` from `days` (the broker's calendar or the table's), with the broker's
 * `/v3/clock` laid over them when it answered: its phase decides open, and its next open and close
 * win. Without it, open is "inside a listed day's session" and next open/close come from the days —
 * and a `now` no listed day covers is CLOSED, never open.
 */
export function marketClockView(
  days: readonly SessionDay[],
  now: Date,
  source: MarketClockView["source"],
  clock?: BrokerClock,
): MarketClockView {
  const t = now.getTime();
  // A clock whose phase has already ended (cached across the close, or kept through an outage)
  // says nothing about now: drop it and let the days answer, so a stale "core" never reads OPEN.
  const live = clock && clock.phaseUntil > t ? clock : undefined;
  // Today's session stays listed after its close, so a reader can tell "closed for the day" (a
  // row, closed) from "no session today" (no row) — the shell's clock relies on it (#8248).
  const today = newYorkDate(now);
  const listed = days.filter((d) => d.date >= today);
  const inside = listed.find((d) => d.openAt <= t && t < d.closeAt);
  const nextOpen = listed.find((d) => d.openAt > t)?.openAt;
  const nextClose = (inside ?? listed.find((d) => d.closeAt > t))?.closeAt;
  const iso = (ms: number | undefined): string | undefined =>
    ms === undefined ? undefined : new Date(ms).toISOString();
  const nextOpenAt = iso(live?.nextOpenAt ?? nextOpen);
  const nextCloseAt = iso(live?.nextCloseAt ?? nextClose);
  return {
    asOf: now.toISOString(),
    source,
    isOpen: live ? live.phase === "core" : inside !== undefined,
    ...(live ? { phase: live.phase, phaseUntil: new Date(live.phaseUntil).toISOString() } : {}),
    ...(nextOpenAt ? { nextOpenAt } : {}),
    ...(nextCloseAt ? { nextCloseAt } : {}),
    days: listed.map(servedDay),
  };
}

/** The clock from the checked-in table alone — the fallback, and what the shell bundles. */
export function tableClockView(now: Date): MarketClockView {
  const today = newYorkDate(now);
  return marketClockView(tableDays(today, shiftDate(today, CLOCK_HORIZON_DAYS)), now, "table");
}

const ET_TIME: Intl.DateTimeFormatOptions = {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
};
const ET_DAY: Intl.DateTimeFormatOptions = {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
};

/** "1:00 PM ET" for an ISO instant. */
export function etTime(iso: string): string {
  return `${cachedDateTimeFormat("en-US", ET_TIME).format(Date.parse(iso))} ET`;
}

/** "Fri, Nov 27, 9:30 AM ET" for an ISO instant. */
export function etDayTime(iso: string): string {
  return `${cachedDateTimeFormat("en-US", ET_DAY).format(Date.parse(iso))}, ${etTime(iso)}`;
}

/**
 * The member context's Market line (#8248 criterion 6): open or closed and the day's real close,
 * or the next open with its close, every hour from the view — the chat model is handed these and
 * never computes one. A table answer says so.
 */
export function marketHoursLine(view: MarketClockView): string {
  const day = (iso?: string) => view.days.find((d) => d.closeAt === iso);
  const close = (iso?: string) => {
    const d = day(iso);
    return d ? `closes ${etTime(d.closeAt)}${d.halfDay ? " (a half day)" : ""}` : "";
  };
  const state = view.isOpen
    ? `OPEN right now and ${close(view.nextCloseAt) || "closes at the session's end"} today`
    : `CLOSED right now${
        view.nextOpenAt
          ? `; the next session opens ${etDayTime(view.nextOpenAt)}${
              day(view.nextCloseAt) && view.nextCloseAt && view.nextCloseAt > view.nextOpenAt
                ? ` and ${close(view.nextCloseAt)}`
                : ""
            }`
          : ""
      }; an order placed now is queued and fills at the open`;
  const source =
    view.source === "table"
      ? " (hours from the exchange's published table: the broker's calendar did not answer)"
      : "";
  return `Market: the regular session is ${state}${source}.`;
}
