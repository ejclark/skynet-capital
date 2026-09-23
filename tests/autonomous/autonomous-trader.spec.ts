import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { MomentumTracker } from "../../src/autonomous/momentum-tracker.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { DayTraderPersona } from "../../src/personas/day-trader.js";
import type { Persona } from "../../src/personas/persona.js";
import type { BrokerPort } from "../../src/ports/broker.js";

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
    // The market context is captured even on a halted cycle — a halt is exactly the kind of
    // cycle the replay/counterfactual measures want on the tape, not a gap in it.
    expect(records[1]?.context).toEqual(context(100, 0.05));
    // portfolio only reflects the one order from before the halt
    expect((await broker.getPortfolio()).positions[0]?.quantity).toBe(10);
  });

  it("captures the market context the persona reasoned over on every cycle", async () => {
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

    expect(records[0]?.context).toEqual(context(100, 0.05));
  });

  it("names the guard that refused an intent, in a real (non-money-moving) risk config", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker,
      // restricted blocks every buy via the ladder — a refusal with no money moved.
      risk: { maxPositionPct: 0.2, accountTier: "restricted" },
      onDecision: (r) => records.push(r),
    });

    const results = await trader.evaluate(context(100, 0.05));

    expect(results).toHaveLength(0);
    expect(records[0]?.guardedIntents).toEqual([]);
    expect(records[0]?.outcomes).toEqual([]);
    expect(records[0]?.refusals).toHaveLength(1);
    expect(records[0]?.refusals?.[0]).toMatchObject({ reason: "ladder-block" });
    expect(records[0]?.refusals?.[0]?.intent.symbol).toBe("NVDA");
  });

  it("omits refusals entirely when nothing was refused this cycle", async () => {
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

    expect(records[0]).not.toHaveProperty("refusals");
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

  describe("initialCooldowns/onCooldownSet — durability across a process restart", () => {
    it("a restored cooldown blocks an order exactly as a same-process one would", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const trader = new AutonomousTrader({
        persona: new AlwaysBuys(),
        broker,
        cooldownMs: 60_000,
        now: () => 1_030_000,
        initialCooldowns: new Map([["NVDA", 1_000_000]]), // 30s ago, inside the 60s cooldown
      });

      const results = await trader.evaluate(context(100, 0.05));

      expect(results).toHaveLength(0);
    });

    it("fires onCooldownSet with the symbol and timestamp on every placed order", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const seen: [string, number][] = [];
      const trader = new AutonomousTrader({
        persona: new AlwaysBuys(),
        broker,
        now: () => 42,
        onCooldownSet: (symbol, at) => seen.push([symbol, at]),
      });

      await trader.evaluate(context(100, 0.05));

      expect(seen).toEqual([["NVDA", 42]]);
    });

    it("never fires onCooldownSet for a cooldown-skipped or observe-mode intent", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const seen: [string, number][] = [];
      const trader = new AutonomousTrader({
        persona: new AlwaysBuys(),
        broker,
        mode: "observe",
        onCooldownSet: (symbol, at) => seen.push([symbol, at]),
      });

      await trader.evaluate(context(100, 0.05));

      expect(seen).toEqual([]);
    });
  });
  /**
   * The Playbook Store bridge (issue #3595): a subscription change reaches a RUNNING bot by
   * swapping its persona + risk in place, because a restart would throw away exactly the state
   * (cooldowns, and the trackers feeding them) that a mid-session change must not cost.
   */
  describe("swapRoster", () => {
    const quotes = [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      { symbol: "GOOGL", bid: 100, ask: 100, last: 100, asOf: "t" },
    ];
    const twoSymbolContext = (): MarketContext => ({
      asOf: "2026-07-24T14:00:00Z",
      quotes: {
        NVDA: { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "2026-07-24T14:00:00Z" },
        GOOGL: { symbol: "GOOGL", bid: 100, ask: 100, last: 100, asOf: "2026-07-24T14:00:00Z" },
      },
      momentum: { NVDA: 0.05, GOOGL: 0.05 },
    });

    it("decides with the swapped-in persona on the next cycle", async () => {
      const broker = new InMemoryBroker(1_000_000, quotes);
      const trader = new AutonomousTrader({ persona: new AlwaysBuys(), broker, cooldownMs: 0 });

      const first = await trader.evaluate(twoSymbolContext());
      expect(first[0]?.intent.symbol).toBe("NVDA");

      trader.swapRoster({
        persona: {
          id: "always",
          name: "Always",
          thesis: "test",
          decide: () => [
            { symbol: "GOOGL", side: "buy", quantity: 10, type: "market", reason: "swapped" },
          ],
        },
        risk: DEFAULT_RISK_CONFIG,
      });

      const second = await trader.evaluate(twoSymbolContext());
      expect(second[0]?.intent.symbol).toBe("GOOGL");
    });

    it("hands the swapped-in risk config to the guards", async () => {
      const broker = new InMemoryBroker(1_000_000, quotes);
      const records: DecisionRecord[] = [];
      const trader = new AutonomousTrader({
        persona: new PlaybookBuys(),
        broker,
        cooldownMs: 0,
        onDecision: (r) => records.push(r),
      });

      expect(await trader.evaluate(twoSymbolContext())).toHaveLength(1);

      // The member re-aimed the subscription at GOOGL — the S1-NVDA buy must now be refused.
      trader.swapRoster({
        persona: new PlaybookBuys(),
        risk: {
          ...DEFAULT_RISK_CONFIG,
          subscriptions: [
            {
              accountId: "sauron",
              playbookId: "S1-NVDA",
              mode: "standard",
              capitalAllocated: 5_000,
              enabled: true,
              createdAt: "2026-09-20T00:00:00.000Z",
              updatedAt: "2026-09-23T00:00:00.000Z",
              symbols: ["GOOGL"],
            },
          ],
        },
      });

      expect(await trader.evaluate(twoSymbolContext())).toHaveLength(0);
      expect(records.at(-1)?.refusals?.[0]?.reason).toBe("subscription-filter");
    });

    it("keeps the cooldown clock across the swap — the whole reason it is not a rebuild", async () => {
      const broker = new InMemoryBroker(1_000_000, quotes);
      const records: DecisionRecord[] = [];
      let clock = 1_000;
      const trader = new AutonomousTrader({
        persona: new AlwaysBuys(),
        broker,
        cooldownMs: 60_000,
        now: () => clock,
        onDecision: (r) => records.push(r),
      });

      await trader.evaluate(context(100, 0.05));
      trader.swapRoster({ persona: new AlwaysBuys(), risk: DEFAULT_RISK_CONFIG });

      clock += 1_000;
      expect(await trader.evaluate(context(100, 0.05))).toHaveLength(0);
      expect(records.at(-1)?.outcomes[0]?.action).toBe("cooldown-skipped");
    });

    it("never lands mid-cycle — a swap during an in-flight cycle applies to the next one", async () => {
      const broker = new InMemoryBroker(1_000_000, quotes);
      // Holds the FIRST cycle open at its portfolio read, so the swap below lands mid-flight;
      // every later cycle runs straight through.
      let releasePortfolio: (() => void) | undefined;
      let held = false;
      const gated: BrokerPort = {
        getPortfolio: async () => {
          if (!held) {
            held = true;
            await new Promise<void>((resolve) => {
              releasePortfolio = resolve;
            });
          }
          return broker.getPortfolio();
        },
        submit: (intent) => broker.submit(intent),
      };
      const trader = new AutonomousTrader({
        persona: new AlwaysBuys(),
        broker: gated,
        cooldownMs: 0,
      });

      const inFlight = trader.evaluate(twoSymbolContext());
      await new Promise((resolve) => setTimeout(resolve, 0));
      trader.swapRoster({
        persona: {
          id: "always",
          name: "Always",
          thesis: "test",
          decide: () => [
            { symbol: "GOOGL", side: "buy", quantity: 10, type: "market", reason: "swapped" },
          ],
        },
        risk: DEFAULT_RISK_CONFIG,
      });
      releasePortfolio?.();

      expect((await inFlight)[0]?.intent.symbol).toBe("NVDA");
      expect((await trader.evaluate(twoSymbolContext()))[0]?.intent.symbol).toBe("GOOGL");
    });
  });
});
