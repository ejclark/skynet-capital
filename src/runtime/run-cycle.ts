import { createBotBroker } from "../bots/bot-broker.js";
import type { Bot } from "../bots/bot.js";
import type { RiskConfig } from "../engine/guards.js";
import { TradingEngine } from "../engine/trading-engine.js";
import type { Persona } from "../personas/persona.js";
import type { BrokerPort } from "../ports/broker.js";
import type { MarketDataPort } from "../ports/market-data.js";
import type { CycleReportStore, PersistedCycleReport } from "./cycle-report-store.js";

export interface RunCycleDeps {
  readonly persona: Persona;
  readonly broker: BrokerPort;
  readonly marketData: MarketDataPort;
  readonly store: CycleReportStore;
  readonly universe: readonly string[];
  readonly risk?: RiskConfig;
  /** Injectable clock for the recorded timestamp (fixed in tests). */
  readonly now?: () => Date;
}

/**
 * Run one decision cycle and persist the report. The reusable core of the run loop —
 * fully testable with an in-memory broker, scripted data, and an in-memory store; no
 * network. `runBot` below is the only network-touching wrapper.
 */
export async function runCycle(deps: RunCycleDeps): Promise<PersistedCycleReport> {
  const engine = new TradingEngine(deps.persona, deps.broker, deps.marketData, {
    universe: deps.universe,
    risk: deps.risk,
  });
  const report = await engine.runOnce();
  const now = deps.now ?? (() => new Date());
  const persisted: PersistedCycleReport = { recordedAt: now().toISOString(), report };
  await deps.store.save(persisted);
  return persisted;
}

export interface RunBotOptions {
  readonly marketData: MarketDataPort;
  readonly store: CycleReportStore;
  readonly universe: readonly string[];
  readonly risk?: RiskConfig;
  readonly now?: () => Date;
}

/**
 * Run one cycle for a bot against its live Alpaca paper account. Thin wiring over
 * `runCycle` — it builds the live broker from the bot's credentials, then delegates.
 */
export function runBot(bot: Bot, options: RunBotOptions): Promise<PersistedCycleReport> {
  return runCycle({
    persona: bot.persona,
    broker: createBotBroker(bot),
    marketData: options.marketData,
    store: options.store,
    universe: options.universe,
    risk: options.risk,
    now: options.now,
  });
}
