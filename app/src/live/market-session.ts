import { cachedDateTimeFormat } from "../../../src/domain/intl-format";
import { isMarketClosed, MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import {
  CLOCK_HORIZON_DAYS,
  etTime,
  isHalfDay,
  type MarketClockView,
  newYorkDate,
  type SessionDay,
  shiftDate,
  tableDays,
} from "../../../src/domain/market-clock";

/**
 * The topbar's market clock (#3689 slice 1): where today's regular session stands, as the handful
 * of facts `MarketSession` draws — the state, the minutes left to trade, how far the session has
 * run, and where power hour starts. Eric's ask: "static information that should always be visible
 * to reflect the remaining time to execute trades."
 *
 * WHERE THE HOURS COME FROM (#8248 PR 2). The days — each session's real open and close — come
 * from the broker's calendar, served by `GET /api/market/clock` (`live/market-clock.ts` fetches
 * it once for the whole shell). When that read fails, or a date falls outside what it lists, the
 * checked-in table (`src/domain/market-calendar.ts`, the exchange's own published dates) builds the
 * same days through `tableDays`, and the view says `source: "table"` so the opened panel can say so.
 * Either way the math below is one code path, and it never guesses an hour: a moment no listed day
 * covers is closed. The 30-second tick stays local math — only the days are fetched.
 *
 * Pure in `now` (and the fetched view), so specs pin the clock.
 */

export type SessionState = "pre" | "open" | "power" | "closed";

export interface MarketSessionView {
  readonly state: SessionState;
  /** Minutes until the close (open/power) or the open (pre); 0 when closed. */
  readonly minutesLeft: number;
  /** 0..1 of today's session elapsed — 0 before the open, 1 after the close. */
  readonly elapsed: number;
  /** 0..1 position of the power-hour start (the last 60 minutes) on today's track. */
  readonly powerAt: number;
  /** "4:00" or "1:00" (an early close), ET, for the track's right label. */
  readonly closeLabel: string;
  /** "9:30", ET — the open the track starts at and the pre-market cue names. */
  readonly openLabel: string;
  /** "Mon 9:30" — the next session's open, ET; empty while a session is running or due today. */
  readonly nextOpen: string;
  /** Today's session, when today is one (its close may have passed). */
  readonly today?: SessionDay;
  /** The next session to open, strictly after now — today's before the bell. */
  readonly next?: SessionDay;
  /** Minutes until `next` opens — the receipt's countdown. */
  readonly minutesToOpen?: number;
  /** "6:30 AM PST", or "Wed 1:30 AM AEDT" across midnight: `next`'s open on the viewer's own
   *  clock. Set only when a zone was given and it is not New York's. */
  readonly localOpen?: string;
  /** Where the days came from: the broker's calendar, or the checked-in table. */
  readonly source: "broker" | "table";
}

const ET = "America/New_York";
const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;
const POWER_HOUR = 60;
const MINUTE = 60_000;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** The New York calendar day and minute-of-day for `now`. */
function easternParts(now: Date): { date: string; minutes: number } {
  const parts = cachedDateTimeFormat("en-US", {
    timeZone: ET,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function closeFor(date: string): number {
  return MARKET_CLOSURES.some((c) => c.date === date && c.early) ? 13 * 60 : CLOSE;
}

/** The first trading day strictly after `date` by the table (two weeks covers any holiday run). */
function tradingDayAfter(date: string): string {
  for (let i = 1; i <= 14; i += 1) {
    const d = shiftDate(date, i);
    if (!isMarketClosed(d)) return d;
  }
  return "";
}

const dayOf = (date: string) => DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/** The first trading day strictly after today in New York (`YYYY-MM-DD`): the session a row's
 *  "Not now" waits out (#5070), so a mark set aside on a Thursday afternoon is back after
 *  Friday's close, never an hour later at Thursday's. */
export function nextSessionAfterToday(now: Date = new Date()): string {
  return tradingDayAfter(easternParts(now).date);
}

/** The New York calendar day (`YYYY-MM-DD`) an instant falls on — the day the market reads it as. */
export function marketDayOf(now: Date): string {
  return easternParts(now).date;
}

/** Whether `date`'s close (4:00, or 1:00 on an early close) has passed at `now`. */
export function closeHasPassed(date: string, now: Date = new Date()): boolean {
  const e = easternParts(now);
  return e.date > date || (e.date === date && e.minutes >= closeFor(date));
}

/**
 * The session days the clock reads at `now`: the broker's, for every date the fetched view covers
 * (from the day it was read to its last listed day — inside that window a missing date IS a
 * closure), and the table's outside it. Without a view, the table's alone.
 */
export function sessionDays(now: Date, clock?: MarketClockView): readonly SessionDay[] {
  const today = newYorkDate(now);
  const table = tableDays(today, shiftDate(today, CLOCK_HORIZON_DAYS));
  const last = clock?.days[clock.days.length - 1]?.date;
  if (!clock || last === undefined) return table;
  const from = newYorkDate(new Date(clock.asOf));
  const covered = (date: string) => date >= from && date <= last;
  const broker = clock.days
    .filter((d) => d.date >= today)
    .map((d) => ({ date: d.date, openAt: Date.parse(d.openAt), closeAt: Date.parse(d.closeAt) }));
  return [...table.filter((d) => !covered(d.date)), ...broker].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

const ET_CLOCK: Intl.DateTimeFormatOptions = { timeZone: ET, hour: "numeric", minute: "2-digit" };

/** "9:30", "1:00" — an instant on New York's clock, no AM/PM (the track's own labels). */
function etClock(ms: number): string {
  return cachedDateTimeFormat("en-US", ET_CLOCK)
    .format(ms)
    .replace(/\s?[AP]M$/, "");
}

const isNewYork = (zone: string, short: string) =>
  zone === ET || short === "EST" || short === "EDT";

/** An instant on the viewer's clock — "6:30 AM PST", with the weekday when it falls on another
 *  calendar day than New York's — or undefined for a New York viewer or an unreadable zone. */
function localClock(ms: number, timeZone: string): string | undefined {
  try {
    const parts = cachedDateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).formatToParts(ms);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const zone = get("timeZoneName");
    if (!zone || isNewYork(timeZone, zone)) return undefined;
    const time = `${get("hour")}:${get("minute")} ${get("dayPeriod")} ${zone}`;
    const etDay = cachedDateTimeFormat("en-US", { timeZone: ET, day: "numeric" }).format(ms);
    return get("day") === etDay ? time : `${get("weekday")} ${time}`;
  } catch {
    return undefined;
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type SessionBase = Omit<MarketSessionView, "state" | "minutesLeft" | "elapsed" | "nextOpen">;

/** The facts that hold whatever the state: today's track, the next open and where it is local. */
function sessionBase(
  today: SessionDay | undefined,
  next: SessionDay | undefined,
  minuteStart: number,
  source: MarketSessionView["source"],
  timeZone?: string,
): SessionBase {
  const opening = today ?? next;
  const length = today ? (today.closeAt - today.openAt) / MINUTE : CLOSE - OPEN;
  const localOpen = next && timeZone ? localClock(next.openAt, timeZone) : undefined;
  return {
    powerAt: (length - POWER_HOUR) / length,
    closeLabel: today ? etClock(today.closeAt) : "4:00",
    openLabel: opening ? etClock(opening.openAt) : "9:30",
    source,
    ...(today ? { today } : {}),
    ...(next ? { next, minutesToOpen: Math.round((next.openAt - minuteStart) / MINUTE) } : {}),
    ...(localOpen ? { localOpen } : {}),
  };
}

/**
 * Where the regular session stands at `now`. `clock` is `GET /api/market/clock`'s answer (absent →
 * the table's days); `timeZone` is the viewer's, for the next open on their own clock.
 */
export function marketSession(
  now: Date = new Date(),
  clock?: MarketClockView,
  timeZone?: string,
): MarketSessionView {
  const days = sessionDays(now, clock);
  const t = now.getTime();
  const minuteStart = t - (t % MINUTE);
  const date = newYorkDate(now);
  const today = days.find((d) => d.date === date);
  const next = days.find((d) => d.openAt > t);
  const source = clock?.source === "broker" ? "broker" : "table";
  const base = sessionBase(today, next, minuteStart, source, timeZone);

  if (!today || t >= today.closeAt) {
    return {
      ...base,
      state: "closed",
      minutesLeft: 0,
      elapsed: today ? 1 : 0,
      nextOpen: next ? `${dayOf(next.date)} ${etClock(next.openAt)}` : "",
    };
  }
  if (t < today.openAt) {
    return {
      ...base,
      state: "pre",
      minutesLeft: base.minutesToOpen ?? 0,
      elapsed: 0,
      nextOpen: "",
    };
  }
  const minutesLeft = Math.round((today.closeAt - minuteStart) / MINUTE);
  return {
    ...base,
    state: minutesLeft <= POWER_HOUR ? "power" : "open",
    minutesLeft,
    elapsed: clamp01((minuteStart - today.openAt) / (today.closeAt - today.openAt)),
    nextOpen: "",
  };
}

/** True while the regular session is running. */
export const isTrading = (view: MarketSessionView): boolean =>
  view.state === "open" || view.state === "power";

/** The open an order placed now waits for — "the Tue 9:30 ET open", or "today's 9:30 ET open"
 *  before the bell, with the viewer's own time beside it when they are not on New York's clock
 *  ("the Fri 9:30 ET open (6:30 AM PST)") — and undefined while the regular session is running.
 *  The trade form's notes read it so a ticket never promises an immediate fill the market is
 *  closed to give (#6257); the hour is the broker's calendar's (#8248). */
export function waitsForOpen(view: MarketSessionView): string | undefined {
  if (isTrading(view)) return undefined;
  const local = view.localOpen ? ` (${view.localOpen})` : "";
  if (view.state === "pre") return `today's ${view.openLabel} ET open${local}`;
  return view.nextOpen ? `the ${view.nextOpen} ET open${local}` : "the next session's open";
}

/** "1h 28m", "42m", "6h" — the compact duration the widget prints. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "2d 23h" past a day, else `formatMinutes` — the receipt's countdown to the open. */
export function formatCountdown(total: number): string {
  if (total < 24 * 60) return formatMinutes(total);
  const d = Math.floor(total / (24 * 60));
  const h = Math.floor((total % (24 * 60)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

/** The whole widget as one sentence, for its accessible name. */
export function sessionSentence(view: MarketSessionView): string {
  const left = formatMinutes(view.minutesLeft);
  switch (view.state) {
    case "pre":
      return `Market opens in ${left}`;
    case "open":
      return `Market open, ${left} left today`;
    case "power":
      return `Market open, power hour, ${left} left today`;
    case "closed":
      return view.nextOpen ? `Market closed, opens ${view.nextOpen} ET` : "Market closed";
  }
}

/**
 * The market's word when a fleet alarm has the phone bar (#5064's review). At ≤700px the alarm
 * outranks the clock and the folded widget steps aside, but "not open yet" and "closed" must never
 * be told apart by a ring's colour alone — a standing reader is red/green colourblind
 * (docs/BRAND.md → Accessibility). So each state keeps one short word of its own beside the alarm.
 * Before the bell it is the open's TIME, not a countdown: one fixed width, so the line never grows
 * past the bar at 1 a.m. ("Opens 8h 30m"), and the countdown is one tap down with the rest.
 */
export function statusLineCue(view: MarketSessionView): string {
  switch (view.state) {
    case "open":
    case "power":
      return "Open";
    case "pre":
      return `Opens ${view.openLabel}`;
    case "closed":
      return "Closed";
  }
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * "Fri Sep 25 · 9:30 ET" — the next session's open, for the opened clock's "Next open" row. Before
 * the bell on a trading day it is today's ("Today · 9:30 ET"); otherwise the first session after
 * today, holidays skipped by the broker's calendar (or the table's, when it answered).
 */
export function nextOpenLabel(view: MarketSessionView): string {
  const next = view.next;
  if (!next) return "";
  const at = etClock(next.openAt);
  if (view.state === "pre") return `Today · ${at} ET`;
  const month = Number(next.date.slice(5, 7));
  const day = Number(next.date.slice(8, 10));
  return `${dayOf(next.date)} ${MONTHS[month - 1]} ${day} · ${at} ET`;
}

/**
 * The opened panel's half-day line (#8248 criterion 10), in words: "Half day: closes 1:00 PM ET"
 * for today's session while it is ahead or running, "Half day Fri: closes 1:00 PM ET" for the next
 * one once today's is over — undefined when the session on screen is a full day.
 */
export function halfDayLine(view: MarketSessionView): string | undefined {
  const running = view.today && view.state !== "closed" ? view.today : undefined;
  const day = running ?? view.next;
  if (!(day && isHalfDay(day))) return undefined;
  const when = running ? "" : ` ${dayOf(day.date)}`;
  return `Half day${when}: closes ${etTime(new Date(day.closeAt).toISOString())}`;
}

/** The opened panel's source line when the checked-in table answered (#8248 criterion 9). */
export function sourceLine(view: MarketSessionView): string | undefined {
  return view.source === "table"
    ? "Hours from the exchange's published table: the broker's calendar didn't answer."
    : undefined;
}

/**
 * The first-trade note's session window (#8248 criterion 12): "9:30 AM to 4:00 PM ET (6:30 AM–1:00
 * PM PST), Monday through Friday" on a full day — the viewer's own hours after the ET ones when
 * they are not on New York's clock — and today's real hours on a half day, never 4:00 PM.
 */
export function sessionWindowWords(view: MarketSessionView, timeZone?: string): string {
  const day = view.today ?? view.next;
  const local = day && timeZone ? localSessionSuffix(day, timeZone) : "";
  if (view.today && isHalfDay(view.today)) {
    const close = etTime(new Date(view.today.closeAt).toISOString());
    return `${etTime(new Date(view.today.openAt).toISOString()).replace(" ET", "")} to ${close}${local} today, a half day`;
  }
  return `9:30 AM to 4:00 PM ET${local}, Monday through Friday`;
}

/**
 * " (6:30 AM–1:00 PM PDT)" — `day`'s session on the viewer's clock, or "" for a viewer on New
 * York's (or when the zone can't be read).
 */
export function localSessionSuffix(day: SessionDay, timeZone: string): string {
  try {
    const opts: Intl.DateTimeFormatOptions = { timeZone, hour: "numeric", minute: "2-digit" };
    const zone = cachedDateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(day.openAt)
      .find((p) => p.type === "timeZoneName")?.value;
    if (!zone || isNewYork(timeZone, zone)) return "";
    const at = (ms: number) => cachedDateTimeFormat("en-US", opts).format(ms);
    return ` (${at(day.openAt)}–${at(day.closeAt)} ${zone})`;
  } catch {
    return "";
  }
}
