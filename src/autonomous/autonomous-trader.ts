import type { MarketContext, OrderResult } from "../domain/types.js";
import { DEFAULT_RISK_CONFIG, type RiskConfig, applyGuards } from "../engine/guards.js";
import type { Persona } from "../personas/persona.js";
import type { BrokerPort } from "../ports/broker.js";

export interface AutonomousTraderConfig {
  readonly persona: Persona;
  readonly broker: BrokerPort;
  readonly risk?: RiskConfig;
  /** Minimum gap between orders in the same symbol (ms). Guards against re-submitting
   *  while a fill is still in flight — a live account shows the position only after it fills. */
  readonly cooldownMs?: number;
  /** Injectable clock (ms) for deterministic cooldown tests. */
  readonly now?: () => number;
  /** Called for every submitted order's result (for logging). */
  readonly onResult?: (result: OrderResult) => void;
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Runs one persona autonomously against a live broker: on each `evaluate(context)` it asks
 * the persona to assess the market, risk-guards the intents, drops any symbol still inside
 * its order cooldown, and submits the rest. The cooldown is the key safety valve for live
 * trading — without it, a persona that stays bullish would re-fire the same buy on every
 * tick before the first fill lands.
 */
export class AutonomousTrader {
  private readonly config: AutonomousTraderConfig;
  private readonly lastOrderAt = new Map<string, number>();

  constructor(config: AutonomousTraderConfig) {
    this.config = config;
  }

  async evaluate(context: MarketContext): Promise<OrderResult[]> {
    const risk = this.config.risk ?? DEFAULT_RISK_CONFIG;
    const now = (this.config.now ?? Date.now)();
    const cooldown = this.config.cooldownMs ?? DEFAULT_COOLDOWN_MS;

    const portfolio = await this.config.broker.getPortfolio();
    const intents = applyGuards(
      this.config.persona.decide(context, portfolio),
      portfolio,
      context,
      risk,
    );

    const results: OrderResult[] = [];
    for (const intent of intents) {
      const last = this.lastOrderAt.get(intent.symbol);
      if (last !== undefined && now - last < cooldown) {
        continue;
      }
      const result = await this.config.broker.submit(intent);
      this.lastOrderAt.set(intent.symbol, now);
      this.config.onResult?.(result);
      results.push(result);
    }
    return results;
  }
}
