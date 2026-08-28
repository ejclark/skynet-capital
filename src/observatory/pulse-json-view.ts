import type { RoundTrip } from "../trading/round-trips.js";
import { tradeStats } from "../trading/trade-stats.js";
import type { TradeActivityRecord } from "./activity-store.js";
import { deskLedger, formatPctOrDash, formatRatio } from "./desk-data.js";
import { equityDrawdown } from "./equity-sparkline.js";
import { doubledAt, seedBaseline } from "./history-metrics.js";
import type { EquitySample } from "./history-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { type PulseStreakGroup, pulseStreaks } from "./pulse-streaks.js";
import { formatCurrency, formatSigned, formatTimestamp, plClass } from "./render-atoms.js";

/**
 * DESK PULSE AS DATA (#738 phase 4a) — `/api/desk/:id/pulse`, the JSON view behind the shell's
 * Insights-style Pulse page. Same doctrine as `performance-view.ts`: three honestly-separate
 * inputs (recorded equity samples, closed round trips, the live snapshot), and each section
 * carries its own empty state — a desk with fills but no history still gets its weeks, one with
 * history but nothing closed still gets its curve. Numbers arrive formatted; the browser draws
 * the server's normalized geometry and never re-derives a figure.
 */

interface PulsePoint {
  /** Time position, 0..1 across the sampled span. */
  readonly x: number;
  /** Equity position, 0..1 from the span's low to its high. */
  readonly y: number;
}

interface PulseCurve {
  readonly points: readonly PulsePoint[];
  readonly startLabel: string;
  readonly endLabel: string;
  readonly lowLabel: string;
  readonly highLabel: string;
  readonly peak: string;
  readonly drawdown: string;
  readonly drawdownTone: "neg" | "flat";
}

interface PulseWeek {
  /** Week-of label, e.g. "Aug 17". */
  readonly label: string;
  readonly pl: string;
  readonly tone: "pos" | "neg" | "flat";
  /** Bar magnitude 0..1 against the loudest week. */
  readonly bar: number;
}

interface PulseTile {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly tone?: "pos" | "neg" | "flat";
}

interface PulseRace {
  readonly line: string;
  /** 0..100 progress toward 2×; full when already doubled. */
  readonly progress: number;
  readonly doubled: boolean;
}

