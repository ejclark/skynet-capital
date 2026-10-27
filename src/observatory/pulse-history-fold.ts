import { MARKET_TIMEZONE, marketDayKeyer } from "../domain/market-day.js";
import { changesFromCloses, type DayChange, type DayClose } from "./day-trophies.js";
import { downsampleMinMax } from "./downsample.js";
import { ordered } from "./history-metrics.js";
import type { EquitySample } from "./history-record.js";

/**
 * EVERYTHING PULSE READS FROM A HISTORY, KEPT AS A RUNNING FOLD (#4612 slice 7, #4619).
 *
 * Pulse used to parse a participant's whole history file on every request — ~61k samples, 52–60 ms
 * at 180 days — and the one cache tried in its place (every sample kept as 48-byte columns) made it
 * fast but pushed peak RSS to 341 MB against a 300 MB budget (#4619, 2026-10-26). So this keeps the
 * *answers*, never the samples: the extremes, the running drawdown, the seed and the instant it
 * doubled, one close per market day, and the curve as a bounded time grid of min/max points. Each
 * sample is folded once, in time order, and dropped; a reader then folds only the lines appended
 * since its last read (`pulse-history-cache.ts`). Memory grows with recorded days, not samples.
 *
 * What a member reads does not move: every figure is the same forward scan `equityDrawdownOf`,
 * `doubledAtOf` and `dailyChangesOf` make over the sorted samples, and a history of up to
 * `RAW_POINTS` samples plots every one, exactly as `downsampleMinMax` did. The one change is the
 * curve of a longer history: its buckets split the *time* span evenly instead of the sample count,
 * because a bucket over sample indexes moves every time a sample lands and cannot be kept up to
 * date. Each bucket still keeps its lowest and highest sample, so no dip or spike is smoothed away
 * (tests/observatory/pulse-history-fold.spec.ts holds it to the old figures).
 */

/** At or under this many samples the curve plots every sample — `downsampleMinMax`'s budget. */
const RAW_POINTS = 640;
/** The curve's time buckets: two points each, so the plotted budget stays `RAW_POINTS`. */
const CURVE_BUCKETS = RAW_POINTS / 2;
/** Grid cells kept before neighbours merge — ≥ 1,024 cells across the span, 32 KiB a participant. */
const GRID_CELLS = 2048;
/** The grid's starting cell width; it doubles each time the span outgrows `GRID_CELLS` cells. */
const FIRST_CELL_MS = 60_000;

/** One plotted point before scaling: an instant and the equity then. */
interface CurvePoint {
  readonly at: number;
  readonly equity: number;
}

/** A sample as the curve sees it — its own ISO text kept, so a raw point plots its exact instant. */
interface RawPoint {
  readonly at: string;
  readonly equity: number;
}

export class PulseHistoryFold {
  /** Samples folded so far. */
  count = 0;
  /** The earliest sample — the seed baseline doubling is measured against. */
  first: EquitySample | null = null;
  last: EquitySample | null = null;
  low = Number.POSITIVE_INFINITY;
  high = Number.NEGATIVE_INFINITY;
  /** `equityDrawdownOf`'s running state, field for field. */
  peak = Number.NEGATIVE_INFINITY;
  ddPct = 0;
  ddAbs = 0;
  /** The first sample at or above 2× the seed, or null — `doubledAtOf`. */
  doubled: EquitySample | null = null;
  /** The second sample's instant: before it, a drawdown measures nothing. */
  private secondAt: string | null = null;
  /** Each time `ddPct` grew, the sample's instant and the new worst — so the drawdown as of any
   *  past instant is one binary search, which is the Wire's loss-headroom gauge (#4619). It grows
   *  only on a new worst dip, so it stays small next to the samples it replaces. */
  private readonly ddStepAt: string[] = [];
  private readonly ddStepPct: number[] = [];
  /** The last sample of each market day, oldest first — `dailyChangesOf`'s input. */
  private readonly closes: DayClose[] = [];
  private readonly dayOf: (iso: string) => string;
  /** Every sample while there are at most `RAW_POINTS`; dropped for good past that. */
  private raw: RawPoint[] | null = [];
  /** The time grid: per cell [minAt, minEquity, maxAt, maxEquity], NaN when empty. */
  private grid = new Float64Array(GRID_CELLS * 4).fill(Number.NaN);
  private cellMs = FIRST_CELL_MS;
  private t0 = Number.NaN;

  constructor(readonly timezone: string = MARKET_TIMEZONE) {
    this.dayOf = marketDayKeyer(timezone);
  }

  /** A fold of `samples` in any order — they are sorted first, as every Pulse figure always was. */
  static of(samples: readonly EquitySample[], timezone?: string): PulseHistoryFold {
    const fold = new PulseHistoryFold(timezone);
    for (const s of ordered(samples)) fold.add(s);
    return fold;
  }

  /** True when `s` can be folded next: nothing folded yet, or not earlier than the last sample. */
  accepts(s: EquitySample): boolean {
    return this.last === null || s.at >= this.last.at;
  }

