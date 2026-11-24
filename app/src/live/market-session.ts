import { cachedDateTimeFormat } from "../../../src/domain/intl-format";
import { isMarketClosed, MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { sessionBounds } from "../../../src/domain/market-session";
import { clockSource, marketClock } from "./market-clock";

/**
 * The topbar's market clock (#3689 slice 1): where today's regular session stands, as the handful
 * of facts `MarketSession` draws — the state, the minutes left to trade, how far the session has
 * run, and where power hour starts. Eric's ask: "static information that should always be visible
 * to reflect the remaining time to execute trades."
 *
 * WHERE THE HOURS COME FROM (#8248). Each day's open and close are the broker's — Alpaca's calendar,
 * fetched from `GET /api/market/clock` into `market-clock.ts` — so a holiday or a 1:00 PM half day
 * is whatever the exchange actually set, not a weekday rule. Until that answer arrives, when it
 * fails, or for a date past its 30 days, the bundled table (`src/domain/market-calendar.ts`, the
 * exchange's published dates) answers instead, and `source` says so for the opened panel to say in
 * words. Neither path ever guesses OPEN: a date neither lists is closed. Pure in `now` (plus the
 * stored answer), so specs pin the clock; the 30-second tick stays local math.
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
  /** "4:00" or "1:00" (a half day), ET, for the track's right label. */
  readonly closeLabel: string;
  /** "9:30" — today's open (or a normal day's, when today has no session), ET. */
  readonly openLabel: string;
  /** "Mon 9:30" — the next session's open, ET; empty while a session is running or due today. */
  readonly nextOpen: string;
  /** True when today's session closes early (1:00 PM ET). */
  readonly halfDay: boolean;
  /** Whose hours these are: the broker's calendar; the bundled table because it couldn't answer;
   *  or the table for the moment before the first answer ("loading", said nowhere). */
  readonly source: "broker" | "table" | "loading";
  /** The instant the open an order placed now waits for (epoch ms); absent mid-session. */
  readonly nextOpenAt?: number;
  /** Whole minutes from `now` to `nextOpenAt`, for the receipt's countdown. */
  readonly minutesToOpen?: number;
  /** "1:00" when the session an order waits for (after today's close) is a half day. */
  readonly nextHalfDayClose?: string;
}

const ET = "America/New_York";
const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;
const EARLY_CLOSE = 13 * 60;
const POWER_HOUR = 60;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** New York's wall clock: one shared formatter (src/domain/intl-format.ts), built on first use, so
 *  a runtime without time-zone data throws in a call its caller can catch, never at import. */
