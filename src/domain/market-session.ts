/**
 * The regular NYSE session as a pure clock — 9:30 AM to 4:00 PM Eastern, Monday through Friday,
 * minus the exchange holidays and 1:00 PM early closes in `market-calendar.ts`. Used where a
 * sentence or a liveness check needs to know whether the market is open without a broker round
 * trip. The desk's own gate (`src/server/desk-gate.ts`) still asks Alpaca before any order.
 * Mirrors the shell's `app/src/live/market-hours.ts` (which does not yet read the calendar).
 */
import { formatDateTime } from "./intl-format.js";
import { isSession, MARKET_CLOSURES, sessionsBefore } from "./market-calendar.js";

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 16 * 60;
const EARLY_CLOSE_MINUTES = 13 * 60;

/**
 * Every field `toLocaleString("en-US", { timeZone })` prints by default, spelled out so the shared
 * formatter (`intl-format.ts`) prints the identical string.
 */
const NEW_YORK_CLOCK: Intl.DateTimeFormatOptions = {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
};

/** `now` on New York's wall clock: the parsed Date (read only through its local getters, which
 *  hand back the fields as printed), its `YYYY-MM-DD`, and its minutes past midnight. */
function newYorkWall(now: Date): {
  readonly et: Date;
  readonly date: string;
  readonly minutes: number;
} {
  const et = new Date(formatDateTime(now, "en-US", NEW_YORK_CLOCK));
  const date = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, "0")}-${String(et.getDate()).padStart(2, "0")}`;
  return { et, date, minutes: et.getHours() * 60 + et.getMinutes() };
}

/** Minutes past midnight ET that the session on `date` closes — 1:00 PM on an early-close day. */
function closeMinutes(date: string): number {
  const early = MARKET_CLOSURES.some((c) => c.date === date && c.early);
  return early ? EARLY_CLOSE_MINUTES : CLOSE_MINUTES;
}

/** True during the regular session on a trading day, judged in New York time. */
export function regularSessionOpen(now: Date = new Date()): boolean {
  const { date, minutes } = newYorkWall(now);
  if (!isSession(date)) return false;
  return minutes >= OPEN_MINUTES && minutes < closeMinutes(date);
}

/**
 * When the last session that has already closed opened — 9:30 AM ET today once today's session is
 * over, otherwise on the trading day before. The heartbeat asks "did this bot pass at all last
 * session?" (#4949): a newest pass older than this instant sat out that whole session.
 */
export function lastClosedSessionOpen(now: Date = new Date()): Date {
  const { date, minutes } = newYorkWall(now);
  const day = isSession(date) && minutes >= closeMinutes(date) ? date : sessionsBefore(date, 1);
  // 9:30 read as UTC, then moved by New York's offset that morning — 9:30 sits hours clear of a
  // 2:00 AM clock change, so the offset at the guess is the offset at the open.
  const guess = Date.parse(`${day}T09:30:00Z`);
  const { et } = newYorkWall(new Date(guess));
  const wallAsUtc = Date.UTC(
    et.getFullYear(),
    et.getMonth(),
    et.getDate(),
    et.getHours(),
    et.getMinutes(),
  );
  return new Date(guess - (wallAsUtc - guess));
}

export const SESSION_HOURS_LABEL = "9:30 AM–4:00 PM ET, Monday through Friday";
