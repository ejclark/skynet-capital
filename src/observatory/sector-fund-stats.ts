import { benchmarkReturns } from "./benchmark-returns.js";

/**
 * THE SECTOR FUND NUMBERS on R&D → Coverage (#3811 slice 3): each SPDR Select Sector fund's
 * last-month return on split- and dividend-adjusted closes, the same window's gap to SPY, and its
 * 20-day realized volatility — all from one fetch of daily bars per fund, through the viewer's own
 * linked account.
 *
 * These are PROMPTS TO LOOK, never trade signals (the brief's constraint): no order button rides
 * beside them, and a number this module cannot compute honestly is absent rather than estimated.
 * The month is `benchmark-returns.ts`'s own "1M" window (last close vs the close on or just before
 * 30 calendar days back), so "vs S&P" here measures the same stretch the Accounts hero does.
 */

/** Calendar days of bars to ask for: the month window, a week of holiday slack, and enough
 *  sessions behind it for 20 daily returns. */
export const SECTOR_FUND_LOOKBACK_DAYS = 45;

/** Trading sessions in the volatility window, and the annualizing factor's sessions per year. */
const VOL_SESSIONS = 20;
const SESSIONS_PER_YEAR = 252;

type DailyBar = { readonly t: string; readonly c: number };

const usable = (bars: readonly DailyBar[]): DailyBar[] =>
  bars
    .filter((b) => Number.isFinite(Date.parse(b.t)) && Number.isFinite(b.c) && b.c > 0)
    .sort((a, b) => a.t.localeCompare(b.t));

/**
 * Annualized realized volatility over the last 20 sessions — the sample standard deviation of
 * daily log returns, times √252. Undefined with fewer than 21 closes: a shorter window would be a
 * different number wearing the same label.
 */
export function realizedVol20(bars: readonly DailyBar[]): number | undefined {
  const closes = usable(bars)
    .slice(-(VOL_SESSIONS + 1))
    .map((b) => b.c);
  if (closes.length < VOL_SESSIONS + 1) return undefined;
  const rets = closes.slice(1).map((c, i) => Math.log(c / (closes[i] as number)));
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(SESSIONS_PER_YEAR);
}

export interface FundStats {
  /** The month's price return as a fraction. */
  readonly ret: number;
  /** The fund's last bar's date — the as-of every number in this row carries. */
  readonly asOf: string;
  /** Return minus SPY's, in fractions — absent unless SPY's bars end on the same day. */
  readonly vsSpy?: number;
  readonly vol20?: number;
}

/**
 * One fund's numbers, or undefined when its bars cannot reach back a month. The S&P gap is only
 * stated when both legs end on the SAME session: a fund whose feed stopped a day early would
 * otherwise be compared against a different stretch of market and the gap would be wrong.
 */
export function fundStats(
  bars: readonly DailyBar[],
  spyBars: readonly DailyBar[] | undefined,
): FundStats | undefined {
  const own = usable(bars);
  const ret = benchmarkReturns(own)["1M"];
  const last = own[own.length - 1];
  if (ret === undefined || !last) return undefined;
  const asOf = last.t.slice(0, 10);
  const spy = spyBars ? usable(spyBars) : [];
  const spyLast = spy[spy.length - 1];
  const spyRet = spyLast?.t.slice(0, 10) === asOf ? benchmarkReturns(spy)["1M"] : undefined;
  const vol20 = realizedVol20(own);
  return {
    ret,
    asOf,
    ...(spyRet !== undefined ? { vsSpy: ret - spyRet } : {}),
    ...(vol20 !== undefined ? { vol20 } : {}),
  };
}
