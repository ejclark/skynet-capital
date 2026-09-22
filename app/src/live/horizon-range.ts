/**
 * THE RANGE (#1704 slice 2) — the span of calendar days a lens selects around an anchor day, in
 * UTC date arithmetic on `YYYY-MM-DD` strings (the same date-only convention the event calendar
 * uses). Pure and total: no clock, no I/O; every function takes the anchor it reasons from.
 *
 *   day     → the anchor day itself
 *   week    → Monday–Sunday of the anchor's ISO week (the calendar grid is Monday-first)
 *   month   → the anchor's calendar month
 *   quarter → the anchor's calendar quarter — or, given a `fiscalYearEndMonth` (#1736: exactly
 *             one symbol in scope with a fiscal year-end on record), that company's own fiscal
 *             quarter instead (`src/domain/fiscal-calendar.ts` owns the per-symbol fact).
 *
 * Stepping moves the anchor by exactly one range (a day, 7 days, a month, 3 months), so the
 * arrows in the rail advance by the duration the lens names — Eric's ask on the brief.
 */
import { fiscalQuarterFor } from "../../../src/domain/fiscal-calendar";
import type { Lens } from "./research";

export interface DayRange {
  /** Inclusive, `YYYY-MM-DD`. */
  readonly start: string;
  /** Inclusive, `YYYY-MM-DD`. */
  readonly end: string;
}

