import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { BrokerPort } from "../../src/ports/broker.js";

/** #6954 slice 3 — a tripped breaker holds a bot's OPENS and never its exits; the ladder's bottom
 *  rung closes the shares book. The kill switch and the suspends (`blockedReason`) still place
 *  nothing, and that half is the contrast these specs keep beside the new one. */

/** Wants to open NVDA and to sell the AMD it already holds. */
class OpensAndExits implements Persona {
  readonly id = "both";
  readonly name = "Both";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [
      { symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "open" },
      { symbol: "AMD", side: "sell", quantity: 5, type: "market", reason: "exit" },
    ];
  }
}

const quote = (symbol: string, last: number) => ({
  symbol,
  bid: last,
  ask: last,
  last,
  asOf: "2026-07-24T14:00:00Z",
});
const context: MarketContext = {
  asOf: "2026-07-24T14:00:00Z",
  quotes: { NVDA: quote("NVDA", 100), AMD: quote("AMD", 50) },
  momentum: { NVDA: 0.05, AMD: -0.05 },
};

async function bookHolding(): Promise<InMemoryBroker> {
  const broker = new InMemoryBroker(1_000_000, [
    { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    { symbol: "AMD", bid: 50, ask: 50, last: 50, asOf: "t" },
  ]);
  await broker.submit({ symbol: "AMD", side: "buy", quantity: 20, type: "market", reason: "seed" });
  return broker;
}

const held = async (broker: InMemoryBroker, symbol: string) =>
  (await broker.getPortfolio()).positions.find((p) => p.symbol === symbol)?.quantity ?? 0;

describe("a tripped breaker holds opens, never exits", () => {
  it("refuses the open as breaker-halt, places the exit, and says the breaker on the record", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      openBlockedReason: () => "daily-loss",
      onDecision: (r) => records.push(r),
    });

    const results = await trader.evaluate(context);

    expect(results.map((r) => r.intent.symbol)).toEqual(["AMD"]);
    expect(await held(broker, "AMD")).toBe(15);
    expect(await held(broker, "NVDA")).toBe(0);
    expect(records[0]?.refusals).toMatchObject([
      { intent: { symbol: "NVDA", side: "buy" }, reason: "breaker-halt" },
    ]);
    expect(records[0]?.halted).toBe("daily-loss");
  });

  it("does the same with the breaker clear: the open is placed and nothing is said halted", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      openBlockedReason: () => null,
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context);

    expect(await held(broker, "NVDA")).toBe(10);
    expect(records[0]?.halted).toBeUndefined();
  });

  it("still stops everything under the stop-everything gate, exits included", async () => {
    const broker = await bookHolding();
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      blockedReason: () => "manual",
      openBlockedReason: () => null,
    });

    expect(await trader.evaluate(context)).toHaveLength(0);
    expect(await held(broker, "AMD")).toBe(20);
  });

  it("holds opens in observe mode too, so the record says what a live bot would have refused", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      mode: "observe",
      openBlockedReason: () => "errors",
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context);

    expect(records[0]?.refusals?.[0]?.reason).toBe("breaker-halt");
    expect(records[0]?.outcomes.map((o) => o.action)).toEqual(["observed"]);
  });
});

describe("the risk ladder reaches the guards", () => {
  it("refuses the open at the restricted rung and keeps the exit", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      riskTier: () => "restricted",
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context);

    expect(records[0]?.refusals?.[0]?.reason).toBe("ladder-block");
    expect(await held(broker, "AMD")).toBe(15);
  });

  it("leaves the guards alone with no reading yet — absent is never clear", async () => {
    const broker = await bookHolding();
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      riskTier: () => undefined,
    });

    await trader.evaluate(context);

    expect(await held(broker, "NVDA")).toBe(10);
  });
});

describe("the ladder's bottom rung closes the book", () => {
  it("sells the whole holding in place of the persona's own share orders", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      riskTier: () => "liquidate",
      forceFlatten: () => "risk ladder: drawdown 8.1%",
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context);

    expect(await held(broker, "AMD")).toBe(0);
    expect(await held(broker, "NVDA")).toBe(0);
    expect(records[0]?.rawIntents).toMatchObject([
      { symbol: "AMD", side: "sell", quantity: 20, reason: "risk ladder: drawdown 8.1%" },
    ]);
  });

  it("flattens through a tripped breaker: the breaker holds opens and the flatten is an exit", async () => {
    const broker = await bookHolding();
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      openBlockedReason: () => "daily-loss",
      riskTier: () => "liquidate",
      forceFlatten: () => "risk ladder",
    });

    await trader.evaluate(context);

    expect(await held(broker, "AMD")).toBe(0);
  });

  it("does nothing extra when no flatten is asked for", async () => {
    const broker = await bookHolding();
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      forceFlatten: () => null,
    });

    await trader.evaluate(context);

    expect(await held(broker, "AMD")).toBe(15);
  });

  it("names a position a flatten cannot close instead of reporting a flat book", async () => {
    const real = await bookHolding();
    // An option leg on the book: planForceFlatten cannot close a contract with a market sell.
    const broker: BrokerPort = {
      submit: (intent) => real.submit(intent),
      getPortfolio: async () => {
        const portfolio = await real.getPortfolio();
        const leg = { symbol: "NVDA261113C00185000", quantity: 1, avgPrice: 3 };
        return { ...portfolio, positions: [...portfolio.positions, leg] };
      },
    };
    const gaps: string[][] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      forceFlatten: () => "risk ladder",
      onFlattenGap: (_id, symbols) => gaps.push([...symbols]),
    });

    await trader.evaluate(context);

    expect(gaps).toEqual([["NVDA261113C00185000"]]);
  });
});
