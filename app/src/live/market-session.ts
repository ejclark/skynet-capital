import { isMarketClosed, MARKET_CLOSURES } from "../../../src/domain/market-calendar";

/**
 * The topbar's market clock (#3689 slice 1): where today's regular session stands, as the handful
 * of facts `MarketSession` draws — the state, the minutes left to trade, how far the session has
 * run, and where power hour starts. Eric's ask: "static information that should always be visible
 * to reflect the remaining time to execute trades."
 *
 * Holidays and 1:00 p.m. early closes come from `src/domain/market-calendar.ts` (the exchange's own
 * published dates), so the clock never says OPEN on Thanksgiving and never promises three hours on
 * Christmas Eve. `marketIsOpen` in `market-hours.ts` stays the cheap weekday-only check its
 * onboarding callers were written against; this is the richer view the shell draws. Pure in `now`
 * so specs pin the clock.
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
  /** "Mon 9:30" — the next session's open, ET; empty while a session is running or due today. */
  readonly nextOpen: string;
}

const ET = "America/New_York";
const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;
const EARLY_CLOSE = 13 * 60;
const POWER_HOUR = 60;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** The New York calendar day and minute-of-day for `now`. */
function easternParts(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
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
  return MARKET_CLOSURES.some((c) => c.date === date && c.early) ? EARLY_CLOSE : CLOSE;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Mon 9:30" for the first trading day strictly after `date` (two weeks covers any holiday run). */
function nextOpenAfter(date: string): string {
  for (let i = 1; i <= 14; i += 1) {
    const d = addDays(date, i);
    if (!isMarketClosed(d)) return `${DAYS[new Date(`${d}T00:00:00Z`).getUTCDay()]} 9:30`;
  }
  return "";
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function marketSession(now: Date = new Date()): MarketSessionView {
  const { date, minutes } = easternParts(now);
  const close = closeFor(date);
  const length = close - OPEN;
  const powerAt = (close - POWER_HOUR - OPEN) / length;
  const closeLabel = close === EARLY_CLOSE ? "1:00" : "4:00";
  const base = { powerAt, closeLabel };

  if (isMarketClosed(date) || minutes >= close) {
    const trading = !isMarketClosed(date);
    return {
      ...base,
      state: "closed",
      minutesLeft: 0,
      elapsed: trading ? 1 : 0,
      nextOpen: nextOpenAfter(date),
    };
  }
  if (minutes < OPEN) {
    return { ...base, state: "pre", minutesLeft: OPEN - minutes, elapsed: 0, nextOpen: "" };
  }
  return {
    ...base,
    state: close - minutes <= POWER_HOUR ? "power" : "open",
    minutesLeft: close - minutes,
    elapsed: clamp01((minutes - OPEN) / length),
    nextOpen: "",
  };
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