/** A day the market is closed or closes early — the calendar colours it and counts sessions. */
export interface MarketClosure {
  readonly date: string;
  readonly reason: string;
  /** True for a 1:00 p.m. ET close — still a session, but a short one. */
  readonly early: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's `YYYY-MM-DD` on the exchange's wall clock (New York); an Intl failure reads UTC. */
export function marketToday(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date): string => d.toISOString().slice(0, 10);

/** `iso` shifted by `days` calendar days. */
export function addDays(iso: string, days: number): string {
  return toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
}

/** The first day of the month `months` after the anchor's month. */
function monthStart(iso: string, months: number): Date {
  const d = toDate(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

/**
 * The all lens's range — every ISO date compares inside it, so `inRange` needs no special case.
 * Never enumerate it (`daysOf` / `sessionsIn`); the rail checks the lens before it does.
 */
export const ALL_RANGE: DayRange = { start: "0000-01-01", end: "9999-12-31" };

/**
 * The span the lens selects around the anchor. `fiscalYearEndMonth` (#1736) snaps the QUARTER
 * lens to that company's fiscal quarter instead of the calendar one — pass it only when exactly
 * one symbol is in scope AND that symbol has a fiscal year-end on record
 * (`src/domain/fiscal-calendar.ts`); every other lens ignores it, and an un-fiscal quarter lens is
 * still the calendar quarter, unchanged.
 */
export function rangeFor(anchor: string, lens: Lens, fiscalYearEndMonth?: number): DayRange {
  switch (lens) {
    case "all":
      return ALL_RANGE;
    case "day":
      return { start: anchor, end: anchor };
    case "week": {
      const lead = (toDate(anchor).getUTCDay() + 6) % 7; // Monday-first
      const start = addDays(anchor, -lead);
      return { start, end: addDays(start, 6) };
    }
    case "month":
      return {
        start: toIso(monthStart(anchor, 0)),
        end: addDays(toIso(monthStart(anchor, 1)), -1),
      };
    case "quarter": {
      const d = toDate(anchor);
      if (fiscalYearEndMonth !== undefined) {
        const fq = fiscalQuarterFor(d.getUTCFullYear(), d.getUTCMonth() + 1, fiscalYearEndMonth);
        const pad2 = (n: number): string => String(n).padStart(2, "0");
        const firstOf = (year: number, month: number): string =>
          `${String(year)}-${pad2(month)}-01`;
        const nextMonth =
          fq.endMonth === 12 ? firstOf(fq.endYear + 1, 1) : firstOf(fq.endYear, fq.endMonth + 1);
        return { start: firstOf(fq.startYear, fq.startMonth), end: addDays(nextMonth, -1) };
      }
      const q0 = new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1));
      return { start: toIso(q0), end: addDays(toIso(monthStart(toIso(q0), 3)), -1) };
    }
  }
}

/** The anchor one range forward (+1) or back (−1) — the arrows step by the lens's duration. */
export function stepAnchor(
  anchor: string,
  lens: Lens,
  direction: 1 | -1,
  fiscalYearEndMonth?: number,
): string {
  switch (lens) {
    case "all": // no span to step — the arrows page the grid's own unit, the month
    case "month":
      return toIso(monthStart(anchor, direction));
    case "day":
      return addDays(anchor, direction);
    case "week":
      return addDays(anchor, 7 * direction);
    case "quarter":
      // A fiscal quarter is still 3 calendar months, so stepping the RANGE's own start by ±3
      // months lands on the neighbouring quarter's start whichever calendar it is aligned to.
      return toIso(
        monthStart(rangeFor(anchor, "quarter", fiscalYearEndMonth).start, 3 * direction),
      );
  }
}

export const inRange = (iso: string, range: DayRange): boolean =>
  iso >= range.start && iso <= range.end;

/** Every `YYYY-MM-DD` in the range, ascending. */
export function daysOf(range: DayRange): string[] {
  const out: string[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) out.push(d);
  return out;
}

const isWeekend = (iso: string): boolean => {
  const day = toDate(iso).getUTCDay();
  return day === 0 || day === 6;
};

/**
 * Trading sessions in the range: weekdays minus full-day closures. An early close is still a
 * session (a short one), so it counts — the theta clock runs on it.
 */
export function sessionsIn(range: DayRange, closures: readonly MarketClosure[]): number {
  const closed = new Set(closures.filter((c) => !c.early).map((c) => c.date));
  return daysOf(range).filter((d) => !(isWeekend(d) || closed.has(d))).length;
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

const short = (iso: string): string => {
  const d = toDate(iso);
  return `${MONTHS[d.getUTCMonth()] ?? ""} ${String(d.getUTCDate())}`;
};

/** The fiscal quarter's identity for the label — one symbol, one confirmed fiscal year-end. */
export interface FiscalQuarterLabel {
  readonly symbol: string;
  readonly fiscalYear: number;
  readonly quarter: 1 | 2 | 3 | 4;
}

/**
 * The head-of-rail label for a range under a lens — "Sep 7 – Sep 13", "September 2026",
 * "Q3 2026 · Jul–Sep · calendar". `fiscal` (#1736) names a company's OWN fiscal quarter instead:
 * "Q3 FY27 · NVDA · Aug–Oct 2026" — pass it only alongside the same `fiscalYearEndMonth` given to
 * `rangeFor`, so the label always matches the range it names.
 */
export function rangeLabel(range: DayRange, lens: Lens, fiscal?: FiscalQuarterLabel): string {
  const start = toDate(range.start);
  switch (lens) {
    case "all":
      return "all research";
    case "day":
      return `${short(range.start)}, ${String(start.getUTCFullYear())}`;
    case "week":
      return `${short(range.start)} – ${short(range.end)}`;
    case "month":
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    case "quarter": {
      const end = toDate(range.end);
      const months = `${MONTHS[start.getUTCMonth()] ?? ""}–${MONTHS[end.getUTCMonth()] ?? ""}`;
      if (fiscal) {
        // A company's OWN fiscal quarter — named explicitly so it is never mistaken for a
        // calendar one (NVDA's Q3 FY27 is Aug–Oct 2026, not Jul–Sep).
        const fy = String(fiscal.fiscalYear).slice(-2);
        return `Q${String(fiscal.quarter)} FY${fy} · ${fiscal.symbol} · ${months} ${String(end.getUTCFullYear())}`;
      }
      // A CALENDAR quarter, and the label says so twice over: naming its months, and the trailing
      // "calendar" tag (Eric, 2026-09-06: "the labeling should also clearly articulate the
      // observable behavior… avoids confusion if noticed but not understood") — load-bearing now
      // that the SAME lens can read a company's fiscal quarter instead (#1736).
      return `Q${String(Math.floor(start.getUTCMonth() / 3) + 1)} ${String(start.getUTCFullYear())} · ${months} · calendar`;
    }
  }
}
