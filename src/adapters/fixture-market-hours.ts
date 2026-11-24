/**
 * The offline worlds' `/v2/calendar` and `/v3/clock` (#8248 criterion 7), built from the SAME
 * checked-in table and pinned clock as their `/v2/clock` (`marketClock` in data-source.ts), so the
 * server's market-hours reader answers offline exactly as it would against Alpaca, and the e2e
 * guard stays pinned open at FIXED_CLOCK. Body shapes: `src/domain/market-clock.ts` → SHAPES.
 */
import { cachedDateTimeFormat } from "../domain/intl-format.js";
import { CLOCK_HORIZON_DAYS, newYorkDate, shiftDate, tableDays } from "../domain/market-clock.js";
import { newYorkInstant } from "../domain/market-session.js";

const PRE_START = 4 * 60;
const POST_END = 20 * 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "09:30" on New York's wall clock — Alpaca's calendar format. */
const wall = (ms: number): string =>
  cachedDateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ms);

/** `GET /v2/calendar?start&end` rows from the table; a missing bound reads as `now`'s date. */
export function fixtureCalendar(query: URLSearchParams, now: Date): unknown[] {
  const today = newYorkDate(now);
  const start = DATE_RE.test(query.get("start") ?? "") ? (query.get("start") as string) : today;
  const end = DATE_RE.test(query.get("end") ?? "") ? (query.get("end") as string) : start;
  return tableDays(start, end).map((d) => ({
    date: d.date,
    open: wall(d.openAt),
    close: wall(d.closeAt),
    session_open: "0400",
    session_close: "2000",
    settlement_date: d.date,
  }));
}

const etIso = (ms: number): string => new Date(ms).toISOString();

/** `GET /v3/clock?markets=NYSE` from the table at `now`: pre 4:00, core, post to 8:00 PM, closed. */
export function fixtureMarketClock(now: Date): unknown {
  const t = now.getTime();
  const today = newYorkDate(now);
  const days = tableDays(today, shiftDate(today, CLOCK_HORIZON_DAYS));
  const session = days.find((d) => d.date === today);
  const ahead = days.filter((d) => d.openAt > t);
  const nextOpen = ahead[0];
  const preOf = (date: string) => newYorkInstant(date, PRE_START);
  let phase: string;
  let until: number;
  if (session && session.openAt <= t && t < session.closeAt) {
    [phase, until] = ["core", session.closeAt];
  } else if (session && t < session.openAt && t >= preOf(today)) {
    [phase, until] = ["pre", session.openAt];
  } else if (session && t >= session.closeAt && t < newYorkInstant(today, POST_END)) {
    [phase, until] = ["post", newYorkInstant(today, POST_END)];
  } else {
    [phase, until] = ["closed", nextOpen ? preOf(nextOpen.date) : t];
  }
  const current = session && t < session.closeAt ? session : nextOpen;
  return {
    clocks: [
      {
        market: {
          acronym: "NYSE",
          name: "New York Stock Exchange",
          mic: "XNYS",
          timezone: "America/New_York",
        },
        timestamp: etIso(t),
        is_market_day: session !== undefined,
        phase,
        phase_until: etIso(until),
        next_market_open: etIso(nextOpen?.openAt ?? t),
        next_market_close: etIso(current?.closeAt ?? t),
      },
    ],
  };
}
