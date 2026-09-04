import type { MarketContext, OrderResult } from "../domain/types.js";
import { applyGuards, DEFAULT_RISK_CONFIG, type RiskConfig } from "../engine/guards.js";
import type { Persona } from "../personas/persona.js";
import type { BrokerPort } from "../ports/broker.js";
import type { DecisionRecord, IntentOutcome } from "./decision-record.js";

/** How the trader acts on its decisions. `observe` decides + logs but places NO orders. */
export type TraderMode = "observe" | "live";

export interface AutonomousTraderConfig {
  readonly persona: Persona;
  readonly broker: BrokerPort;
  readonly risk?: RiskConfig;
  /** Minimum gap between orders in the same symbol (ms). Guards against re-submitting
   *  while a fill is still in flight — a live account shows the position only after it fills. */
  readonly cooldownMs?: number;
  /** Injectable clock (ms) for deterministic cooldown tests. */
  readonly now?: () => number;
  /**
   * `observe` (dry run) computes the full decision and records it but submits nothing — the safe
   * default for a persona that hasn't earned live trading yet. `live` submits guarded orders.
   * Defaults to `live` to preserve existing callers; deployment defaults to observe (see the runner).
   */
  readonly mode?: TraderMode;
  /** Called for every submitted order's result (for logging). */
  readonly onResult?: (result: OrderResult) => void;
  /** Called once per cycle with the full decision record (raw intents, guards, per-intent outcome). */
  readonly onDecision?: (record: DecisionRecord) => void;
  /**
   * The kill switch / circuit breakers. Consulted at the top of every cycle — a non-null reason
   * halts the cycle before the persona is even asked, and nothing is placed. See `SafetyController`.
   */
  readonly blockedReason?: () => string | null;
  /** Seeds the cooldown clock at construction (e.g. restored after a process restart) — read
   *  once, never mutated by this class after that. */
  readonly initialCooldowns?: ReadonlyMap<string, number>;
  /** Fires every time a cooldown clock is set (i.e. right after an order places), so a caller can
   *  persist it durably without this class knowing anything about storage. */
  readonly onCooldownSet?: (symbol: string, at: number) => void;
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Runs one persona autonomously against a broker: on each `evaluate(context)` it asks the persona
 * to assess the market, risk-guards the intents, drops any symbol still inside its order cooldown,
 * and — in `live` mode — submits the rest. In `observe` mode it does everything EXCEPT submit, so a
 * bot's judgment can be watched with zero risk before it's trusted with real (paper) orders.
 *
 * Every cycle emits a `DecisionRecord` (via `onDecision`) capturing the raw intents, the guarded
 * intents, and what happened to each — the durable audit trail Phase 0 of the autonomy plan is built
 * on. The cooldown is the key safety valve for live trading — without it, a persona that stays
 * bullish would re-fire the same buy on every tick before the first fill lands.
 */
export class AutonomousTrader {
  private readonly config: AutonomousTraderConfig;
  private readonly lastOrderAt = new Map<string, number>();

  constructor(config: AutonomousTraderConfig) {
    this.config = config;
    if (config.initialCooldowns) {
      for (const [symbol, at] of config.initialCooldowns) {
        this.lastOrderAt.set(symbol, at);
      }
    }
  }

  async evaluate(context: MarketContext): Promise<OrderResult[]> {
    const risk = this.config.risk ?? DEFAULT_RISK_CONFIG;
    const now = (this.config.now ?? Date.now)();
    const cooldown = this.config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const mode: TraderMode = this.config.mode ?? "live";

    // Kill switch / circuit breakers first: if halted, decide nothing and place nothing this cycle.
    const blocked = this.config.blockedReason?.() ?? null;
    if (blocked) {
      this.config.onDecision?.({
        at: now,
        personaId: this.config.persona.id,
        mode,
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
        halted: blocked,
      });
      return [];
    }

    const portfolio = await this.config.broker.getPortfolio();
    const rawIntents = this.config.persona.decide(context, portfolio);
    const guardedIntents = applyGuards(rawIntents, portfolio, context, risk);

    const results: OrderResult[] = [];
    const outcomes: IntentOutcome[] = [];
    for (const intent of guardedIntents) {
      const last = this.lastOrderAt.get(intent.symbol);
      if (last !== undefined && now - last < cooldown) {
        outcomes.push({ intent, action: "cooldown-skipped" });
        continue;
      }
      if (mode === "observe") {
        // Dry run: record what WOULD have been placed, but touch neither the broker nor the cooldown.
        outcomes.push({ intent, action: "observed" });
        continue;
      }
      const result = await this.config.broker.submit(intent);
      this.lastOrderAt.set(intent.symbol, now);
      this.config.onCooldownSet?.(intent.symbol, now);
      this.config.onResult?.(result);
      results.push(result);
      outcomes.push({ intent, action: result.status === "filled" ? "placed" : "rejected", result });
    }

    this.config.onDecision?.({
      at: now,
      personaId: this.config.persona.id,
      mode,
      rawIntents,
      guardedIntents,
      outcomes,
    });
    return results;
  }
}
