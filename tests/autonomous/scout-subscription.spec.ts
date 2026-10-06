import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { aContext, aSubscription } from "../support/builders.js";

/**
 * THE FORCED DAILY PICK IS A SUBSCRIBABLE PLAYBOOK (#4642 slice 10). Two switches, both needed:
 * `SKYNET_BETA_FORCING` armed (ops — here, `maxPicks`) AND its host bot subscribed to BETA-SCOUT
 * with the subscription on. Unsubscribed, its picks are refused by name and recorded once a day,
 * never every cycle; paused, it picks nothing new. Its exits run in every case.
 */
const quote = (symbol: string) => ({ symbol, bid: 100, ask: 100, last: 100, asOf: "t" });
const DAY_1 = "2026-07-24T15:00:00Z";
const DAY_1_LATER = "2026-07-24T17:00:00Z";
const DAY_2 = "2026-07-27T15:00:00Z";
const signal = (asOf: string) =>
  aContext({ MSFT: { last: 100, sentiment: 0.9 }, GOOG: { last: 100, sentiment: 0.8 } }, asOf);

function armed(subscriptions: () => readonly PlaybookSubscription[]) {
  const broker = new InMemoryBroker(1_000_000, [quote("MSFT"), quote("GOOG")]);
  const decisions: DecisionRecord[] = [];
  const runner = new LiveCycleRunner({
    traders: [
      {
        personaName: "Quiet",
        broker,
        trader: new AutonomousTrader({
          persona: { id: "quiet", name: "Quiet", thesis: "t", decide: () => [] },
          broker,
          risk: { maxPositionPct: 0.5 },
        }),
      },
    ],
    safety: new SafetyController(),
    blockedReason: () => null,
    scout: {
      maxPicks: 1,
      broker,
      universe: ["MSFT", "GOOG"],
      managedSymbols: new Set(),
      risk: { maxPositionPct: 0.5 },
      mode: "live",
      subscriptions,
    },
    onDecision: (r) => decisions.push(r),
  });
  const held = async () => (await broker.getPortfolio()).positions.map((p) => p.symbol);
  return { runner, decisions, held };
}

const scout = (over: Partial<PlaybookSubscription> = {}) =>
  aSubscription("quiet", "BETA-SCOUT", over);

describe("the forced daily pick, armed and subscribed", () => {
  it("places its pick stamped with its id and the subscription's mode", async () => {
    const { runner, decisions, held } = armed(() => [scout({ mode: "aggressive" })]);
    await runner.runCycle(signal(DAY_1));
    expect(await held()).toEqual(["MSFT"]);
    expect(decisions[0]?.outcomes).toMatchObject([
      {
        action: "placed",
        intent: { symbol: "MSFT", playbookId: "BETA-SCOUT", playbookMode: "aggressive" },
      },
    ]);
  });
});

describe("the forced daily pick, armed but not subscribed", () => {
  it("places nothing, and records its picks refused by name — once a day, not every cycle", async () => {
    const { runner, decisions, held } = armed(() => []);
    await runner.runCycle(signal(DAY_1));
    await runner.runCycle(signal(DAY_1_LATER));
    expect(await held()).toEqual([]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      personaId: "beta-scout",
      rawIntents: [{ symbol: "MSFT", side: "buy", playbookId: "BETA-SCOUT" }],
      guardedIntents: [],
      outcomes: [],
      refusals: [{ reason: "unsubscribed" }],
    });

    await runner.runCycle(signal(DAY_2));
    expect(decisions).toHaveLength(2);
    expect(await held()).toEqual([]);
  });

  it("subscribed later the same day, it picks that day", async () => {
    const subscriptions: PlaybookSubscription[] = [];
    const { runner, decisions, held } = armed(() => subscriptions);
    await runner.runCycle(signal(DAY_1));
    subscriptions.push(scout());
    await runner.runCycle(signal(DAY_1_LATER));
    expect(await held()).toEqual(["MSFT"]);
    expect(decisions.map((d) => d.outcomes.length)).toEqual([0, 1]);
  });

  it("still sells yesterday's pick — unsubscribing never strands a position", async () => {
    const subscriptions: PlaybookSubscription[] = [scout()];
    const { runner, decisions, held } = armed(() => subscriptions);
    await runner.runCycle(signal(DAY_1));
    expect(await held()).toEqual(["MSFT"]);
    subscriptions.length = 0;
    await runner.runCycle(signal(DAY_2));
    expect(await held()).toEqual([]);
    const exit = decisions[1];
    expect(exit?.outcomes).toMatchObject([
      { action: "placed", intent: { symbol: "MSFT", side: "sell" } },
    ]);
    // …and the day's new pick is refused, recorded beside it.
    expect(decisions[2]?.refusals).toMatchObject([
      { intent: { symbol: "GOOG" }, reason: "unsubscribed" },
    ]);
  });
});

describe("the forced daily pick, paused", () => {
  it("picks nothing new and records nothing, but still sells yesterday's pick", async () => {
    const subscriptions: PlaybookSubscription[] = [scout()];
    const { runner, decisions, held } = armed(() => subscriptions);
    await runner.runCycle(signal(DAY_1));
    subscriptions.splice(0, 1, scout({ enabled: false }));
    await runner.runCycle(signal(DAY_2));
    await runner.runCycle(signal("2026-07-27T17:00:00Z"));
    expect(await held()).toEqual([]);
    expect(
      decisions.map((d) => d.outcomes.map((o) => `${o.intent.side} ${o.intent.symbol}`)),
    ).toEqual([["buy MSFT"], ["sell MSFT"]]);
  });
});