const EASTERN: Intl.DateTimeFormatOptions = {
  timeZone: ET,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/** The New York calendar day and minute-of-day for `now`. */
function easternParts(now: Date | number): { date: string; minutes: number } {
  const parts = cachedDateTimeFormat("en-US", EASTERN).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** A session day: its open and close as minutes past midnight ET, and as instants. */
interface Day {
  readonly open: number;
  readonly close: number;
  readonly openAt: number;
  readonly closeAt: number;
  readonly halfDay: boolean;
}

/** The New York date a stored answer was read on, worked out once per answer. */
let asOfDay: { readonly view: object; readonly date: string } | undefined;

/** Whether the stored broker answer speaks for `date`: from the day it was read (it lists that
 *  day's session even after the close, so no row means no session) through its last listed day.
 *  Before or past that, the table answers. */
function brokerCovers(date: string): boolean {
  const view = marketClock();
  if (!view || view.source !== "broker" || view.days.length === 0) return false;
  if (asOfDay?.view !== view) {
    asOfDay = { view, date: easternParts(Date.parse(view.asOf)).date };
  }
  const last = view.days[view.days.length - 1]?.date ?? "";
  return date >= asOfDay.date && date <= last;
}

/** The session on `date`, or undefined when the market is closed all day. */
function dayFor(date: string): Day | undefined {
  if (brokerCovers(date)) {
    const d = marketClock()?.days.find((x) => x.date === date);
    if (!d) return undefined;
    const openAt = Date.parse(d.openAt);
    return {
      open: easternParts(openAt).minutes,
      close: easternParts(Date.parse(d.closeAt)).minutes,
      openAt,
      closeAt: Date.parse(d.closeAt),
      halfDay: d.halfDay,
    };
  }
  if (isMarketClosed(date)) return undefined;
  const halfDay = MARKET_CLOSURES.some((c) => c.date === date && c.early);
  const bounds = sessionBounds(date);
  return {
    open: OPEN,
    close: halfDay ? EARLY_CLOSE : CLOSE,
    openAt: bounds.openAt,
    closeAt: bounds.closeAt,
    halfDay,
  };
}

/** "9:30", "1:00", "4:00" — minutes past midnight on a 12-hour face. */
function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${((h + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")}`;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The first trading day strictly after `date` (two weeks covers any holiday run), or "". */
function tradingDayAfter(date: string): string {
  for (let i = 1; i <= 14; i += 1) {
    const d = addDays(date, i);
    if (dayFor(d)) return d;
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

/** Whether `date`'s close (4:00, or 1:00 on a half day) has passed at `now`. */
export function closeHasPassed(date: string, now: Date = new Date()): boolean {
  const e = easternParts(now);
  return e.date > date || (e.date === date && e.minutes >= (dayFor(date)?.close ?? CLOSE));
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function marketSession(now: Date = new Date()): MarketSessionView {
  const { date, minutes } = easternParts(now);
  const today = dayFor(date);
  const open = today?.open ?? OPEN;
  const close = today?.close ?? CLOSE;
  const length = close - open;
  const base = {
    powerAt: (close - POWER_HOUR - open) / length,
    closeLabel: clockLabel(close),
    openLabel: clockLabel(open),
    halfDay: today?.halfDay ?? false,
    source: clockSource(),
  };
  const waiting = (openAt: number) => ({
    nextOpenAt: openAt,
    minutesToOpen: Math.max(0, Math.ceil((openAt - now.getTime()) / 60_000)),
  });

  if (!today || minutes >= close) {
    const next = tradingDayAfter(date);
    const nextDay = next ? dayFor(next) : undefined;
    return {
      ...base,
      state: "closed",
      minutesLeft: 0,
      elapsed: today ? 1 : 0,
      nextOpen: next && nextDay ? `${dayOf(next)} ${clockLabel(nextDay.open)}` : "",
      ...(nextDay ? waiting(nextDay.openAt) : {}),
      ...(nextDay?.halfDay ? { nextHalfDayClose: clockLabel(nextDay.close) } : {}),
    };
  }
  if (minutes < open) {
    return {
      ...base,
      state: "pre",
      minutesLeft: open - minutes,
      elapsed: 0,
      nextOpen: "",
      ...waiting(today.openAt),
    };
  }
  return {
    ...base,
    state: close - minutes <= POWER_HOUR ? "power" : "open",
    minutesLeft: close - minutes,
    elapsed: clamp01((minutes - open) / length),
    nextOpen: "",
  };
}

/** True while the regular session trades — the onboarding fallback's answer, holidays and half
 *  days included (it replaced the weekday-only `marketIsOpen`, #8248). */
export function marketOpenNow(now: Date = new Date()): boolean {
  try {
    const state = marketSession(now).state;
    return state === "open" || state === "power";
  } catch {
    // No time-zone data to judge by: closed is the answer that can't mislead (#8248).
    return false;
  }
}

/** The viewer's own time zone, or undefined when the browser won't say. */
export function viewerTimeZone(): string | undefined {
  try {
    return cachedDateTimeFormat("en-US", {}).resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** " (6:30 AM PST)" — `at` in the viewer's zone, when that zone's clock differs from New York's;
 *  "" for an Eastern viewer, an unknown zone, or no instant. */
export function localTimeSuffix(at: number | undefined, timeZone: string | undefined): string {
  if (at === undefined || !timeZone || timeZone === ET) return "";
  try {
    const time = (zone: string) =>
      cachedDateTimeFormat("en-US", {
        timeZone: zone,
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(at);
    const theirs = time(timeZone);
    const ours = time(ET);
    // Same wall clock and zone name (Detroit, Toronto) → nothing to add.
    return theirs === ours ? "" : ` (${theirs})`;
  } catch {
    return "";
  }
}

/** The open an order placed now waits for — "the Tue 9:30 ET open", or "today's 9:30 ET open"
 *  before the bell — and undefined while the regular session is running. The trade form's notes
 *  read it so a ticket never promises an immediate fill the market is closed to give (#6257).
 *  Given the viewer's zone, it adds their local time when that isn't New York's (#8248). */
export function waitsForOpen(view: MarketSessionView, timeZone?: string): string | undefined {
  if (view.state === "open" || view.state === "power") return undefined;
  const local = localTimeSuffix(view.nextOpenAt, timeZone);
  if (view.state === "pre") return `today's ${view.openLabel} ET open${local}`;
  return view.nextOpen ? `the ${view.nextOpen} ET open${local}` : "the next session's open";
}

/** A time in `timeZone` (the viewer's default when absent): "6:30 AM". */
function timeIn(at: number, timeZone: string | undefined): string {
  return cachedDateTimeFormat("en-US", {
    ...(timeZone ? { timeZone } : {}),
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

/**
 * What step 3's note adds after "4:00 PM ET" (#8248, moved from the deleted `market-hours.ts`),
 * from the coming session's REAL hours — today's while it hasn't closed, else the next one's:
 *  - a viewer outside Eastern time gets that session in their own zone, " (6:30 AM–1:00 PM PDT)";
 *  - a half day says so, so the note never promises 4:00 on a 1:00 close — " (Friday is a half
 *    day: it closes 1:00 PM ET)", with the viewer's time beside it when theirs differs.
 * "" for an Eastern viewer on a full day, or when the zone can't be read.
 */
export function localSessionSuffix(now = new Date(), timeZone?: string): string {
  try {
    const { date, minutes } = easternParts(now);
    const today = dayFor(date);
    const when = today && minutes < today.close ? date : tradingDayAfter(date);
    const day = when ? dayFor(when) : undefined;
    if (!day) return "";
    // The zone's name AT that session — a session past a clock change is PST, not today's PDT.
    const zone = cachedDateTimeFormat("en-US", {
      ...(timeZone ? { timeZone } : {}),
      timeZoneName: "short",
    })
      .formatToParts(day.openAt)
      .find((p) => p.type === "timeZoneName")?.value;
    const eastern = !zone || zone === "EDT" || zone === "EST";
    if (day.halfDay) {
      const name = when === date ? "today" : `${DAY_NAMES[DAYS.indexOf(dayOf(when) ?? "Sun")]}`;
      const local = eastern ? "" : ` (${timeIn(day.closeAt, timeZone)} ${zone})`;
      return ` (${name} is a half day: it closes ${clockLabel(day.close)} ${day.close >= 12 * 60 ? "PM" : "AM"} ET${local})`;
    }
    if (eastern) return "";
    return ` (${timeIn(day.openAt, timeZone)}–${timeIn(day.closeAt, timeZone)} ${zone})`;
  } catch {
    return "";
  }
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** "in 23h 30m", "in 1d 4h" — the receipt's countdown to the open; "" when nothing waits. */
export function opensIn(view: MarketSessionView): string {
  const total = view.minutesToOpen;
  if (total === undefined || view.state === "open" || view.state === "power") return "";
  if (total >= 24 * 60) {
    const d = Math.floor(total / (24 * 60));
    const h = Math.floor((total % (24 * 60)) / 60);
    return `in ${d}d${h ? ` ${h}h` : ""}`;
  }
  return `in ${formatMinutes(total)}`;
}

/** "1h 28m", "42m", "6h" — the compact duration the widget prints. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
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
 * the bell on a trading day it is today's ("Today · 9:30 ET"); otherwise the first trading day
 * after today, holidays skipped by the exchange's own calendar.
 */
/** The instant `nextOpenLabel` names, so the opened panel can say it in the viewer's own time. */
export function nextOpenInstant(now: Date = new Date()): number | undefined {
  const { date, minutes } = easternParts(now);
  const today = dayFor(date);
  if (today && minutes < today.open) return today.openAt;
  const d = tradingDayAfter(date);
  return d ? dayFor(d)?.openAt : undefined;
}

export function nextOpenLabel(now: Date = new Date()): string {
  const { date, minutes } = easternParts(now);
  const today = dayFor(date);
  if (today && minutes < today.open) return `Today · ${clockLabel(today.open)} ET`;
  const d = tradingDayAfter(date);
  const next = d ? dayFor(d) : undefined;
  if (!(d && next)) return "";
  const month = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  return `${dayOf(d)} ${MONTHS[month - 1]} ${day} · ${clockLabel(next.open)} ET`;
}
