import type { NetWorthWindowKey } from "./networth-json-view.js";

/**
 * The S&P 500 leg of the Accounts hero's "vs S&P" column (#3689 slice 3): SPY's price return over
 * each net-worth window, from one fetch of daily bars. Each window measures last close against the
 * close on (or just before) the window's start, `WINDOW_DAYS` calendar days back. Those spans match
 * the Alpaca `period` tokens the portfolio side uses (1W/1M/3M/1A), so both legs cover the same
 * stretch of market.
 *
 * Price return, not total return: SPY's dividend (~1.3%/yr) is left out, and on the 1Y window
 * that flatters the member by about a point. That's small next to a daily-bar approximation, and
 * the view says "vs S&P" rather than claiming a total-return benchmark. A window the bars don't
 * reach (a short feed, a new listing) is left out rather than stretched.
 */

export const WINDOW_DAYS: Record<NetWorthWindowKey, number> = {
  "7D": 7,
  "1M": 30,
  "3M": 91,
  "1Y": 365,
};

/** The lookback the route asks the feed for: the longest window plus a week of holiday slack. */
export const BENCHMARK_LOOKBACK_DAYS = WINDOW_DAYS["1Y"] + 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function benchmarkReturns(
  bars: readonly { readonly t: string; readonly c: number }[],
): Partial<Record<NetWorthWindowKey, number>> {
  const usable = bars
    .map((b) => ({ at: Date.parse(b.t), c: b.c }))
    .filter((b) => Number.isFinite(b.at) && Number.isFinite(b.c) && b.c > 0)
    .sort((a, b) => a.at - b.at);
  const last = usable[usable.length - 1];
  if (!last) return {};
  const out: Partial<Record<NetWorthWindowKey, number>> = {};
  for (const key of Object.keys(WINDOW_DAYS) as NetWorthWindowKey[]) {
    const startAt = last.at - WINDOW_DAYS[key] * DAY_MS;
    // The close on or just before the window's start; none means the feed doesn't reach back that far.
    let base: { at: number; c: number } | undefined;
    for (const b of usable) {
      if (b.at > startAt) break;
      base = b;
    }
    if (base && startAt - base.at <= 7 * DAY_MS) out[key] = last.c / base.c - 1;
  }
  return out;
}