  /** Fold one sample. The caller keeps time order (`accepts`); an earlier one means rebuild. */
  add(s: EquitySample): void {
    if (!this.first) {
      this.first = s;
      this.t0 = Date.parse(s.at);
    }
    this.last = s;
    this.count += 1;
    if (this.count === 2) this.secondAt = s.at;
    if (s.equity < this.low) this.low = s.equity;
    if (s.equity > this.high) this.high = s.equity;
    if (s.equity > this.peak) this.peak = s.equity;
    const dipAbs = this.peak - s.equity;
    const dipPct = this.peak > 0 ? (dipAbs / this.peak) * 100 : 0;
    if (dipAbs > this.ddAbs) this.ddAbs = dipAbs;
    if (dipPct > this.ddPct) {
      this.ddPct = dipPct;
      this.ddStepAt.push(s.at);
      this.ddStepPct.push(dipPct);
    }
    const seed = this.first.equity;
    if (!this.doubled && seed > 0 && s.equity >= seed * 2) this.doubled = s;
    const day = this.dayOf(s.at);
    const close = this.closes[this.closes.length - 1];
    const today = { day, at: s.at, equity: s.equity };
    if (close?.day === day) this.closes[this.closes.length - 1] = today;
    else this.closes.push(today);
    if (this.raw) {
      if (this.raw.length < RAW_POINTS) this.raw.push({ at: s.at, equity: s.equity });
      else this.raw = null;
    }
    this.plot(Date.parse(s.at), s.equity);
  }

  /** `equityDrawdownOf` over everything folded: null under two samples. */
  drawdown(): { peak: number; ddPct: number; ddAbs: number } | null {
    return this.count < 2 ? null : { peak: this.peak, ddPct: this.ddPct, ddAbs: this.ddAbs };
  }

  /**
   * The worst peak-to-trough dip, in percent, across every sample at or before `atIso`, or null
   * under two such samples — `lossHeadroomGauges`' figure without its sorted copy of the samples.
   * The cut compares code units, as that one does, so a sample is in or out the same way in both.
   */
  drawdownPctAt(atIso: string): number | null {
    if (this.secondAt === null || this.secondAt > atIso) return null;
    // How many steps sit at or before `atIso` — the first index whose instant is past it.
    let lo = 0;
    let hi = this.ddStepAt.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if ((this.ddStepAt[mid] as string) <= atIso) lo = mid + 1;
      else hi = mid;
    }
    return lo === 0 ? 0 : (this.ddStepPct[lo - 1] as number);
  }

  /** `dailyChangesOf` over everything folded. */
  dailyChanges(): DayChange[] {
    return this.first ? changesFromCloses(this.first.participantId, this.closes) : [];
  }

  /**
   * The curve's points in time order, at most `RAW_POINTS`: every sample while that many fit
   * (exactly `downsampleMinMax`'s output), else each of `CURVE_BUCKETS` even slices of the time
   * span keeps its lowest and highest grid point.
   */
  curve(): { at: string; equity: number }[] {
    if (this.raw) return downsampleMinMax(this.raw, (p) => p.equity, RAW_POINTS);
    const span = Math.max(1, Date.parse(this.last?.at ?? "") - this.t0);
    const lows: (CurvePoint | undefined)[] = new Array(CURVE_BUCKETS);
    const highs: (CurvePoint | undefined)[] = new Array(CURVE_BUCKETS);
    const slice = (at: number): number =>
      Math.min(CURVE_BUCKETS - 1, Math.floor(((at - this.t0) / span) * CURVE_BUCKETS));
    for (let c = 0; c < GRID_CELLS; c++) {
      const o = c * 4;
      if (Number.isNaN(this.grid[o] as number)) continue;
      const low = { at: this.grid[o] as number, equity: this.grid[o + 1] as number };
      const high = { at: this.grid[o + 2] as number, equity: this.grid[o + 3] as number };
      const lo = slice(low.at);
      const hi = slice(high.at);
      const seenLow = lows[lo];
      const seenHigh = highs[hi];
      if (!seenLow || low.equity < seenLow.equity) lows[lo] = low;
      if (!seenHigh || high.equity > seenHigh.equity) highs[hi] = high;
    }
    const out: { at: string; equity: number }[] = [];
    for (let b = 0; b < CURVE_BUCKETS; b++) {
      const pair = [lows[b], highs[b]].filter((p): p is CurvePoint => p !== undefined);
      pair.sort((a, z) => a.at - z.at);
      for (const p of pair) {
        if (out.length && out[out.length - 1]?.at === new Date(p.at).toISOString()) continue;
        out.push({ at: new Date(p.at).toISOString(), equity: p.equity });
      }
    }
    return out;
  }

  /** Put one point in its grid cell, halving the grid's resolution until the span fits. */
  private plot(at: number, equity: number): void {
    let cell = Math.floor((at - this.t0) / this.cellMs);
    while (cell >= GRID_CELLS) {
      this.coarsen();
      cell = Math.floor((at - this.t0) / this.cellMs);
    }
    const o = cell * 4;
    const g = this.grid;
    if (Number.isNaN(g[o] as number) || equity < (g[o + 1] as number)) {
      g[o] = at;
      g[o + 1] = equity;
    }
    if (Number.isNaN(g[o + 2] as number) || equity > (g[o + 3] as number)) {
      g[o + 2] = at;
      g[o + 3] = equity;
    }
  }

  /** Merge neighbouring cells pairwise. The earlier point wins a tie, as a forward scan's would. */
  private coarsen(): void {
    const next = new Float64Array(GRID_CELLS * 4).fill(Number.NaN);
    const g = this.grid;
    for (let c = 0; c < GRID_CELLS; c++) {
      const o = c * 4;
      if (Number.isNaN(g[o] as number)) continue;
      const n = (c >> 1) * 4;
      if (Number.isNaN(next[n] as number) || (g[o + 1] as number) < (next[n + 1] as number)) {
        next[n] = g[o] as number;
        next[n + 1] = g[o + 1] as number;
      }
      if (Number.isNaN(next[n + 2] as number) || (g[o + 3] as number) > (next[n + 3] as number)) {
        next[n + 2] = g[o + 2] as number;
        next[n + 3] = g[o + 3] as number;
      }
    }
    this.grid = next;
    this.cellMs *= 2;
  }
}
