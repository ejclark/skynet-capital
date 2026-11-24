/**
 * When each paper check may run (#8256): the window gate, judged from the broker's own `/v2/clock`
 * (open now or not) and `/v2/calendar` (each session's real open and close, holidays absent, half
 * days closing early), plus New York's wall time. A check outside its window places nothing and
 * records `not in window` with the next window's start, so a run at the wrong hour is an honest
 * row rather than a refusal mistaken for an answer.
 */
import type { SessionDay } from "../../domain/market-clock.js";
import { etDayTime, newYorkDate, shiftDate } from "../../domain/market-clock.js";
import { newYorkInstant } from "../../domain/market-session.js";
import type { CheckId } from "./catalog.js";

export type Phase = "regular hours" | "pre-market" | "after hours" | "overnight" | "closed";

/** What the gate reads: now, the broker's open flag, and sessions from yesterday on. */
export interface MarketFacts {
  readonly now: number;
  readonly clockOpen: boolean;
  readonly sessions: readonly SessionDay[];
}

/** Alpaca opens extended hours on options from this date (the stage 1 menu, #8161). */
export const OPTIONS_EXTENDED_FROM = "2026-12-04";

const at = (date: string, hh: number, mm = 0): number => newYorkInstant(date, hh * 60 + mm);

/** The overnight session that ends at `day`'s 04:00 opened at 20:00 the calendar day before. */
const overnightBefore = (day: SessionDay): [number, number] => [
  at(shiftDate(day.date, -1), 20),
  at(day.date, 4),
];

/** The market's phase at `now`, from the calendar (pre-market and after hours are 04:00-20:00). */
export function phaseAt(facts: MarketFacts): Phase {
  const { now } = facts;
  for (const day of facts.sessions) {
    if (now >= day.openAt && now < day.closeAt) return "regular hours";
    if (now >= at(day.date, 4) && now < day.openAt) return "pre-market";
    if (now >= day.closeAt && now < at(day.date, 20)) return "after hours";
    const [start, end] = overnightBefore(day);
    if (now >= start && now < end) return "overnight";
  }
  return "closed";
}

/** Each check's windows on one session day, epoch ms; regular-hours checks use the clock instead. */
function windowsOn(check: CheckId, day: SessionDay): [number, number][] {
  switch (check) {
    case "extended-hours":
      return [[day.closeAt, at(day.date, 20)], overnightBefore(day)];
    case "evening-quotes":
      return [[at(day.date, 17), at(day.date, 20)]];
    case "options-extended-hours":
      if (day.date < OPTIONS_EXTENDED_FROM) return [];
      return [
        [at(day.date, 7, 30), at(day.date, 9, 25)],
        [at(day.date, 16), at(day.date, 16, 15)],
      ];
    default:
      return [[day.openAt, day.closeAt]];
  }
}

const REGULAR_HOURS: ReadonlySet<CheckId> = new Set([
  "fractional-exits",
  "same-day-options",
  "mleg-stock-leg",
]);

export interface WindowAnswer {
  readonly open: boolean;
  /** The next window's start, ET in words, when closed and the calendar holds one. */
  readonly next?: string;
}

const words = (ms: number | undefined): string | undefined =>
  ms === undefined ? undefined : etDayTime(new Date(ms).toISOString());

/** Is `check`'s window open now, and if not, when does it next open? */
export function windowFor(check: CheckId, facts: MarketFacts): WindowAnswer {
  const { now, sessions } = facts;
  if (check === "bracket-after-close") {
    if (!facts.clockOpen) return { open: true };
    const today = sessions.find((d) => now >= d.openAt && now < d.closeAt);
    const next = words(today?.closeAt);
    return next ? { open: false, next } : { open: false };
  }
  if (REGULAR_HOURS.has(check)) {
    if (facts.clockOpen) return { open: true };
    const next = words(sessions.find((d) => d.openAt > now)?.openAt);
    return next ? { open: false, next } : { open: false };
  }
  const spans = sessions.flatMap((d) => windowsOn(check, d)).sort((a, b) => a[0] - b[0]);
  if (spans.some(([s, e]) => now >= s && now < e)) return { open: true };
  const next = words(spans.find(([s]) => s > now)?.[0]);
  return next ? { open: false, next } : { open: false };
}

/** Today's open, epoch ms, or undefined when today has no session or it has already opened —
 *  check 1 watches its brackets through the open when this is 15 minutes away or less. */
export function openingToday(facts: MarketFacts): number | undefined {
  const today = facts.sessions.find((d) => d.date === newYorkDate(new Date(facts.now)));
  if (!today || facts.now >= today.openAt) return undefined;
  return today.openAt;
}

/** New York's date `now` falls on, `YYYY-MM-DD` (results files are named by it). */
export const etDate = (now: number): string => newYorkDate(new Date(now));

/** The calendar range the gate needs: yesterday (an overnight that began then) to two weeks out. */
export function calendarRange(now: number): { start: string; end: string } {
  const today = etDate(now);
  return { start: shiftDate(today, -1), end: shiftDate(today, 14) };
}
