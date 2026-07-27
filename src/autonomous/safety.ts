import type { MarketContext } from "../domain/types.js";

/**
 * The autonomy SAFETY CONTROLLER (Phase 0.3 of `docs/AUTONOMY-PLAN.md`) — the kill switch and the
 * circuit breakers that make live trading acceptable. It is a pure state machine: the runner feeds it
 * signals (equity, submitted orders, errors, the halt flag) and the trader asks it one question before
 * every cycle — `blockedReason()`. Once tripped it stays halted until explicitly `reset()`; a breaker
 * never silently re-arms.
 */
export type HaltReason =
  | "manual" // the kill switch was thrown
  | "daily-loss" // equity fell past the daily loss cap
  | "order-rate" // too many orders in the window
  | "errors" // too many consecutive failures
  | "data-gap"; // quotes went missing / non-finite

export interface BreakerConfig {
  /** Halt if equity drops more than this fraction below the day's starting equity (e.g. 0.05 = 5%). */
  readonly maxDailyLossPct?: number;
  /** Halt if more than this many orders are submitted within `orderWindowMs`. */
  readonly maxOrdersPerWindow?: number;
  readonly orderWindowMs?: number;
  /** Halt after this many consecutive cycle errors. */
  readonly maxConsecutiveErrors?: number;
}

export const DEFAULT_BREAKERS: Required<BreakerConfig> = {
  maxDailyLossPct: 0.05,
  maxOrdersPerWindow: 20,
  orderWindowMs: 60_000,
  maxConsecutiveErrors: 5,
};

export class SafetyController {
  private readonly cfg: Required<BreakerConfig>;
  private readonly now: () => number;
  private tripped: HaltReason | null = null;
  private baselineEquity: number | null = null;
  private consecutiveErrors = 0;
  private readonly orderTimes: number[] = [];

  constructor(config: BreakerConfig = {}, now: () => number = Date.now) {
    this.cfg = { ...DEFAULT_BREAKERS, ...config };
    this.now = now;
  }

  /** The single question the trader asks before every cycle. Non-null = do not trade. */
  blockedReason(): HaltReason | null {
    return this.tripped;
  }

  /** Throw the kill switch (or trip a specific breaker). Idempotent; first reason wins. */
  halt(reason: HaltReason = "manual"): void {
    if (!this.tripped) this.tripped = reason;
  }

  /** Clear the halt and re-arm every breaker — an explicit human action. */
  reset(): void {
    this.tripped = null;
    this.consecutiveErrors = 0;
    this.orderTimes.length = 0;
    this.baselineEquity = null;
  }

  /** Feed the current account equity. The first value sets the day's baseline; later drops can trip. */
  recordEquity(equity: number): void {
    if (!Number.isFinite(equity)) return;
    if (this.baselineEquity === null) {
      this.baselineEquity = equity;
      return;
    }
    const drop = (this.baselineEquity - equity) / this.baselineEquity;
    if (drop >= this.cfg.maxDailyLossPct) this.halt("daily-loss");
  }

  /** Feed each submitted order — trips the rate breaker if too many land inside the window. */
  recordOrder(): void {
    const t = this.now();
    this.orderTimes.push(t);
    const cutoff = t - this.cfg.orderWindowMs;
    while (this.orderTimes.length > 0 && (this.orderTimes[0] as number) < cutoff) {
      this.orderTimes.shift();
    }
    if (this.orderTimes.length > this.cfg.maxOrdersPerWindow) this.halt("order-rate");
  }

  /** A cycle failed. Consecutive failures past the cap trip the error breaker. */
  recordError(): void {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors >= this.cfg.maxConsecutiveErrors) this.halt("errors");
  }

  /** A cycle succeeded — resets the consecutive-error count. */
  recordSuccess(): void {
    this.consecutiveErrors = 0;
  }

  /**
   * Trip the data-gap breaker if the context is unusable — no quotes, or every quote is missing /
   * non-finite / non-positive. A blind bot must not trade.
   */
  checkContext(context: MarketContext): void {
    const symbols = Object.keys(context.quotes);
    if (symbols.length === 0) {
      this.halt("data-gap");
      return;
    }
    const anyUsable = symbols.some((s) => {
      const q = context.quotes[s];
      return q !== undefined && Number.isFinite(q.last) && q.last > 0;
    });
    if (!anyUsable) this.halt("data-gap");
  }
}
