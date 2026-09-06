/**
 * The exchange calendar's CLOSURES — full-day holidays and 1:00 p.m. ET early closes — as a small
 * checked-in table, so the research rail can colour a closed weekday and count a week's sessions
 * (Labor Day week is four sessions; theta decays through the third day off) without a broker
 * credential. The bots' clock stays Alpaca's (`autonomous-market-clock.ts`): this table informs a
 * calendar, it never gates an order — the desk's own gate asks the exchange before any fill.
 *
 * SOURCE: `NEWS:` the NYSE Group press release of 2024-11-08, "NYSE Group Announces 2025, 2026 and
 * 2027 Holiday and Early Closings Calendar", as summarised by a web search on 2026-09-06 — NOT read
 * at the primary. nyse.com, sifma.org and nasdaqtrader.com were all blocked by the session's
 * network egress proxy (EGRESS_BLOCKED), so this table carries the secondary's prefix until a
 * session that can reach ir.theice.com or nyse.com re-reads it and flips the prefix to `NYSE:`
 * (the blind spot is filed as its own bottleneck issue). The dates agree with the exchange's
 * observed-date rule — a holiday on Saturday closes the preceding Friday, on Sunday the following
 * Monday — and 2027-12-24 is a FULL closure (Christmas observed), so 2027 has no Christmas Eve
 * early close. Extend by year with a dated source line; never infer a date.
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
