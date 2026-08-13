import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { type LiveBot, LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { aContext } from "../support/builders.js";

/** Persona that always wants to buy a fixed symbol — isolates the orchestration from persona
 *  judgment, exactly like `AlwaysBuys` in autonomous-trader.spec.ts. */
class AlwaysBuys implements Persona {
  readonly id = "always";
  readonly name = "Always";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [{ symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "test" }];
  }
}

/** Persona that never trades — the "silence" the beta scout is meant to fill. */
class NeverBuys implements Persona {
  readonly id = "never";
  readonly name = "Never";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [];
  }
}

const RISK = { maxPositionPct: 0.5 };

/** One bot: an AlwaysBuys or NeverBuys persona wired to its own AutonomousTrader on a broker. */
function aBot(
  persona: Persona,
  broker: InMemoryBroker,
  opts: { onDecision?: (r: DecisionRecord) => void; blockedReason?: () => string | null } = {},
): LiveBot {
  return {
    personaName: persona.name,
    broker,
    trader: new AutonomousTrader({
      persona,
      broker,
      risk: RISK,
      cooldownMs: 0, // fire every cycle — the cooldown isn't what these specs are about
      blockedReason: opts.blockedReason,
      onDecision: opts.onDecision,
    }),
  };
}

describe("LiveCycleRunner", () => {
  it("evaluates a bot normally with no scout configured", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const decisions: DecisionRecord[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new AlwaysBuys(), broker, { onDecision: (r) => decisions.push(r) })],
      safety: new SafetyController(),
      blockedReason: () => null,
      // no `scout` — dark by default
    });

    await runner.runCycle(aContext({ NVDA: { last: 100, momentum: 0.05 } }));

    const portfolio = await broker.getPortfolio();
    expect(portfolio.positions[0]).toMatchObject({ symbol: "NVDA", quantity: 10 });
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.outcomes[0]?.action).toBe("placed");
  });

  it("an organic fire suppresses the beta scout that same cycle", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const scoutDecisions: DecisionRecord[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new AlwaysBuys(), broker)],
      safety: new SafetyController(),
      blockedReason: () => null,
      scout: {
        maxPicks: 3,
        broker,
        universe: ["MSFT"], // a signal the scout WOULD pick, if it ran
        managedSymbols: new Set(),
        risk: RISK,
        mode: "live",
      },
      onDecision: (r) => scoutDecisions.push(r),
    });

    // MSFT carries strong sentiment — a candidate the scout would rank highly if it ran.
    await runner.runCycle(
      aContext({ NVDA: { last: 100, momentum: 0.05 }, MSFT: { last: 100, sentiment: 0.9 } }),
    );

    expect(scoutDecisions).toHaveLength(0);
    const portfolio = await broker.getPortfolio();
    expect(portfolio.positions.some((p) => p.symbol === "MSFT")).toBe(false);
  });

  it("stays dark with no scout configured, even when nothing organic fires", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const decisions: DecisionRecord[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new NeverBuys(), broker)],
      safety: new SafetyController(),
      blockedReason: () => null,
      onDecision: (r) => decisions.push(r),
      // no `scout`
    });

    await runner.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.9 } }));

    expect(decisions).toHaveLength(0);
    expect((await broker.getPortfolio()).positions).toHaveLength(0);
  });

  it("fires the beta scout when armed and nothing organic fires", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const decisions: DecisionRecord[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new NeverBuys(), broker)],
      safety: new SafetyController(),
      blockedReason: () => null,
      scout: {
        maxPicks: 3,
        broker,
        universe: ["MSFT"],
        managedSymbols: new Set(),
        risk: RISK,
        mode: "live",
      },
      onDecision: (r) => decisions.push(r),
    });

    await runner.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.9 } }));

    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ personaId: "beta-scout", mode: "live" });
    expect(decisions[0]?.outcomes[0]?.action).toBe("placed");
    const portfolio = await broker.getPortfolio();
    expect(portfolio.positions.some((p) => p.symbol === "MSFT")).toBe(true);
  });

  // Regression for the exact bug class caught and fixed before this extraction: applying
  // `firedOrganicallyThisCycle` BEFORE the day-rollover reset would let the reset wipe the flag
  // back to false, so an organic fire landing on the first cycle of a new day would NOT suppress
  // the scout that day. The fix applies the flag AFTER the reset — see `LiveCycleRunner`'s
  // private `runBetaScout`.
  it("does not fire the scout when an organic fire lands on the same cycle as a day rollover", async () => {
    const broker = new InMemoryBroker(10_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const scoutDecisions: DecisionRecord[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new AlwaysBuys(), broker)], // fires every cycle (cooldownMs: 0)
      safety: new SafetyController(),
      blockedReason: () => null,
      scout: {
        maxPicks: 3,
        broker,
        universe: ["MSFT"],
        managedSymbols: new Set(),
        risk: RISK,
        mode: "live",
      },
      onDecision: (r) => scoutDecisions.push(r),
    });
    const contextFor = (day: string): MarketContext =>
      aContext(
        { NVDA: { last: 100, momentum: 0.05 }, MSFT: { last: 100, sentiment: 0.9 } },
        `${day}T14:30:00Z`,
      );

    // Day 1: organic fire establishes `scoutDay`; the scout correctly stays dark (already covered
    // above) — this just seeds state so day 2 is a genuine rollover, not the first cycle ever.
    await runner.runCycle(contextFor("2026-08-12"));
    // Day 2, first cycle: the rollover AND an organic fire land in the SAME cycle.
    await runner.runCycle(contextFor("2026-08-13"));

    expect(scoutDecisions).toHaveLength(0);
    const portfolio = await broker.getPortfolio();
    expect(portfolio.positions.some((p) => p.symbol === "MSFT")).toBe(false);
  });

  it("the safety breaker halts all evaluation — no bot and no scout order places", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const safety = new SafetyController();
    safety.halt("manual");
    const botDecisions: DecisionRecord[] = [];
    const scoutHaltedReasons: string[] = [];
    const runner = new LiveCycleRunner({
      traders: [
        aBot(new AlwaysBuys(), broker, {
          onDecision: (r) => botDecisions.push(r),
          blockedReason: () => safety.blockedReason(),
        }),
      ],
      safety,
      blockedReason: () => safety.blockedReason(),
      scout: {
        maxPicks: 3,
        broker,
        universe: ["MSFT"],
        managedSymbols: new Set(),
        risk: RISK,
        mode: "live",
      },
      onScoutHalted: (reason) => scoutHaltedReasons.push(reason),
    });

    await runner.runCycle(
      aContext({ NVDA: { last: 100, momentum: 0.05 }, MSFT: { last: 100, sentiment: 0.9 } }),
    );

    expect((await broker.getPortfolio()).positions).toHaveLength(0);
    expect(botDecisions[0]?.halted).toBe("manual");
    expect(scoutHaltedReasons).toEqual(["manual"]);
  });

  it("respects an injected portfolio-read failure without throwing the cycle", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const originalGetPortfolio = broker.getPortfolio.bind(broker);
    let calls = 0;
    broker.getPortfolio = () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error("boom")) : originalGetPortfolio();
    };
    const equityErrors: unknown[] = [];
    const runner = new LiveCycleRunner({
      traders: [aBot(new AlwaysBuys(), broker)],
      safety: new SafetyController(),
      blockedReason: () => null,
      onEquityReadError: (error) => equityErrors.push(error),
    });

    await runner.runCycle(aContext({ NVDA: { last: 100, momentum: 0.05 } }));

    expect(equityErrors).toHaveLength(1);
    // The cycle still evaluated the bot despite the equity read failing.
    expect((await broker.getPortfolio()).positions[0]?.quantity).toBe(10);
  });
});
