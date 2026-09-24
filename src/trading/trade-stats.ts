import { MARKET_TIMEZONE, marketDayKey } from "../domain/market-day.js";
import { parseOccSymbol } from "./option-symbols.js";
import type { RoundTrip } from "./round-trips.js";

/**
 * TRADE ANALYSIS — the measures every trading journal converges on, computed over closed round
 * trips. Win rate, profit factor, expectancy and the payoff ratio are the four that answer
 * different questions, and the reason all four are here rather than a "score":
 *
 *  - **win rate** — how often you're right. Alone it's a trap: a 90%-win strategy that gives it
 *    all back on the tenth trade is a losing one.
 *  - **profit factor** — gross profit ÷ gross loss. The single number that says whether the wins
 *    pay for the losses. Undefined (null) with no losses; we refuse to print ∞ as a real value.
 *  - **expectancy** — average realized dollars per trade. What one more trade is *worth*.
 *  - **payoff ratio** — average win ÷ average loss. Pairs with win rate: a low win rate is fine
 *    when the payoff is big, which is exactly the lesson the academy teaches.
 *
 * Honesty invariant, inherited from `observatory/history-metrics.ts` and the metrics-layer plan:
 * **an unmeasurable stat is `null`, never 0.** No trades is not a 0% win rate, and no losing
 * trades is not a profit factor of zero.
 */

interface StreakRun {
  readonly kind: "win" | "loss" | "none";
  readonly length: number;
}

export interface TradeStats {
  readonly trades: number;
  readonly wins: number;
  readonly losses: number;
  /** Exactly-flat trades — counted separately so they never inflate a win rate. */
  readonly scratches: number;
  /** Wins ÷ decided (non-scratch) trades, in percent. Null with no decided trades. */
  readonly winRate: number | null;
  readonly grossProfit: number;
  /** Positive magnitude of losing trades. */
  readonly grossLoss: number;
  readonly netRealized: number;
  /** Gross profit ÷ gross loss. Null when nothing has been lost yet (∞ is not a stat). */
  readonly profitFactor: number | null;
  /** Average realized dollars per trade. Null with no trades. */
  readonly expectancy: number | null;
  readonly avgWin: number | null;
  /** Positive magnitude of the average loss. */
  readonly avgLoss: number | null;
  /** Average win ÷ average loss. Null until both exist. */
  readonly payoffRatio: number | null;
  readonly bestTrade: RoundTrip | null;
  readonly worstTrade: RoundTrip | null;
  readonly avgHoldMs: number | null;
  /** Ranked by hold time, not dollars — `bestTrade`/`worstTrade` answer a different question. */
  readonly longestHold: RoundTrip | null;
  readonly shortestHold: RoundTrip | null;
  /** On a closed trip the buy/sell axis IS the direction: a long opened with a buy, a short (a
   *  written option) opened with a sell. Every trip has one of each leg, so counting legs would
   *  just repeat `trades` twice. */
  readonly byDirection: { readonly long: number; readonly short: number };
  readonly byInstrument: { readonly stock: number; readonly call: number; readonly put: number };
  /** Σ entryPrice × quantity — the same basis each trip's own `returnPct` is measured against. */
  readonly capitalCommitted: number;
  /** netRealized ÷ capitalCommitted, in percent. Capital-weighted on purpose: averaging per-trip
   *  percents would let a $10 trip at +50% outvote a $10k trip at −5%. Null with nothing committed. */
  readonly returnPct: number | null;
  /** The streak in progress at the most recent close. */
  readonly currentStreak: StreakRun;
  readonly longestWinStreak: number;
  readonly longestLossStreak: number;
}

const NO_STREAK: StreakRun = { kind: "none", length: 0 };

function streaks(trips: readonly RoundTrip[]): {
  current: StreakRun;
  longestWin: number;
  longestLoss: number;
} {
  let current: StreakRun = NO_STREAK;
  let longestWin = 0;
  let longestLoss = 0;
  for (const trip of trips) {
    if (trip.realized === 0) {
      // A scratch neither extends nor breaks a streak — it says nothing about being right.
      continue;
    }
    const kind = trip.realized > 0 ? "win" : "loss";
    current = current.kind === kind ? { kind, length: current.length + 1 } : { kind, length: 1 };
    if (kind === "win") longestWin = Math.max(longestWin, current.length);
    else longestLoss = Math.max(longestLoss, current.length);
  }
  return { current, longestWin, longestLoss };
}

