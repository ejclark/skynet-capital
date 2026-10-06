import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { ScoutState } from "../../src/autonomous/bots-state-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { aContext, aSubscription } from "../support/builders.js";

/**
 * THE FORCED PICK'S OWN LOTS ARE FILL-BASED AND COUNTED (review of #4642 slice 10; closes #4786).
 * A lot exists only once a scout buy was placed, holds the shares that buy took, is sold at most
 * for those shares, and is released only once its sell was placed. Each case below failed on the
 * commit the review read: there the scout owned NAMES, added before the buy was even submitted, and
 * sold the account's whole holding of each at the next rollover.
 */
const quote = (symbol: string) => ({ symbol, bid: 100, ask: 100, last: 100, asOf: "t" });
const DAY_1 = "2026-07-24T15:00:00Z";
const DAY_2 = "2026-07-27T15:00:00Z";
const DAY_2_LATER = "2026-07-27T17:00:00Z";
const DAY_3 = "2026-07-28T15:00:00Z";
const signal = (asOf: string) => aContext({ MSFT: { last: 100, sentiment: 0.9 } }, asOf);

/** One shared account and one durable scout store, so a "restart" is a new runner on both. */
function account() {
  const broker = new InMemoryBroker(1_000_000, [quote("MSFT")]);
  let state: ScoutState | undefined;
  const store = { load: () => state, save: (next: ScoutState) => (state = next) };
  const sells: string[] = [];
  const decisions: DecisionRecord[] = [];
  const held = async () =>
    (await broker.getPortfolio()).positions.map((p) => `${p.quantity} ${p.symbol}`);
  /** Another playbook on the same account buying the same name (Sauron's own rules, say). */
  const otherBuys = (quantity: number) =>
    broker.submit({ symbol: "MSFT", side: "buy", quantity, type: "market", reason: "SAURON" });
  function runner(
    opts: {
      readonly maxPicks?: number;
      readonly mode?: "observe" | "live";
      readonly blocked?: () => string | null;
      /** The broker's answer to the scout's own order — a partial fill, a rejection. */
      readonly answer?: (intent: OrderIntent) => Promise<OrderResult>;
    } = {},
  ) {
    const scoutBroker = {
      getPortfolio: () => broker.getPortfolio(),
      submit: (intent: OrderIntent) => {
        if (intent.side === "sell") sells.push(`${intent.quantity} ${intent.symbol}`);
        return opts.answer ? opts.answer(intent) : broker.submit(intent);
      },
    };
    return new LiveCycleRunner({
      traders: [
        {
          personaName: "Quiet",
          broker,
          trader: new AutonomousTrader({
            persona: { id: "sauron", name: "Sauron", thesis: "t", decide: () => [] },
            broker,
            risk: { maxPositionPct: 0.5 },
          }),
        },
      ],
      safety: new SafetyController(),
      blockedReason: opts.blocked ?? (() => null),
      scout: {
        maxPicks: opts.maxPicks ?? 1,
        broker: scoutBroker,
        universe: ["MSFT"],
        managedSymbols: new Set(),
        risk: { maxPositionPct: 0.5 },
        mode: opts.mode ?? "live",
        subscriptions: () => [aSubscription("sauron", "BETA-SCOUT")],
        hostId: "sauron",
      },
      scoutState: store,
      onDecision: (r) => decisions.push(r),
    });
  }
  return { broker, runner, held, otherBuys, sells, decisions, state: () => state };
}

describe("the forced pick's lots", () => {
  // The review's first repro: armed in observe (today's production), the pick was "owned" though
  // never bought; restarted disarmed and live, the rollover then sold another playbook's 500 shares
  // under the BETA-SCOUT label.
  it("never owns a pick it only observed, so it never sells another playbook's shares", async () => {
    const acct = account();
    await acct.runner({ mode: "observe" }).runCycle(signal(DAY_1));
    expect(acct.state()?.ownedLots).toEqual([]);

    const restarted = acct.runner({ maxPicks: 0 });
    await restarted.runCycle(signal(DAY_2));
    await acct.otherBuys(500);
    await restarted.runCycle(signal(DAY_3));
    expect(await acct.held()).toEqual(["500 MSFT"]);
    expect(acct.sells).toEqual([]);
  });

  it("never grows a name a day while it only observes", async () => {
    const acct = account();
    const observing = acct.runner({ mode: "observe" });
    for (const day of [DAY_1, DAY_2, DAY_3]) await observing.runCycle(signal(day));
    expect(acct.state()?.ownedLots).toEqual([]);
  });

  // The review's second repro, and #4786: a halt on the first cycle of a day released the lot
  // before its sell was placed, so the pick was never sold.
  it("a halted first cycle keeps yesterday's pick; it is sold exactly once when the halt lifts", async () => {
    const acct = account();
    let halted: string | null = null;
    const scout = acct.runner({ blocked: () => halted });
    await scout.runCycle(signal(DAY_1));
    expect(await acct.held()).toEqual(["49 MSFT"]);

    halted = "manual";
    await scout.runCycle(signal(DAY_2));
    expect(await acct.held()).toEqual(["49 MSFT"]);
    halted = null;
    await scout.runCycle(signal(DAY_2_LATER));
    await scout.runCycle(signal(DAY_3));
    expect(acct.sells).toEqual(["49 MSFT"]);
  });

  it("a partial fill: only the shares it filled are the scout's, and only they are sold", async () => {
    const acct = account();
    const partly = (intent: OrderIntent) =>
      intent.side === "buy"
        ? acct.broker
            .submit({ ...intent, quantity: 20 })
            .then((r): OrderResult => ({ ...r, intent, filledQuantity: 20 }))
        : acct.broker.submit(intent);
    const scout = acct.runner({ answer: partly });
    await scout.runCycle(signal(DAY_1));
    await acct.otherBuys(100);
    await scout.runCycle(signal(DAY_2));
    expect(acct.sells).toEqual(["20 MSFT"]);
    expect(await acct.held()).toEqual(["100 MSFT"]);
  });

  it("a pick the broker rejected is never owned", async () => {
    const acct = account();
    const rejects = (intent: OrderIntent): Promise<OrderResult> =>
      Promise.resolve({ intent, status: "rejected", reason: "test" });
    await acct.runner({ answer: rejects }).runCycle(signal(DAY_1));
    expect(acct.state()?.ownedLots).toEqual([]);
    await acct.otherBuys(500);
    await acct.runner().runCycle(signal(DAY_2));
    expect(acct.sells).toEqual([]);
  });

  it("drops a lot the account no longer holds — sold by something else — and sells nothing for it", async () => {
    const acct = account();
    const scout = acct.runner();
    await scout.runCycle(signal(DAY_1));
    await acct.broker.submit({
      symbol: "MSFT",
      side: "sell",
      quantity: 49,
      type: "market",
      reason: "SAURON",
    });
    await scout.runCycle(signal(DAY_2));
    expect(acct.sells).toEqual([]);
    expect(acct.state()?.ownedLots).toEqual([
      expect.objectContaining({ symbol: "MSFT", day: "2026-07-27" }),
    ]);
  });
});
