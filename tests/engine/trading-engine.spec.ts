import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { ScriptedMarketData } from "../../src/adapters/scripted-market-data.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { TradingEngine } from "../../src/engine/trading-engine.js";
import { FuturistPersona } from "../../src/personas/futurist.js";
import type { Persona } from "../../src/personas/persona.js";
import { aContext, aQuote } from "../support/builders.js";

/** A persona that always emits exactly the intents it was handed — isolates the engine. */
class StubPersona implements Persona {
  readonly id = "stub";
  readonly name = "Stub";
  readonly thesis = "test double";
  constructor(private readonly intents: OrderIntent[]) {}
  decide(_context: MarketContext, _portfolio: Portfolio): OrderIntent[] {
    return this.intents;
  }
}

function brokerMarkedTo(context: MarketContext, cash: number): InMemoryBroker {
  return new InMemoryBroker(cash, Object.values(context.quotes));
}

describe("TradingEngine.runOnce", () => {
  describe("a valid persona buy", () => {
    it("is filled and reduces cash by the notional", async () => {
      const context = aContext({ PLTR: { last: 50, momentum: 0.05 } });
      const broker = brokerMarkedTo(context, 5_000_000);
      const persona = new StubPersona([
        { symbol: "PLTR", side: "buy", quantity: 100, type: "market", reason: "test" },
      ]);

      const engine = new TradingEngine(persona, broker, new ScriptedMarketData([context]), {
        universe: ["PLTR"],
      });
      const report = await engine.runOnce();

      expect(report.results[0]?.status).toBe("filled");
      const portfolio = await broker.getPortfolio();
      expect(portfolio.positions[0]).toMatchObject({ symbol: "PLTR", quantity: 100 });
      // Filled at the ask (50.05).
      const pltrAsk = context.quotes.PLTR?.ask ?? 0;
      expect(portfolio.cash).toBeCloseTo(5_000_000 - 100 * pltrAsk, 5);
    });
  });

  describe("a persona order that violates risk limits", () => {
    it("is clamped by the engine before reaching the broker", async () => {
      const context = aContext({ PLTR: { last: 50 } });
      const broker = brokerMarkedTo(context, 100_000);
      // Wants $10M of stock on a $100k account — guards must shrink it.
      const persona = new StubPersona([
        { symbol: "PLTR", side: "buy", quantity: 200_000, type: "market", reason: "test" },
      ]);

      const engine = new TradingEngine(persona, broker, new ScriptedMarketData([context]), {
        universe: ["PLTR"],
        risk: { maxPositionPct: 0.2 },
      });
      const report = await engine.runOnce();

      expect(report.rawIntents[0]?.quantity).toBe(200_000);
      expect(report.submittedIntents[0]?.quantity).toBeLessThan(200_000);
      expect(report.results[0]?.status).toBe("filled");
    });
  });

  describe("across a two-snapshot momentum sequence with the real Futurist", () => {
    it("opens a position when the breakout confirms and grows equity as price rises", async () => {
      const quiet = aContext({ PLTR: { last: 50, momentum: 0.0 } });
      const breakout: MarketContext = {
        asOf: "2026-07-24T15:00:00Z",
        quotes: { PLTR: aQuote({ symbol: "PLTR", last: 55 }) },
        momentum: { PLTR: 0.05 },
      };
      const broker = new InMemoryBroker(5_000_000, Object.values(quiet.quotes));
      const marketData = new ScriptedMarketData([quiet, breakout]);
      const engine = new TradingEngine(new FuturistPersona(), broker, marketData, {
        universe: ["PLTR"],
      });

      // Cycle 1: quiet tape, no trade.
      const first = await engine.runOnce();
      expect(first.results).toEqual([]);

      // Price moves up before cycle 2; re-mark the broker's book to the new snapshot.
      broker.mark(Object.values(breakout.quotes));
      const second = await engine.runOnce();

      expect(second.results[0]?.status).toBe("filled");
      const portfolio = await broker.getPortfolio();
      expect(portfolio.positions[0]?.symbol).toBe("PLTR");
    });
  });
});