/** The stat family over a set of closed trips (assumed oldest-close-first, as the ledger emits). */
export function tradeStats(trips: readonly RoundTrip[]): TradeStats {
  const wins = trips.filter((t) => t.realized > 0);
  const losses = trips.filter((t) => t.realized < 0);
  const scratches = trips.length - wins.length - losses.length;
  const decided = wins.length + losses.length;

  const grossProfit = wins.reduce((s, t) => s + t.realized, 0);
  const grossLoss = losses.reduce((s, t) => s - t.realized, 0);
  const netRealized = grossProfit - grossLoss;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : null;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : null;

  const ranked = [...trips].sort((a, b) => b.realized - a.realized);
  const byHold = [...trips].sort((a, b) => b.holdMs - a.holdMs);
  const { current, longestWin, longestLoss } = streaks(trips);
  const shorts = trips.filter((t) => t.short).length;
  const byInstrument = { stock: 0, call: 0, put: 0 };
  for (const trip of trips) byInstrument[parseOccSymbol(trip.symbol)?.type ?? "stock"] += 1;
  const capitalCommitted = trips.reduce((s, t) => s + t.entryPrice * t.quantity, 0);

  return {
    trades: trips.length,
    wins: wins.length,
    losses: losses.length,
    scratches,
    winRate: decided > 0 ? (wins.length / decided) * 100 : null,
    grossProfit,
    grossLoss,
    netRealized,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    expectancy: trips.length > 0 ? netRealized / trips.length : null,
    avgWin,
    avgLoss,
    payoffRatio: avgWin !== null && avgLoss !== null && avgLoss > 0 ? avgWin / avgLoss : null,
    bestTrade: ranked[0] ?? null,
    worstTrade: ranked.length > 0 ? (ranked[ranked.length - 1] as RoundTrip) : null,
    avgHoldMs: trips.length > 0 ? trips.reduce((s, t) => s + t.holdMs, 0) / trips.length : null,
    longestHold: byHold[0] ?? null,
    shortestHold: byHold.at(-1) ?? null,
    byDirection: { long: trips.length - shorts, short: shorts },
    byInstrument,
    capitalCommitted,
    returnPct: capitalCommitted > 0 ? (netRealized / capitalCommitted) * 100 : null,
    currentStreak: current,
    longestWinStreak: longestWin,
    longestLossStreak: longestLoss,
  };
}

/** Per-symbol breakdown — "which tickers actually pay you", ranked by realized dollars. */
export interface SymbolStats {
  readonly symbol: string;
  readonly trades: number;
  readonly wins: number;
  readonly winRate: number | null;
  readonly netRealized: number;
}

export function statsBySymbol(trips: readonly RoundTrip[]): SymbolStats[] {
  const groups = new Map<string, RoundTrip[]>();
  for (const trip of trips) {
    const list = groups.get(trip.symbol);
    if (list) list.push(trip);
    else groups.set(trip.symbol, [trip]);
  }
  return [...groups.entries()]
    .map(([symbol, group]) => {
      const stats = tradeStats(group);
      return {
        symbol,
        trades: stats.trades,
        wins: stats.wins,
        winRate: stats.winRate,
        netRealized: stats.netRealized,
      };
    })
    .sort((a, b) => b.netRealized - a.netRealized);
}

/** Per-playbook breakdown — the full `TradeStats` family, so "which plays actually work" gets the
 *  same win-rate/profit-factor/expectancy/streaks answer the account-level view already has,
 *  computed across EVERY trade that named the playbook (any participant, human or bot). */
export interface PlaybookStats extends TradeStats {
  readonly playbookId: string;
}

/**
 * Groups closed round trips by `RoundTrip.playbookId` (#885 attribution) and runs the full
 * `tradeStats` family per group. Trips with no `playbookId` (a manual desk trade, or a bot fill
 * with no playbook attached) are excluded — this measures playbooks, not "everything else," and a
 * playbook with zero attributed trips simply doesn't appear rather than showing an empty row.
 * Deliberately no weighting/benchmark layer yet — a plain aggregate is the first slice; those are
 * additive refinements for later, not a blocker on shipping the base capture.
 */
export function statsByPlaybook(trips: readonly RoundTrip[]): PlaybookStats[] {
  const groups = new Map<string, RoundTrip[]>();
  for (const trip of trips) {
    if (!trip.playbookId) continue;
    const list = groups.get(trip.playbookId);
    if (list) list.push(trip);
    else groups.set(trip.playbookId, [trip]);
  }
  return [...groups.entries()]
    .map(([playbookId, group]) => ({ playbookId, ...tradeStats(group) }))
    .sort((a, b) => b.netRealized - a.netRealized);
}

/** One calendar day of realized P/L — the input to the history view's day strip. */
export interface DayResult {
  /** YYYY-MM-DD, in the given IANA timezone (a day that splits a session is a wrong number). */
  readonly day: string;
  readonly realized: number;
  readonly trades: number;
}

/**
 * Realized P/L bucketed by close date, oldest first. Days are computed in the participant's own
 * timezone (defaulting to US market time) so a trade closed at 3:55pm ET never lands on the next
 * calendar day the way a naive UTC slice would put it.
 */
export function realizedByDay(
  trips: readonly RoundTrip[],
  timezone = MARKET_TIMEZONE,
): DayResult[] {
  const days = new Map<string, { realized: number; trades: number }>();
  for (const trip of trips) {
    const key = marketDayKey(trip.closedAt, timezone);
    const entry = days.get(key) ?? { realized: 0, trades: 0 };
    entry.realized += trip.realized;
    entry.trades += 1;
    days.set(key, entry);
  }
  return [...days.entries()]
    .map(([day, value]) => ({ day, realized: value.realized, trades: value.trades }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
