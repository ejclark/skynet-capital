import { formatDateTime } from "../domain/intl-format.js";
import type { RoundTrip } from "../trading/round-trips.js";
import { tradeStats } from "../trading/trade-stats.js";
import type { TradeActivityRecord } from "./activity-store.js";
import { deskLedger, formatPctOrDash, formatRatio } from "./desk-data.js";
import { downsampleMinMax } from "./downsample.js";
import { equityDrawdown } from "./equity-sparkline.js";
import { doubledAt, seedBaseline } from "./history-metrics.js";
import type { EquitySample } from "./history-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { type PulseStreakGroup, pulseStreaks } from "./pulse-streaks.js";
import { formatCurrency, formatSigned, formatTimestamp, plClass } from "./render-atoms.js";

/**
 * DESK PULSE AS DATA — `/api/desk/:id/pulse`, the JSON view behind the shell's
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

/**
 * One headline fact. The `key` is the contract a second reader selects on — the net-worth card's
 * standing line picks `winRate`, `profitFactor` and `maxDrawdown` out of this list so the Profile
 * page and the Pulse page can never disagree (#3964). Matching on `label` would have made display
 * copy load-bearing; the key is the stable name, the label is the words.
 */
type PulseTileKey = "equity" | "netRealized" | "winRate" | "profitFactor" | "maxDrawdown";

interface PulseTile {
  readonly key: PulseTileKey;
  readonly label: string;
  readonly value: string;
  readonly note: string;
  /**
   * False when the inputs for this fact do not exist yet — no closed trade, nothing lost, fewer
   * than two equity samples. The Pulse page prints the tile either way, because its `note` says
   * what is missing right beside the dash. A reader with less room (the net-worth card's standing
   * line) needs the flag to decide whether the fact is worth a slot at all, and must not have to
   * recognize "—" to find out. Same shape as `NetWorthStatsView`'s `valueKnown` / `cashKnown`.
   */
  readonly known: boolean;
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
  /** Both run families — day-over-day equity and closed round trips, kept separate. */
  readonly streaks: readonly PulseStreakGroup[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_CAP = 12;

/** "Aug 17" — through the shared formatter (`domain/intl-format.ts`). */
const dayLabel = (iso: string): string =>
  formatDateTime(new Date(iso), "en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** `drawdown` comes from the caller's own `equityDrawdown(samples)` — computed once per request,
 *  not once for the tiles and again in here (both a sort and a full scan over every sample;
 *  #4612 slice 7, defect #1's own follow-on). */
function pulseCurve(
  samples: readonly EquitySample[],
  drawdown: ReturnType<typeof equityDrawdown>,
): PulseCurve | null {
  if (samples.length < 2) return null;
  const ordered = [...samples].sort((a, b) => a.at.localeCompare(b.at));
  const first = ordered[0] as EquitySample;
  const last = ordered[ordered.length - 1] as EquitySample;
  const t0 = Date.parse(first.at);
  const span = Math.max(1, Date.parse(last.at) - t0);
  // Folded, never spread: one argument per stored sample threw RangeError past ~121k (#4615).
  const low = ordered.reduce((m, s) => Math.min(m, s.equity), Number.POSITIVE_INFINITY);
  const high = ordered.reduce((m, s) => Math.max(m, s.equity), Number.NEGATIVE_INFINITY);
  const rise = Math.max(1e-9, high - low);
  // Low/high/drawdown are measured over every sample above; only the plotted curve is bounded —
  // the chart body, not the stats, is what grows unboundedly with history (#4612 slice 7, #13).
  const plotted = downsampleMinMax(ordered, (s) => s.equity);
  return {
    points: plotted.map((s) => ({
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
      key: "equity",
      label: "Equity",
      value: formatCurrency(snapshot.equity),
      note: `cash ${formatCurrency(snapshot.cash)}`,
      known: true,
    },
    {
      key: "netRealized",
      label: "Net realized",
      value: formatSigned(stats.netRealized),
      note: stats.trades === 0 ? "needs a closed trade" : "booked, not on paper",
      known: stats.trades > 0,
      ...(stats.trades > 0 ? { tone: plClass(stats.netRealized) } : {}),
    },
    {
      key: "winRate",
      label: "Win rate",
      value: formatPctOrDash(stats.winRate),
      note: stats.trades === 0 ? "needs a closed trade" : `${stats.wins}W · ${stats.losses}L`,
      known: stats.winRate !== null,
    },
    {
      key: "profitFactor",
      label: "Profit factor",
      value: formatRatio(stats.profitFactor, "×"),
      note: stats.profitFactor === null ? "nothing lost yet" : "wins ÷ losses; above 1× is paying",
      known: stats.profitFactor !== null,
    },
    {
      key: "maxDrawdown",
      label: "Max drawdown",
      value: drawdown ? `${drawdown.ddPct.toFixed(2)}%` : "—",
      note: drawdown ? `from peak ${formatCurrency(drawdown.peak)}` : "needs two equity samples",
      known: drawdown !== null,
      ...(drawdown ? { tone: drawdown.ddPct > 0 ? ("neg" as const) : ("flat" as const) } : {}),
    },
  ];
  return {
    curve: pulseCurve(samples, drawdown),
    weeks: pulseWeeks(trips),
    tiles,
    race: pulseRace(samples, snapshot.equity),
    streaks: pulseStreaks(samples, stats),
  };
}
