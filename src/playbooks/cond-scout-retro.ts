/**
 * COND-SCOUT's retrospective (#3651 slice 4) — written the moment a shadow probe closes, from the
 * close and the hourly snapshots taken while it was open. Pure: the runner hands it both.
 *
 * THE EARLIER-EXIT SWEEP is Eric's question (2026-09-24): "If we would've closed the position
 * sooner in the process, could we have returned higher ROI (we also free up capital to place a
 * second bet in that scenario)." Everything inside the hold is already history when the probe
 * closes, so it is answered here, immediately — each checkpoint priced off that snapshot's BID,
 * the same fill rule a real exit uses. The later-exit sweep (checkpoints beyond the close) needs
 * wall-clock time to pass and is slice 5's.
 *
 * CAPITAL-TIME, NOT RAW ROI. A smaller win taken sooner frees the money for another bet, so every
 * checkpoint carries ROI per day beside raw ROI. The best-pace checkpoint only considers exits
 * held at least a day: an hour-old mark annualizes into noise, and a 5-to-14-day thesis isn't
 * answered by its first hour.
 */
import type { ConditionReading } from "./cond-scout.js";
import type { ShadowClose, ShadowSnapshot } from "./cond-scout-ledger.js";

const DAY_MS = 86_400_000;
const dayOf = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** A hypothetical exit at one moment inside the hold. */
export interface ExitCheckpoint {
  /** Fraction of the actual hold this checkpoint sits at (0.25, 0.5, 0.75), or the best-pace one. */
  readonly label: "25%" | "50%" | "75%" | "best pace";
  readonly at: number;
  readonly daysHeld: number;
  readonly roi: number;
  readonly roiPerDay: number;
}

export interface ProbeRetro {
  readonly probeId: string;
  readonly symbol: string;
  readonly hypothesis: ShadowClose["probe"]["hypothesis"];
  readonly condition: ShadowClose["probe"]["condition"];
  readonly reason: ShadowClose["reason"];
  readonly openedAt: number;
  readonly closedAt: number;
  readonly daysHeld: number;
  readonly roi: number;
  readonly roiPerDay: number;
  /** Did the price move the way the thesis said? Judged at the exit bid vs the entry ask. */
  readonly directionRight: boolean;
  /** Best and worst mark while open (at the bid), including the exit — the path, not just ends. */
  readonly bestMarkRoi: number;
  readonly worstMarkRoi: number;
  /** RSI / sentiment at the first and last snapshot, when both were readable. */
  readonly rsiDelta?: number;
  readonly sentimentDelta?: number;
  readonly snapshotCount: number;
  /** Earlier hypothetical exits, priced from the snapshots. Empty when no snapshot fell inside. */
  readonly earlierExits: readonly ExitCheckpoint[];
  /** True when some earlier exit (held ≥ 1 day) beat the actual exit's ROI per day. */
  readonly soonerWasBetter: boolean;
  /** Entry fill, kept so the later-exit backfill can price a checkpoint without the probe row. */
  readonly entryPrice: number;
  /** Hypothetical exits BEYOND the close (slice 5) — pending until their date has passed. */
  readonly laterExits: readonly LaterExit[];
  /**
   * The market over the same days (slice 6), filled once the close day's bar exists. For a long
   * probe, "buy and hold the same name over the same window" IS the probe, so the honest benchmark
   * for the entry signal is being in the market instead: did the bet beat SPY while it was open?
   */
  readonly market?: MarketBenchmark;
}

export interface MarketBenchmark {
  readonly symbol: string;
  /** Close-to-close over the probe's sessions (open day's close → close day's close). */
  readonly roi: number;
  /** probe ROI − market ROI. */
  readonly excess: number;
}

export const BENCHMARK_SYMBOL = "SPY";

/**
 * Price the benchmark from daily bars: the open day's session close to the close day's. A probe
 * opened and closed the same session reads 0 for the market — an approximation stated here, not
 * hidden: daily bars can't split a session. Undefined until both sessions' bars exist.
 */
export function marketBenchmark(
  retro: ProbeRetro,
  bars: readonly { readonly t: string; readonly c: number }[],
  symbol = BENCHMARK_SYMBOL,
): MarketBenchmark | undefined {
  const openDay = dayOf(retro.openedAt);
  const closeDay = dayOf(retro.closedAt);
  const start = bars.find((b) => b.t.slice(0, 10) >= openDay);
  const end = [...bars].reverse().find((b) => b.t.slice(0, 10) <= closeDay);
  if (!(start && end && start.c > 0) || end.t.slice(0, 10) < closeDay) return undefined;
  const roi = end.c / start.c - 1;
  return { symbol, roi, excess: retro.roi - roi };
}

/**
 * A hypothetical exit after the actual close, at a horizon scaled to the hold (Eric, 2026-09-24:
 * "A position held for 2 days has too short of a life span… carrying the thought to a week, a few
 * weeks, a month… A position held for a month, playing out hypotheticals for 2 months, 6 months,
 * 10 months"). Never estimated ahead of time: `roi` stays absent until that date's bar exists.
 */
export interface LaterExit {
  readonly label: string;
  /** Hold length from the OPEN this checkpoint prices, in days. */
  readonly horizonDays: number;
  readonly dueAt: number;
  readonly roi?: number;
  readonly roiPerDay?: number;
  /** Daily bars carry no bid/ask: priced at that session's close, no spread charged — an
   *  estimate, stated as one, unlike the actual and earlier exits which pay the spread. */
  readonly priceBasis?: "daily close";
  readonly filledAt?: number;
}

/**
 * The checkpoint ladder, in days from the open. Holds under a week get week-scale horizons, holds
 * up to ~6 weeks month-scale ones (the two ladders Eric named); anything longer scales with
 * itself at 2×/6×/10×.
 */
