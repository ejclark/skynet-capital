import type { TradeStats } from "../trading/trade-stats.js";
import { currentDayStreak, type DayStreak, longestDayStreak } from "./day-trophies.js";
import { formatPctOrDash } from "./desk-data.js";
import type { EquitySample } from "./history-store.js";
import { formatSigned } from "./render-atoms.js";

/**
 * THE STREAKS SECTION of the desk pulse — two families of run, rendered side by side and
 * never blended, because they answer different questions over different inputs:
 *
 *  - **Trading-day runs** (`day-trophies.ts`) walk the recorded equity curve. A day the market was
 *    closed has no sample at all, so a weekend or a holiday can never break a run — and the totals
 *    include unrealized swings, because equity does.
 *  - **Trade runs** (`trade-stats.ts`) walk closed round trips. They measure being right, not the
 *    calendar: an exactly-flat scratch neither extends nor breaks one.
 *
 * A five-green-day run and a five-winning-trade run are therefore different facts, and a reader who
 * merged them would be wrong. Each group states in its own caption what it counted.
 *
 * Split out of `pulse-json-view.ts` so both files stay well under the flat file cap and this one
 * stays a pure view-model builder: it formats, it never re-derives a number.
 */

/** One line in a group. Reached through `PulseStreakGroup.rows`; never imported on its own. */
interface PulseStreakRow {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly tone: "pos" | "neg" | "flat";
}

export interface PulseStreakGroup {
  readonly title: string;
  /** What this family counted — load-bearing, not decoration; see the module note. */
  readonly caption: string;
  readonly rows: readonly PulseStreakRow[];
  /** Rendered instead of the rows when there are none. Absence is said out loud, never as a zero. */
  readonly empty: string;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A run's span and what it was worth — the dates alone never say what the streak paid or cost. */
function runNote(streak: DayStreak): string {
  return `${streak.from} → ${streak.to} · ${formatSigned(streak.abs)} · ${formatPctOrDash(streak.pct, true)}`;
}

function dayRow(label: string, streak: DayStreak | null): PulseStreakRow | null {
  if (!streak) return null;
  return {
    label,
    value: plural(streak.length, "trading day"),
    note: runNote(streak),
    tone: streak.direction === "green" ? "pos" : "neg",
  };
}

function dayRows(samples: readonly EquitySample[], timezone: string | undefined): PulseStreakRow[] {
  const current = currentDayStreak(samples, timezone);
  return [
    dayRow(current?.direction === "red" ? "Running red" : "Running green", current),
    dayRow("Longest green run", longestDayStreak(samples, "green", timezone)),
    dayRow("Longest red run", longestDayStreak(samples, "red", timezone)),
  ].filter((row): row is PulseStreakRow => row !== null);
}

function tradeRows(stats: TradeStats): PulseStreakRow[] {
  const rows: PulseStreakRow[] = [];
  const { currentStreak: current } = stats;
  if (current.kind !== "none") {
    rows.push({
      label: current.kind === "win" ? "Running hot" : "Running cold",
      value:
        current.kind === "win"
          ? plural(current.length, "win")
          : `${current.length} ${current.length === 1 ? "loss" : "losses"}`,
      note: "in a row at the last close",
      tone: current.kind === "win" ? "pos" : "neg",
    });
  }
  if (stats.longestWinStreak > 0)
    rows.push({
      label: "Longest win streak",
      value: plural(stats.longestWinStreak, "trade"),
      note: "consecutive winners",
      tone: "pos",
    });
  if (stats.longestLossStreak > 0)
    rows.push({
      label: "Longest loss streak",
      value: plural(stats.longestLossStreak, "trade"),
      note: "consecutive losers",
      tone: "neg",
    });
  return rows;
}

/** Both run families for one desk, each group carrying its own empty state. */
export function pulseStreaks(
  samples: readonly EquitySample[],
  stats: TradeStats,
  timezone?: string,
): PulseStreakGroup[] {
  return [
    {
      title: "Trading-day runs",
      caption:
        "Recorded equity, day over day. A closed market has no sample, so weekends and holidays never break a run; totals include unrealized moves.",
      rows: dayRows(samples, timezone),
      empty:
        "Needs two recorded days with a move between them — no day is back-filled or flattened.",
    },
    {
      title: "Trade runs",
      caption:
        "Closed round trips, in order. An exactly-flat scratch neither extends nor breaks a run — it says nothing about being right.",
      rows: tradeRows(stats),
      empty: "Needs a closed round trip that decided one way or the other.",
    },
  ];
}
