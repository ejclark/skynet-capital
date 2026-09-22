/**
 * The DOCTRINE EFFECTIVENESS BREAKER (issue #2287, PR 8) — copied verbatim from
 * `SafetyController`'s shape (`src/autonomous/safety.ts`), because "self-healing means the
 * system's own metrics gate the system, not a human watching a dashboard" (docs/plans/
 * trade-insights-loop.md, slice 3 — pre-argued and sanctioned there, unbuilt until now).
 *
 * What it watches: a rolling window of outcomes from doctrine-driven actions (an insight-triggered
 * nudge, or any future action `doctrine-scan.mjs`'s loop hands a live decision to) against a
 * baseline win rate. Underperformance past a margin trips it; it never silently re-arms.
 *
 * SHIPPED DARK, same pattern as PR 3's SQLite store (built and tested fully offline before the
 * volume existed): nothing in the trading path calls `recordOutcome()` yet. Wiring an actual
 * insight-triggered nudge system into it is `trade-insights-loop.md`'s own slice 3 scope — a
 * promotion-ladder-gated feature this PR does not build. What PR 8 delivers is the breaker itself,
 * pure and tested, ready for that wiring: "no insight skips a rung," and this rung was empty.
 */
export type EffectivenessHaltReason = "underperformance";

export interface EffectivenessBreakerConfig {
  /** Outcomes considered per rolling window (e.g. 20 insight-triggered trades). */
  readonly windowSize?: number;
  /** The win rate a doctrine-driven action is expected to clear (e.g. beta-scout's own baseline). */
  readonly baselineWinRate?: number;
  /** How far below baseline, in percentage points, trips the breaker (e.g. 0.15 = 15pp). */
  readonly maxUnderperformancePct?: number;
  /** Never judge a window smaller than this — an n=3 losing streak is noise, not a verdict. */
  readonly minSampleSize?: number;
}

const DEFAULTS: Required<EffectivenessBreakerConfig> = {
  windowSize: 20,
  baselineWinRate: 0.5,
  maxUnderperformancePct: 0.15,
  minSampleSize: 10,
};

export class DoctrineEffectivenessBreaker {
  private readonly cfg: Required<EffectivenessBreakerConfig>;
  private tripped: EffectivenessHaltReason | null = null;
  private readonly outcomes: boolean[] = [];

  constructor(config: EffectivenessBreakerConfig = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  /** The single question a caller asks before acting on doctrine. Non-null = do not act. */
  blockedReason(): EffectivenessHaltReason | null {
    return this.tripped;
  }

  /** Throw the breaker. Idempotent; first reason wins — never overwritten by a later trip. */
  halt(reason: EffectivenessHaltReason = "underperformance"): void {
    if (!this.tripped) this.tripped = reason;
  }

  /** Clear the halt and re-arm — an explicit human action. Never called from inside this class. */
  reset(): void {
    this.tripped = null;
    this.outcomes.length = 0;
  }

  /** The current window's win rate, or `null` below `minSampleSize` — not yet a verdict. */
  currentWinRate(): number | null {
    if (this.outcomes.length < this.cfg.minSampleSize) return null;
    const wins = this.outcomes.filter(Boolean).length;
    return wins / this.outcomes.length;
  }

  /**
   * Feed one doctrine-driven action's outcome (won/lost). ORDER IS LOAD-BEARING, same guarantee as
   * `SafetyController.recordEquity()`: the halt decision is banked here, synchronously, before this
   * method returns — a caller that reads `blockedReason()` right after `recordOutcome()` always
   * sees the up-to-date verdict, never a stale one racing a foreign callback.
   */
  recordOutcome(won: boolean): void {
    this.outcomes.push(won);
    while (this.outcomes.length > this.cfg.windowSize) this.outcomes.shift();
    const rate = this.currentWinRate();
    if (rate === null) return;
    if (this.cfg.baselineWinRate - rate >= this.cfg.maxUnderperformancePct)
      this.halt("underperformance");
  }
}
