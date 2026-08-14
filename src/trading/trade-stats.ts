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
  const { current, longestWin, longestLoss } = streaks(trips);

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

/** One calendar day of realized P/L — the input to the history view's day strip. */
export interface DayResult {
  /** YYYY-MM-DD, in the given IANA timezone (a day that splits a session is a wrong number). */
  readonly day: string;
  readonly realized: number;
  readonly trades: number;
}

function dayKey(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  try {
    // en-CA renders ISO-shaped YYYY-MM-DD, which sorts lexically — the property the strip needs.
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Realized P/L bucketed by close date, oldest first. Days are computed in the participant's own
 * timezone (defaulting to US market time) so a trade closed at 3:55pm ET never lands on the next
 * calendar day the way a naive UTC slice would put it.
 */
export function realizedByDay(
  trips: readonly RoundTrip[],
  timezone = "America/New_York",
): DayResult[] {
  const days = new Map<string, { realized: number; trades: number }>();
  for (const trip of trips) {
    const key = dayKey(trip.closedAt, timezone);
    const entry = days.get(key) ?? { realized: 0, trades: 0 };
    entry.realized += trip.realized;
    entry.trades += 1;
    days.set(key, entry);
  }
  return [...days.entries()]
    .map(([day, value]) => ({ day, realized: value.realized, trades: value.trades }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
