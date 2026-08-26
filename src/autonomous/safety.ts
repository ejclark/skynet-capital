import type { Alert } from "../alerts/alert.js";
import type { MarketContext } from "../domain/types.js";
import {
  DEFAULT_RISK_LADDER,
  forceFlattenRequired,
  type RiskActor,
  type RiskLadder,
  type RiskReading,
  type RiskTier,
  readRiskLadder,
} from "../risk/risk-ladder.js";
import { riskLadderAlert } from "../risk/risk-ladder-alert.js";

/**
 * The autonomy SAFETY CONTROLLER (Phase 0.3 of `docs/AUTONOMY-PLAN.md`) — the kill switch and the
 * circuit breakers that make live trading acceptable. It is a pure state machine: the runner feeds it
 * signals (equity, submitted orders, errors, the halt flag) and the trader asks it one question before
 * every cycle — `blockedReason()`. Once tripped it stays halted until explicitly `reset()`; a breaker
 * never silently re-arms.
 *
 * It also carries the GRADUATED RISK LADDER (`src/risk/risk-ladder.ts`), read off the same equity feed
 * the daily-loss breaker already consumes. The breaker is the binary half — halted or not — and the
 * ladder is the graduated half: a soft WARN above the halt, and a force-FLATTEN rung below it, because
 * halting stops *ordering* while open positions keep marking against you. Both are fed from one number
 * on purpose, rather than standing up a second risk system that could disagree with the first, and
 * `blockedReason()` behaves exactly as it always has — the ladder is additive.
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

/** The breakers, plus the graduated ladder read off the same equity feed. */
export interface SafetyConfig extends BreakerConfig {
  /** Rung thresholds. Defaults to `DEFAULT_RISK_LADDER` — conservative starting dials. */
  readonly ladder?: RiskLadder;
  /**
   * Whose book this is. Defaults to `member`, the SAFE value: a member is never force-flattened
   * automatically. Only an explicit `bot` unlocks `flattenRequired()`, so the permissive answer
   * has to be asked for by name rather than inherited from a default.
   */
  readonly actor?: RiskActor;
  /**
   * Where the ladder's warning goes. Called once per tier CHANGE — never per equity tick, which
   * would be spam — with an alert ready for the bus. Absent = the ladder is still read and still
   * enforced, it just says nothing out loud.
   */
  readonly onRiskAlert?: (alert: Alert) => void;
}

const DEFAULT_BREAKERS: Required<BreakerConfig> = {
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
  private readonly ladder: RiskLadder;
  private readonly actor: RiskActor;
  private readonly onRiskAlert: ((alert: Alert) => void) | undefined;
  private reading: RiskReading | null = null;
  private lastTier: RiskTier | null = null;

  constructor(config: SafetyConfig = {}, now: () => number = Date.now) {
    const { ladder, actor, onRiskAlert, ...breakers } = config;
    this.cfg = { ...DEFAULT_BREAKERS, ...breakers };
    this.ladder = ladder ?? DEFAULT_RISK_LADDER;
    this.actor = actor ?? "member";
    this.onRiskAlert = onRiskAlert;
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
    this.reading = null;
    this.lastTier = null;
  }

  /**
   * Feed the current account equity. The first value sets the day's baseline; later drops can trip.
   *
   * ORDER IS LOAD-BEARING: every breaker decision is banked BEFORE `announce()` hands control to a
   * foreign callback. A listener that throws propagates out of this call, so if it ran first it
   * could skip the `daily-loss` halt entirely — an unrelated broken consumer silently disabling a
   * money-moving safety control. `AlertBus` makes the same guarantee from the other side.
   */
  recordEquity(equity: number): void {
    if (!Number.isFinite(equity)) return;
    const baseline = this.baselineEquity;
    if (baseline === null) {
      this.baselineEquity = equity;
      this.reading = readRiskLadder(equity, equity, this.ladder); // flat by definition
      this.announce();
      return;
    }
    this.reading = readRiskLadder(baseline, equity, this.ladder);
    const drop = (baseline - equity) / baseline;
    if (drop >= this.cfg.maxDailyLossPct) this.halt("daily-loss");
    this.announce();
  }

  /**
   * The account's current rung — `null` when no baseline has been fed yet. That absence is ABSENT,
   * not `clear`: a caller must render "unknown", and `RiskConfig.accountTier` must be left off
   * rather than defaulted, because an unmeasured account reported as safe is the dangerous
   * direction of wrong.
   */
  riskReading(): RiskReading | null {
    return this.reading;
  }

  /**
   * Should this book be force-flattened right now? True only at the bottom rung AND only for a
   * `bot`. A member at the same rung gets the block and the critical alert and nothing else — their
   * positions are theirs to close. The caller builds the orders with `planForceFlatten()`.
   */
  flattenRequired(): boolean {
    return this.reading !== null && forceFlattenRequired(this.reading.tier, this.actor);
  }

  /**
   * Announce a rung CHANGE — only a change, because a held rung is not news and a per-tick emission
   * is spam. An ABSENT reading is not a transition either: `lastTier` is left alone so a recovered
   * feed announces only if the rung actually moved while it was dark.
   */
  private announce(): void {
    const reading = this.reading;
    if (!reading) return;
    const previous = this.lastTier;
    this.lastTier = reading.tier;
    const changed = previous === null ? reading.tier !== "clear" : reading.tier !== previous;
    if (changed) this.onRiskAlert?.(riskLadderAlert(reading, this.now()));
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
