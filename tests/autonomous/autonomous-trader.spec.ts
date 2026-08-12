import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { MomentumTracker } from "../../src/autonomous/momentum-tracker.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { DayTraderPersona } from "../../src/personas/day-trader.js";
import type { Persona } from "../../src/personas/persona.js";

/** Persona that always wants to buy a fixed symbol — isolates the trader's own logic. */
class AlwaysBuys implements Persona {
  readonly id = "always";
  readonly name = "Always";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [{ symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "test" }];
  }
}

/** Persona whose intent carries playbook attribution — exercises the seam end to end. */
class PlaybookBuys implements Persona {
  readonly id = "playbook";
  readonly name = "Playbook";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [
      {
        symbol: "NVDA",
        side: "buy",
        quantity: 10,
        type: "market",
        reason: "pre-print window open",
        playbookId: "S1-NVDA",
        playbookMode: "standard",
      },
    ];
  }
}

const context = (last: number, momentum: number): MarketContext => ({
  asOf: "2026-07-24T14:00:00Z",
  quotes: { NVDA: { symbol: "NVDA", bid: last, ask: last, last, asOf: "2026-07-24T14:00:00Z" } },
  momentum: { NVDA: momentum },
});

describe("AutonomousTrader", () => {
  it("submits a persona's guarded intent", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const trader = new AutonomousTrader({ persona: new AlwaysBuys(), broker });

    const results = await trader.evaluate(context(100, 0.05));

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("filled");
  });

  it("does not re-order the same symbol inside the cooldown window", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    let clock = 1_000;
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      cooldownMs: 60_000,
      now: () => clock,
    });

    await trader.evaluate(context(100, 0.05));
    clock += 30_000; // still inside cooldown
    const second = await trader.evaluate(context(100, 0.05));

    expect(second).toHaveLength(0);
  });

  it("orders again once the cooldown elapses", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    let clock = 1_000;
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      cooldownMs: 60_000,
      now: () => clock,
    });

    await trader.evaluate(context(100, 0.05));
    clock += 90_000; // past cooldown
    const second = await trader.evaluate(context(100, 0.05));

    expect(second).toHaveLength(1);
  });

  it("observe mode records the decision but places NO order", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      mode: "observe",
      onDecision: (r) => records.push(r),
    });

    const results = await trader.evaluate(context(100, 0.05));

    // nothing submitted, and the portfolio is untouched
    expect(results).toHaveLength(0);
    expect((await broker.getPortfolio()).positions).toHaveLength(0);
    // but the decision was fully recorded, marked observed
    expect(records).toHaveLength(1);
    expect(records[0]?.mode).toBe("observe");
    expect(records[0]?.guardedIntents.length).toBeGreaterThan(0);
    expect(records[0]?.outcomes[0]?.action).toBe("observed");
  });

  // The playbook seam (docs/plans/trade-playbooks.md slice 1): attribution flows from
  // persona.decide through the guards into the durable audit trail, so the metrics layer can
  // score per-playbook effectiveness from DecisionRecords alone.
  it("carries playbookId + mode from the intent into the DecisionRecord", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new PlaybookBuys(),
      broker,
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context(100, 0.05));

    const record = records[0];
    expect(record?.rawIntents[0]).toMatchObject({ playbookId: "S1-NVDA" });
    expect(record?.guardedIntents[0]).toMatchObject({
      playbookId: "S1-NVDA",
      playbookMode: "standard",
    });
    expect(record?.outcomes[0]?.intent).toMatchObject({ playbookId: "S1-NVDA" });
  });

  it("live mode records outcomes as placed with the broker result", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context(100, 0.05));

    expect(records[0]?.mode).toBe("live");
    expect(records[0]?.outcomes[0]?.action).toBe("placed");
    expect(records[0]?.outcomes[0]?.result?.status).toBe("filled");
  });

  it("records a cooldown skip as its own outcome without re-submitting", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    let clock = 1_000;
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      cooldownMs: 60_000,
      now: () => clock,
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context(100, 0.05));
    clock += 30_000;
    await trader.evaluate(context(100, 0.05));

    expect(records[1]?.outcomes[0]?.action).toBe("cooldown-skipped");
  });

  it("halts the cycle when the kill switch is thrown — decides and places nothing", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const records: DecisionRecord[] = [];
    let halted = false;
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      blockedReason: () => (halted ? "manual" : null),
      onDecision: (r) => records.push(r),
    });

    expect(await trader.evaluate(context(100, 0.05))).toHaveLength(1); // un-halted: trades
    halted = true;
    const blocked = await trader.evaluate(context(100, 0.05));

    expect(blocked).toHaveLength(0);
    expect(records[1]?.halted).toBe("manual");
    expect(records[1]?.outcomes).toHaveLength(0);
    // portfolio only reflects the one order from before the halt
    expect((await broker.getPortfolio()).positions[0]?.quantity).toBe(10);
  });

  it("drives a real persona from a momentum tracker's context", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 140, ask: 140, last: 140, asOf: "t" },
    ]);
    const tracker = new MomentumTracker(2);
    tracker.record("NVDA", 130);
    tracker.record("NVDA", 140); // +7.7% -> above the Day Trader's entry threshold
    const trader = new AutonomousTrader({ persona: new DayTraderPersona(), broker });

    const results = await trader.evaluate(tracker.context("2026-07-24T14:00:00Z"));

    expect(results[0]).toMatchObject({ status: "filled" });
    const portfolio = await broker.getPortfolio();
    expect(portfolio.positions[0]?.symbol).toBe("NVDA");
  });
});
