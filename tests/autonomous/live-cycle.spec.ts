import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { ScoutState } from "../../src/autonomous/bots-state-db.js";
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

  // Confirmed live 2026-09-04: the first cycle after a restart ran on the first price tick, before
  // any news had been polled — every candidate read "skip", the scan came back empty, and the
  // pre-scan latch burned the scout's one daily shot. An empty scan must retry; a real fire must
  // still latch.
  it("an empty scan does not spend the scout's day — it fires once a candidate appears, then latches", async () => {
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

    // Cycle 1: a quote exists but no signal yet (sentiment and momentum both 0) — nothing to pick.
    await runner.runCycle(aContext({ MSFT: { last: 100 } }));
    expect(decisions).toHaveLength(0);
    expect((await broker.getPortfolio()).positions).toHaveLength(0);

    // Cycle 2, same day: the news poll has landed — the scout must still be able to fire.
    await runner.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.9 } }));
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ personaId: "beta-scout" });

    // Cycle 3, same day, an even stronger candidate: latched — one real fire per day, unchanged.
    await runner.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.95 } }));
    expect(decisions).toHaveLength(1);
  });

  // Confirmed live 2026-09-04: the scout's day-state lived only in process memory, so every
  // restart re-armed it for a fresh "day" and it placed another pair of forced picks. With a
  // durable store, a restarted runner must (1) honor a same-day latch it never set itself, and
  // (2) write every transition back, so the NEXT restart sees it too.
  it("restores the scout's day-state on construction and persists every transition", async () => {
    const broker = new InMemoryBroker(1_000_000, [
      { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const today = aContext({ MSFT: { last: 100, sentiment: 0.9 } }).asOf.slice(0, 10);
    const saved: ScoutState[] = [];
    const store = {
      load: () => ({
        day: today,
        ranToday: true,
        firedOrganicallyToday: false,
        ownedSymbols: ["AVGO"],
      }),
      save: (state: ScoutState) => {
        saved.push(state);
      },
    };
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
      scoutState: store,
      onDecision: (r) => decisions.push(r),
    });

    // A strong candidate on the SAME day the restored state says the scout already fired:
    // the restored latch holds — no second pair of picks after a restart.
    await runner.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.9 } }));
    expect(decisions).toHaveLength(0);
    expect((await broker.getPortfolio()).positions).toHaveLength(0);

    // A fresh store (nothing restored) latching for real must write the transition back.
    const fresh: ScoutState[] = [];
    const runner2 = new LiveCycleRunner({
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
      scoutState: { load: () => undefined, save: (s) => fresh.push(s) },
    });
    await runner2.runCycle(aContext({ MSFT: { last: 100, sentiment: 0.9 } }));
    expect(fresh.at(-1)).toMatchObject({ day: today, ranToday: true, ownedSymbols: ["MSFT"] });
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
  // Eric, 2026-09-04: "configuration that nudges sauron to put in an after hours trade that is
  // staged to be executed when the market opens (on tuesday, not monday)". Staging runs the
  // scout's one daily scan while the market is closed, for the session Alpaca's next_open names,
  // and SPENDS that session's budget so the in-hours cycle that day stays silent.
  describe("stageScout (after-close staging for the next session)", () => {
    function armed(broker: InMemoryBroker, decisions: DecisionRecord[], saved: ScoutState[] = []) {
      return new LiveCycleRunner({
        traders: [aBot(new NeverBuys(), broker)],
        safety: new SafetyController(),
        blockedReason: () => null,
        scout: {
          maxPicks: 2,
          broker,
          universe: ["MSFT", "NVDA"],
          managedSymbols: new Set(),
          risk: RISK,
          mode: "live",
        },
        scoutState: { load: () => undefined, save: (state) => saved.push(state) },
        onDecision: (r) => decisions.push(r),
      });
    }

    it("stages picks for the named session, exits the previous session's picks first, and latches that session", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
        { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const decisions: DecisionRecord[] = [];
      const saved: ScoutState[] = [];
      const runner = armed(broker, decisions, saved);

      // Friday in-hours: the scout fires on MSFT.
      await runner.runCycle(
        aContext({ MSFT: { last: 100, sentiment: 0.9 } }, "2026-09-04T15:00:00Z"),
      );
      expect(decisions).toHaveLength(1);

      // Friday evening, market closed, Alpaca says next_open is TUESDAY (Labor Day Monday).
      const staged = await runner.stageScout(
        aContext(
          { MSFT: { last: 100, sentiment: 0.9 }, NVDA: { last: 100, momentum: 0.03 } },
          "2026-09-05T00:30:00Z",
        ),
        "2026-09-08",
      );

      // Exit of Friday's MSFT pick (the session rollover) + the new NVDA pick; MSFT is not re-bought.
      expect(staged).toBe(1);
      const intents = decisions.flatMap((d) =>
        d.outcomes.map((o) => `${o.intent.side} ${o.intent.symbol}`),
      );
      expect(intents).toEqual(["buy MSFT", "sell MSFT", "buy NVDA"]);
      expect(saved[saved.length - 1]).toMatchObject({
        day: "2026-09-08",
        ranToday: true,
        ownedSymbols: ["NVDA"],
      });

      // Saturday: another staging poll is a no-op — the session is already spent.
      expect(
        await runner.stageScout(
          aContext({ NVDA: { last: 100, momentum: 0.05 } }, "2026-09-06T01:00:00Z"),
          "2026-09-08",
        ),
      ).toBe(0);

      // Tuesday in-hours: the day-state says the scout already ran for 2026-09-08 — silent.
      await runner.runCycle(
        aContext({ MSFT: { last: 100, sentiment: 0.95 } }, "2026-09-08T14:00:00Z"),
      );
      expect(decisions.flatMap((d) => d.outcomes)).toHaveLength(3);
    });

    it("an empty after-hours scan stages nothing and does not spend the session", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const decisions: DecisionRecord[] = [];
      const runner = armed(broker, decisions);

      expect(
        await runner.stageScout(
          aContext({ MSFT: { last: 100 } }, "2026-09-05T00:30:00Z"),
          "2026-09-08",
        ),
      ).toBe(0);
      // Later that weekend the sentiment window has a read — the same session can still stage.
      expect(
        await runner.stageScout(
          aContext({ MSFT: { last: 100, sentiment: 0.9 } }, "2026-09-06T00:30:00Z"),
          "2026-09-08",
        ),
      ).toBe(1);
      expect(decisions).toHaveLength(1);
    });

    it("is dark with no scout configured", async () => {
      const broker = new InMemoryBroker(1_000_000, [
        { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
      ]);
      const runner = new LiveCycleRunner({
        traders: [aBot(new NeverBuys(), broker)],
        safety: new SafetyController(),
        blockedReason: () => null,
      });
      expect(
        await runner.stageScout(aContext({ MSFT: { last: 100, sentiment: 0.9 } }), "2026-09-08"),
      ).toBe(0);
    });
  });
});
