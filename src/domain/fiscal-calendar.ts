/**
 * THE FISCAL CALENDAR (#1736 slice 1) — per-symbol fiscal year-end, so the research quarter lens
 * can snap to a company's own fiscal quarters when exactly one symbol is in scope.
 *
 * WHY ITS OWN TABLE, NOT A FIELD ON `EarningsPrint` (issue #1736's open question, settled to the
 * default): a fiscal year-end is a COMPANY fact that almost never changes, unrelated to any one
 * print's date — `earnings-calendar.ts`'s per-print `source` already carries print-level
 * provenance, and folding a company fact onto a print record would make every future print entry
 * repeat it. `EarningsPrint` and this table both cite sources the same way (`IR:` a hand-verified
 * primary source) so an audit reads them identically without needing to merge two shapes.
 *
 * SEEDED ONE SYMBOL AT A TIME, verified against the company's own filing (never inferred from a
 * print date — a symbol's fiscal year-end and its print cadence are independent facts). A symbol
 * absent from this table is NOT a bug: the quarter lens for it falls back to a calendar quarter,
 * which is the correct, honest behaviour until that symbol's fiscal year-end is confirmed (see the
 * EARS on #1736 — a fork thin on data stays a calendar quarter rather than guessing).
 */

export interface FiscalYearEnd {
  readonly symbol: string;
  /** 1–12: the calendar month the fiscal year ends in. NVDA: 1 — its fiscal year ends the last
   *  Sunday of January, so FY27 ends January 2027; month-level granularity is all every consumer
   *  here needs (quarter boundaries never turn on the day-of-month). */
  readonly fiscalYearEndMonth: number;
  /** How the fact was confirmed — `IR:` a hand-verified primary source, the same provenance style
   *  `earnings-calendar.ts` uses for print dates. */
  readonly source: string;
}

/**
 * Seeded with the symbol #1736 names as its worked example. Add the next tracked name only once
 * its own fiscal year-end is confirmed against its filing — a placeholder or a guess here would
 * silently mis-snap that symbol's quarter lens, which is worse than the calendar-quarter fallback
 * every un-seeded symbol already gets.
 */
export const FISCAL_YEAR_ENDS: readonly FiscalYearEnd[] = [
  {
    symbol: "NVDA",
    fiscalYearEndMonth: 1,
    source:
      "IR: NVIDIA's fiscal year ends the last Sunday in January (10-K cover page) — FY2027 ends January 2027",
  },
];

/** The fiscal year-end on record for `symbol`, or undefined when none is confirmed yet. */
export function fiscalYearEndFor(
  symbol: string,
  table: readonly FiscalYearEnd[] = FISCAL_YEAR_ENDS,
): FiscalYearEnd | undefined {
  return table.find((f) => f.symbol === symbol);
}

export interface FiscalQuarter {
  /** The FY label's number, e.g. 2027 for "FY27" — the company's own convention of naming a
   *  fiscal year after the calendar year it ENDS in. */
  readonly fiscalYear: number;
  readonly quarter: 1 | 2 | 3 | 4;
  /** The calendar month/year the fiscal quarter starts and ends in — a full fiscal quarter always
   *  starts and ends within these four fields; day-of-month never matters at this grain. */
  readonly startMonth: number;
  readonly startYear: number;
  readonly endMonth: number;
  readonly endYear: number;
}

/** Absolute, zero-based month index for `(year, month)` — arithmetic only, never displayed. */
const monthIndex = (year: number, month: number): number => year * 12 + (month - 1);

/** `(year, month)` for an absolute zero-based month index — the inverse of `monthIndex`. */
function fromMonthIndex(idx: number): { readonly year: number; readonly month: number } {
  const year = Math.floor(idx / 12);
  return { year, month: idx - year * 12 + 1 };
}

/**
 * The fiscal quarter containing `(anchorYear, anchorMonth)` under a fiscal year ending in
 * `fiscalYearEndMonth`. Pure month arithmetic — worked example (NVDA, `fiscalYearEndMonth` 1):
 * August 2026 is fiscal month 7 of FY27, i.e. quarter 3, Aug–Oct 2026 — issue #1736's own case.
 */
export function fiscalQuarterFor(
  anchorYear: number,
  anchorMonth: number,
  fiscalYearEndMonth: number,
): FiscalQuarter {
  const fiscalYear = anchorMonth > fiscalYearEndMonth ? anchorYear + 1 : anchorYear;
  const fiscalMonth = ((anchorMonth - fiscalYearEndMonth - 1 + 12) % 12) + 1;
  const quarter = Math.ceil(fiscalMonth / 3) as 1 | 2 | 3 | 4;
  const fyEndIdx = monthIndex(fiscalYear, fiscalYearEndMonth);
  const start = fromMonthIndex(fyEndIdx - 12 + ((quarter - 1) * 3 + 1));
  const end = fromMonthIndex(fyEndIdx - 12 + quarter * 3);
  return {
    fiscalYear,
    quarter,
    startMonth: start.month,
    startYear: start.year,
    endMonth: end.month,
    endYear: end.year,
  };
}
