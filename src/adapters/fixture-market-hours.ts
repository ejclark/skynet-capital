/**
 * The offline worlds' `/v2/calendar` and `/v3/clock` (#8248 criterion 7), built from the
 * checked-in table at the pinned instant (`SKYNET_FIXED_NOW`), so the server's market-hours reader
 * answers offline as it would against Alpaca, and the e2e guard stays pinned open at FIXED_CLOCK.
 * The writable world's `/v2/clock` (`marketClock` in data-source.ts) reads the same table and
 * instant, so all three agree there; the read-only world's `/v2/clock` stays its fixture's canned
 * body (open by default), as it was. Body shapes: `src/domain/market-clock.ts` → SHAPES.
 *
 * SIMPLIFIED, on purpose: pre-market from 4:00 AM ET and after-hours for four hours past the close
 * (to 8:00 PM, or 5:00 PM on a half day) — the shape of the exchange's extended sessions, not a
 * promise about any broker's.
 */
import { cachedDateTimeFormat } from "../domain/intl-format.js";
import { CLOCK_HORIZON_DAYS, newYorkDate, shiftDate, tableDays } from "../domain/market-clock.js";
import { newYorkInstant } from "../domain/market-session.js";

const PRE_START = 4 * 60;
const POST_HOURS_MS = 4 * 60 * 60_000;
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
    session_close: wall(d.closeAt + POST_HOURS_MS).replace(":", ""),
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
  } else if (session && t >= session.closeAt && t < session.closeAt + POST_HOURS_MS) {
    [phase, until] = ["post", session.closeAt + POST_HOURS_MS];
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