export function laterExitLadder(daysHeld: number): readonly number[] {
  if (daysHeld < 7) return [7, 21, 30];
  if (daysHeld < 45) return [60, 180, 300];
  return [2, 6, 10].map((m) => Math.round(daysHeld * m));
}

function ladderLabel(days: number): string {
  if (days < 30)
    return days % 7 === 0 ? `${days / 7} week${days === 7 ? "" : "s"}` : `${days} days`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

/**
 * Fill every checkpoint whose date has passed from daily bars (oldest first, `t` an ISO date or
 * timestamp). A checkpoint takes the first session on or after its due date — a weekend or holiday
 * due date rolls to the next open. Returns the same object when nothing changed.
 */
export function fillLaterExits(
  retro: ProbeRetro,
  bars: readonly { readonly t: string; readonly c: number }[],
  now: number,
): ProbeRetro {
  let changed = false;
  const laterExits = retro.laterExits.map((exit) => {
    if (exit.roi !== undefined || exit.dueAt > now) return exit;
    const bar = bars.find((b) => b.t.slice(0, 10) >= dayOf(exit.dueAt));
    if (!(bar && bar.c > 0)) return exit;
    changed = true;
    const roi = (bar.c - retro.entryPrice) / retro.entryPrice;
    return {
      ...exit,
      roi,
      roiPerDay: roi / exit.horizonDays,
      priceBasis: "daily close" as const,
      filledAt: now,
    };
  });
  return changed ? { ...retro, laterExits } : retro;
}

/** The earliest due date still waiting on a price, or undefined when every checkpoint is filled. */
export function nextLaterExitDue(retro: ProbeRetro): number | undefined {
  const pending = retro.laterExits.filter((e) => e.roi === undefined).map((e) => e.dueAt);
  return pending.length > 0 ? Math.min(...pending) : undefined;
}

function checkpoint(
  label: ExitCheckpoint["label"],
  snapshot: ShadowSnapshot,
  openedAt: number,
): ExitCheckpoint {
  const daysHeld = (snapshot.at - openedAt) / DAY_MS;
  return {
    label,
    at: snapshot.at,
    daysHeld,
    roi: snapshot.markRoi,
    roiPerDay: snapshot.markRoi / Math.max(daysHeld, 1 / 24),
  };
}

/** The last snapshot at or before `at` — the price the probe could actually have exited at then. */
function latestBy(snapshots: readonly ShadowSnapshot[], at: number): ShadowSnapshot | undefined {
  let found: ShadowSnapshot | undefined;
  for (const s of snapshots) if (s.at <= at) found = s;
  return found;
}

function readingDelta(
  first: ConditionReading | undefined,
  last: ConditionReading | undefined,
  key: "rsi" | "sentiment",
): number | undefined {
  const a = first?.[key];
  const b = last?.[key];
  return a !== undefined && b !== undefined ? b - a : undefined;
}

export function probeRetro(close: ShadowClose, snapshots: readonly ShadowSnapshot[]): ProbeRetro {
  const { probe } = close;
  const inside = snapshots
    .filter((s) => s.probeId === probe.id && s.at > probe.openedAt && s.at < close.closedAt)
    .sort((a, b) => a.at - b.at);
  const all = snapshots.filter((s) => s.probeId === probe.id).sort((a, b) => a.at - b.at);

  const hold = close.closedAt - probe.openedAt;
  const earlierExits: ExitCheckpoint[] = [];
  const seen = new Set<number>();
  for (const [label, fraction] of [
    ["25%", 0.25],
    ["50%", 0.5],
    ["75%", 0.75],
  ] as const) {
    const snapshot = latestBy(inside, probe.openedAt + hold * fraction);
    if (!snapshot || seen.has(snapshot.at)) continue;
    seen.add(snapshot.at);
    earlierExits.push(checkpoint(label, snapshot, probe.openedAt));
  }
  const paced = inside
    .map((s) => checkpoint("best pace", s, probe.openedAt))
    .filter((c) => c.daysHeld >= 1)
    .sort((a, b) => b.roiPerDay - a.roiPerDay)[0];
  if (paced) earlierExits.push(paced);

  const marks = [...all.map((s) => s.markRoi), close.roi];
  const rsiDelta = readingDelta(all[0]?.reading, all.at(-1)?.reading, "rsi");
  const sentimentDelta = readingDelta(all[0]?.reading, all.at(-1)?.reading, "sentiment");
  return {
    probeId: probe.id,
    symbol: probe.symbol,
    hypothesis: probe.hypothesis,
    condition: probe.condition,
    reason: close.reason,
    openedAt: probe.openedAt,
    closedAt: close.closedAt,
    daysHeld: close.daysHeld,
    roi: close.roi,
    roiPerDay: close.roiPerDay,
    directionRight:
      probe.forecast.direction === "up"
        ? close.exitPrice > probe.entryPrice
        : close.exitPrice < probe.entryPrice,
    bestMarkRoi: Math.max(...marks),
    worstMarkRoi: Math.min(...marks),
    ...(rsiDelta !== undefined ? { rsiDelta } : {}),
    ...(sentimentDelta !== undefined ? { sentimentDelta } : {}),
    snapshotCount: all.length,
    earlierExits,
    soonerWasBetter: paced !== undefined && paced.roiPerDay > close.roiPerDay,
    entryPrice: probe.entryPrice,
    laterExits: laterExitLadder(close.daysHeld).map((days) => ({
      label: ladderLabel(days),
      horizonDays: days,
      dueAt: probe.openedAt + days * DAY_MS,
    })),
  };
}
