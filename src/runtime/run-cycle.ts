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
 * network.
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
