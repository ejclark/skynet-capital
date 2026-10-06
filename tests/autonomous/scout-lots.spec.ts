import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { ScoutState } from "../../src/autonomous/bots-state-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import { settleLots } from "../../src/autonomous/scout-lots.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
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
  const warnings: string[] = [];
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
      /** How an order the scout left working ended (the settle loop's record). */
      readonly settlementOf?: (orderId: string) => OrderSettlement | undefined;
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
        ...(opts.settlementOf ? { settlementOf: opts.settlementOf } : {}),
      },
      scoutState: store,
      onDecision: (r) => decisions.push(r),
      onScoutWarn: (line) => warnings.push(line),
    });
  }
  return { broker, runner, held, otherBuys, sells, decisions, warnings, state: () => state };
}

/** The scout's buys left `working` (a pick staged for the open), each placing `fills` shares now —
 *  what the broker will later say it filled. Sells go straight to the account. */
function leftWorking(acct: ReturnType<typeof account>, fills: number, ids = true) {
  let n = 0;
  return async (intent: OrderIntent): Promise<OrderResult> => {
    if (intent.side === "sell") return acct.broker.submit(intent);
    if (fills > 0) await acct.broker.submit({ ...intent, quantity: fills });
    n += 1;
    return { intent, status: "working", ...(ids ? { orderId: `o-${n}` } : {}) };
  };
}

const ended = (orderId: string, filledQuantity: number): OrderSettlement => ({
  orderId,
  status: filledQuantity > 0 ? "filled" : "unfilled",
  filledQuantity,
  settledAt: "2026-07-27T13:31:00Z",
});

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

  // The review's third repro: a buy recorded `working` at its ordered quantity (49) that never
  // filled left a lot of 49, and the next session sold 49 of another playbook's 100 under it.
  describe("a lot from a buy left working is never sold on the ordered quantity", () => {
    it("settled with nothing filled: the lot is dropped, and the next session sells nothing", async () => {
      const acct = account();
      const settled = new Map<string, OrderSettlement>();
      const settlementOf = (id: string) => settled.get(id);
      await acct.runner({ answer: leftWorking(acct, 0), settlementOf }).runCycle(signal(DAY_1));
      expect(acct.state()?.ownedLots).toEqual([
        expect.objectContaining({ symbol: "MSFT", quantity: 49, workingOrderId: "o-1" }),
      ]);

      settled.set("o-1", ended("o-1", 0));
      await acct.otherBuys(100);
      await acct.runner({ maxPicks: 0, settlementOf }).runCycle(signal(DAY_2));
      expect(acct.sells).toEqual([]);
      expect(await acct.held()).toEqual(["100 MSFT"]);
      expect(acct.state()?.ownedLots).toEqual([]);
    });

    it("settled with 7 filled: the lot becomes 7, and only those 7 are sold", async () => {
      const acct = account();
      const settled = new Map<string, OrderSettlement>();
      const settlementOf = (id: string) => settled.get(id);
      await acct.runner({ answer: leftWorking(acct, 7), settlementOf }).runCycle(signal(DAY_1));

      settled.set("o-1", ended("o-1", 7));
      await acct.otherBuys(100);
      await acct.runner({ maxPicks: 0, settlementOf }).runCycle(signal(DAY_2));
      expect(acct.sells).toEqual(["7 MSFT"]);
      expect(await acct.held()).toEqual(["100 MSFT"]);
    });

    it("not settled yet: nothing is sold that cycle; it sells once the settlement lands, the same session", async () => {
      const acct = account();
      const settled = new Map<string, OrderSettlement>();
      const settlementOf = (id: string) => settled.get(id);
      await acct.runner({ answer: leftWorking(acct, 7), settlementOf }).runCycle(signal(DAY_1));
      await acct.otherBuys(100);

      const scout = acct.runner({ maxPicks: 0, settlementOf });
      await scout.runCycle(signal(DAY_2));
      expect(acct.sells).toEqual([]);
      expect(acct.state()?.ownedLots).toEqual([
        expect.objectContaining({ quantity: 49, workingOrderId: "o-1" }),
      ]);

      settled.set("o-1", ended("o-1", 7));
      await scout.runCycle(signal(DAY_2_LATER));
      await scout.runCycle(signal(DAY_3));
      expect(acct.sells).toEqual(["7 MSFT"]);
      expect(await acct.held()).toEqual(["100 MSFT"]);
    });

    it("with no settlement source it waits — never sold on a guess", async () => {
      const acct = account();
      await acct.runner({ answer: leftWorking(acct, 7) }).runCycle(signal(DAY_1));
      await acct.otherBuys(100);
      await acct.runner({ maxPicks: 0 }).runCycle(signal(DAY_2));
      expect(acct.sells).toEqual([]);
      expect(await acct.held()).toEqual(["107 MSFT"]);
    });

    it("left working with no order id: no lot, and the operator is told it will not be sold", async () => {
      const acct = account();
      await acct.runner({ answer: leftWorking(acct, 7, false) }).runCycle(signal(DAY_1));
      expect(acct.state()?.ownedLots).toEqual([]);
      expect(acct.warnings).toEqual([
        expect.stringContaining("MSFT pick accepted with no order id"),
      ]);
      await acct.otherBuys(100);
      await acct.runner({ maxPicks: 0 }).runCycle(signal(DAY_2));
      expect(acct.sells).toEqual([]);
    });

    it("a settlement read that fails keeps the lot as it is, for the next cycle", () => {
      const lot = { symbol: "MSFT", quantity: 49, day: "2026-07-24", workingOrderId: "o-1" };
      const failing = () => {
        throw new Error("db locked");
      };
      expect(settleLots([lot], failing)).toEqual({ lots: [lot], changed: false });
    });
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
