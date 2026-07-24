import { computeEquity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, OrderResult } from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import type { BrokerPort } from "../ports/broker.js";
import type { MarketDataPort } from "../ports/market-data.js";
import { DEFAULT_RISK_CONFIG, type RiskConfig, applyGuards } from "./guards.js";

/** A full record of one decision cycle — the unit the learning loop and recaps consume. */
export interface CycleReport {
  readonly asOf: string;
  readonly personaId: string;
  /** What the persona wanted, before risk guards. */
  readonly rawIntents: readonly OrderIntent[];
  /** What the guards approved and sent to the broker. */
  readonly submittedIntents: readonly OrderIntent[];
  readonly results: readonly OrderResult[];
  readonly equityBefore: number;
  readonly equityAfter: number;
}

export interface TradingEngineOptions {
  readonly universe: readonly string[];
  readonly risk?: RiskConfig;
}

/**
 * Drives one persona through a single decision cycle against a broker and a data feed.
 *
 * The engine owns orchestration and risk; it knows nothing about *which* persona or
 * *which* broker it holds (all via ports). That's what lets the same engine run the
 * in-memory paper simulator in tests and a live Alpaca paper account in production
 * with zero code change.
 */
export class TradingEngine {
  private readonly persona: Persona;
  private readonly broker: BrokerPort;
  private readonly marketData: MarketDataPort;
  private readonly options: TradingEngineOptions;

  constructor(
    persona: Persona,
    broker: BrokerPort,
    marketData: MarketDataPort,
    options: TradingEngineOptions,
  ) {
    this.persona = persona;
    this.broker = broker;
    this.marketData = marketData;
    this.options = options;
  }

  async runOnce(): Promise<CycleReport> {
    const context: MarketContext = await this.marketData.snapshot(this.options.universe);
    const portfolioBefore = await this.broker.getPortfolio();
    const equityBefore = computeEquity(portfolioBefore, context.quotes);

    const rawIntents = this.persona.decide(context, portfolioBefore);
    const submittedIntents = applyGuards(
      rawIntents,
      portfolioBefore,
      context,
      this.options.risk ?? DEFAULT_RISK_CONFIG,
    );

    const results: OrderResult[] = [];
    for (const intent of submittedIntents) {
      results.push(await this.broker.submit(intent));
    }

    const portfolioAfter = await this.broker.getPortfolio();
    const equityAfter = computeEquity(portfolioAfter, context.quotes);

    return {
      asOf: context.asOf,
      personaId: this.persona.id,
      rawIntents,
      submittedIntents,
      results,
      equityBefore,
      equityAfter,
    };
  }
}