export interface DeskPulseView {
  /** null until two samples exist — the curve section says "still accruing". */
  readonly curve: PulseCurve | null;
  /** Empty until a round trip closes — the weeks section says "needs a closed trade". */
  readonly weeks: readonly PulseWeek[];
  readonly tiles: readonly PulseTile[];
  readonly race: PulseRace | null;
  /** Both run families (#780) — day-over-day equity and closed round trips, kept separate. */
  readonly streaks: readonly PulseStreakGroup[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_CAP = 12;

const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function pulseCurve(samples: readonly EquitySample[]): PulseCurve | null {
  if (samples.length < 2) return null;
  const ordered = [...samples].sort((a, b) => a.at.localeCompare(b.at));
  const first = ordered[0] as EquitySample;
  const last = ordered[ordered.length - 1] as EquitySample;
  const t0 = Date.parse(first.at);
  const span = Math.max(1, Date.parse(last.at) - t0);
  const low = Math.min(...ordered.map((s) => s.equity));
  const high = Math.max(...ordered.map((s) => s.equity));
  const rise = Math.max(1e-9, high - low);
  const drawdown = equityDrawdown(samples);
  return {
    points: ordered.map((s) => ({
      x: (Date.parse(s.at) - t0) / span,
      y: (s.equity - low) / rise,
    })),
    startLabel: dayLabel(first.at),
    endLabel: dayLabel(last.at),
    lowLabel: formatCurrency(low),
    highLabel: formatCurrency(high),
    peak: formatCurrency(drawdown?.peak ?? high),
    drawdown: drawdown
      ? `${drawdown.ddPct.toFixed(2)}% · ${formatCurrency(drawdown.ddAbs)}`
      : "0.00%",
    drawdownTone: drawdown && drawdown.ddPct > 0 ? "neg" : "flat",
  };
}

/** Monday 00:00 UTC of the week containing the instant — the bucket key. */
function weekStartMs(at: string): number {
  const t = new Date(at);
  const day = (t.getUTCDay() + 6) % 7;
  return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - day);
}

function pulseWeeks(trips: readonly RoundTrip[]): PulseWeek[] {
  if (trips.length === 0) return [];
  const byWeek = new Map<number, number>();
  for (const trip of trips) {
    const week = weekStartMs(trip.closedAt);
    byWeek.set(week, (byWeek.get(week) ?? 0) + trip.realized);
  }
  const lastWeek = Math.max(...byWeek.keys());
  const firstWeek = Math.max(Math.min(...byWeek.keys()), lastWeek - (WEEK_CAP - 1) * WEEK_MS);
  const weeks: { at: number; pl: number }[] = [];
  for (let at = firstWeek; at <= lastWeek; at += WEEK_MS) {
    weeks.push({ at, pl: byWeek.get(at) ?? 0 });
  }
  const loudest = Math.max(1e-9, ...weeks.map((w) => Math.abs(w.pl)));
  return weeks.map((w) => ({
    label: dayLabel(new Date(w.at).toISOString()),
    pl: formatSigned(w.pl),
    tone: plClass(w.pl),
    bar: Math.abs(w.pl) / loudest,
  }));
}

function pulseRace(samples: readonly EquitySample[], equity: number): PulseRace | null {
  const seed = seedBaseline(samples);
  if (!seed || seed.equity <= 0) return null;
  const already = doubledAt(samples);
  const target = seed.equity * 2;
  const progress = Math.max(0, Math.min(100, ((equity - seed.equity) / seed.equity) * 100));
  return already
    ? {
        line: `Doubled — crossed ${formatCurrency(target)} on ${formatTimestamp(already.at)}. Banked; a later dip can't take it back.`,
        progress: 100,
        doubled: true,
      }
    : {
        line: `${progress.toFixed(1)}% of the way to 2× — ${formatCurrency(equity)} against a founding ${formatCurrency(seed.equity)}.`,
        progress,
        doubled: false,
      };
}

export function deskPulseView(
  snapshot: ParticipantSnapshot,
  samples: readonly EquitySample[],
  durable?: readonly TradeActivityRecord[],
): DeskPulseView {
  const trips = deskLedger(snapshot, durable).trips;
  const stats = tradeStats(trips);
  const drawdown = equityDrawdown(samples);
  const tiles: PulseTile[] = [
    {
      label: "Equity",
      value: formatCurrency(snapshot.equity),
      note: `cash ${formatCurrency(snapshot.cash)}`,
    },
    {
      label: "Net realized",
      value: formatSigned(stats.netRealized),
      note: stats.trades === 0 ? "needs a closed trade" : "booked, not on paper",
      ...(stats.trades > 0 ? { tone: plClass(stats.netRealized) } : {}),
    },
    {
      label: "Win rate",
      value: formatPctOrDash(stats.winRate),
      note: stats.trades === 0 ? "needs a closed trade" : `${stats.wins}W · ${stats.losses}L`,
    },
    {
      label: "Profit factor",
      value: formatRatio(stats.profitFactor, "×"),
      note: stats.profitFactor === null ? "nothing lost yet" : "wins ÷ losses; above 1× is paying",
    },
    {
      label: "Max drawdown",
      value: drawdown ? `${drawdown.ddPct.toFixed(2)}%` : "—",
      note: drawdown ? `from peak ${formatCurrency(drawdown.peak)}` : "needs two equity samples",
      ...(drawdown ? { tone: drawdown.ddPct > 0 ? ("neg" as const) : ("flat" as const) } : {}),
    },
  ];
  return {
    curve: pulseCurve(samples),
    weeks: pulseWeeks(trips),
    tiles,
    race: pulseRace(samples, snapshot.equity),
    streaks: pulseStreaks(samples, stats),
  };
}
