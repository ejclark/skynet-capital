/**
 * The exchange calendar's CLOSURES — full-day holidays and 1:00 p.m. ET early closes — as a small
 * checked-in table, so the research rail can colour a closed weekday and count a week's sessions
 * (Labor Day week is four sessions; theta decays through the third day off) without a broker
 * credential. The bots' clock stays Alpaca's (`autonomous-market-clock.ts`): this table informs a
 * calendar, it never gates an order — the desk's own gate asks the exchange before any fill.
 *
 * SOURCE: `NYSE:` nyse.com/markets/hours-calendars, the exchange's own Holidays & Trading Hours
 * table, read at the primary 2026-09-20 (HTTP 200 after its 302, 109,133 bytes) — header verbatim
 * "All NYSE markets observe U.S. holidays as listed below for 2026, 2027, and 2028". Every one of
 * the 23 rows below was re-derived from that grid cell by cell, including the three early closes,
 * which are footnotes rather than table rows: Thursday, December 24, 2026 and the day after
 * Thanksgiving in each year. Superseded prefix, kept for the audit trail: the table was first
 * entered as `NEWS:` off a web-search summary of NYSE Group's 2024-11-08 press release, because
 * nyse.com, sifma.org and nasdaqtrader.com were all EGRESS_BLOCKED for the 2026-09-06 session that
 * wrote it; that session asked for exactly this re-read, and it found no date wrong. The dates
 * agree with the exchange's observed-date rule — a holiday on Saturday closes the preceding
 * Friday, on Sunday the following Monday — and 2027-12-24 is a FULL closure (Christmas observed),
 * so 2027 has no Christmas Eve early close.
 *
 * HORIZON: the exchange now publishes three years, not two — its 2028 column is live and read but
 * deliberately NOT entered here, because #2552's scope was the source-prefix taxonomy and the
 * event calendar's own 2028 closures already carry those dates as `confirmed` entries. Extend by
 * year with a dated source line; never infer a date.
 */

export interface MarketClosure {
  /** `YYYY-MM-DD`, the exchange's calendar day. */
  readonly date: string;
  readonly reason: string;
  /** True for a 1:00 p.m. ET early close — still a session, a short one. */
  readonly early: boolean;
}

const full = (date: string, reason: string): MarketClosure => ({ date, reason, early: false });
const early = (date: string, reason: string): MarketClosure => ({ date, reason, early: true });

/** Date-sorted. Two years is the exchange's own publishing horizon. */
export const MARKET_CLOSURES: readonly MarketClosure[] = [
  full("2026-01-01", "New Year's Day"),
  full("2026-01-19", "Martin Luther King Jr. Day"),
  full("2026-02-16", "Washington's Birthday"),
  full("2026-04-03", "Good Friday"),
  full("2026-05-25", "Memorial Day"),
  full("2026-06-19", "Juneteenth"),
  full("2026-07-03", "Independence Day (observed)"),
  full("2026-09-07", "Labor Day"),
  full("2026-11-26", "Thanksgiving Day"),
  early("2026-11-27", "Day after Thanksgiving — 1:00 p.m. close"),
  early("2026-12-24", "Christmas Eve — 1:00 p.m. close"),
  full("2026-12-25", "Christmas Day"),
  full("2027-01-01", "New Year's Day"),
  full("2027-01-18", "Martin Luther King Jr. Day"),
  full("2027-02-15", "Washington's Birthday"),
  full("2027-03-26", "Good Friday"),
  full("2027-05-31", "Memorial Day"),
  full("2027-06-18", "Juneteenth (observed)"),
  full("2027-07-05", "Independence Day (observed)"),
  full("2027-09-06", "Labor Day"),
  full("2027-11-25", "Thanksgiving Day"),
  early("2027-11-26", "Day after Thanksgiving — 1:00 p.m. close"),
  full("2027-12-24", "Christmas Day (observed)"),
];

/** Closures inside `[from, to]` inclusive (`YYYY-MM-DD` bounds), in date order. */
export function marketClosures(from: string, to: string): MarketClosure[] {
  return MARKET_CLOSURES.filter((c) => c.date >= from && c.date <= to);
}

/** True when the exchange is closed all day on `date` — a weekend or a full-day holiday. */
export function isMarketClosed(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (day === 0 || day === 6) return true;
  return MARKET_CLOSURES.some((c) => c.date === date && !c.early);
}
