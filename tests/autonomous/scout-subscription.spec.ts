import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { ScoutState } from "../../src/autonomous/bots-state-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { OrderIntent, PlaybookSubscription } from "../../src/domain/types.js";
import { buildScoutDeps } from "../../src/scripts/autonomous-live-wiring.js";
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

function armed(
  subscriptions: () => readonly PlaybookSubscription[],
  opts: {
    readonly maxPicks?: number;
    readonly restored?: ScoutState;
    readonly realizedPlForPlaybook?: (playbookId: string) => number;
    /** Runs before the broker answers each portfolio read — a Store change landing mid-scan. */
    readonly onPortfolioRead?: () => void;
  } = {},
) {
  const broker = new InMemoryBroker(1_000_000, [quote("MSFT"), quote("GOOG")]);
  const scoutBroker = {
    getPortfolio: () => {
      opts.onPortfolioRead?.();
      return broker.getPortfolio();
    },
    submit: (intent: OrderIntent) => broker.submit(intent),
  };
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
      maxPicks: opts.maxPicks ?? 1,
      broker: scoutBroker,
      universe: ["MSFT", "GOOG"],
      managedSymbols: new Set(),
      risk: { maxPositionPct: 0.5 },
      mode: "live",
      subscriptions,
      ...(opts.realizedPlForPlaybook ? { realizedPlForPlaybook: opts.realizedPlForPlaybook } : {}),
    },
    ...(opts.restored ? { scoutState: { load: () => opts.restored, save: () => undefined } } : {}),
    onDecision: (r) => decisions.push(r),
  });
  const holdings = async () =>
    (await broker.getPortfolio()).positions.map((p) => `${p.symbol}:${p.quantity}`);
  const held = async () => (await broker.getPortfolio()).positions.map((p) => p.symbol);
  return { runner, decisions, held, holdings, broker };
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

/** The review of slice 10 (findings 1, 4, 5, 7, 14): each case fails on the commit it reviewed. */
describe("review of slice 10: the forced daily pick", () => {
  // Finding 7: the subscription was read twice across the scan's broker await. A subscribe landing
  // in between let the record-only branch place a live buy the scout never tracked or sold.
  it("reads its subscription once per scan: a subscribe landing mid-scan places nothing until the next", async () => {
    const subscriptions: PlaybookSubscription[] = [];
    const { runner, decisions, held } = armed(() => subscriptions, {
      onPortfolioRead: () => {
        if (subscriptions.length === 0) subscriptions.push(scout());
      },
    });
    await runner.runCycle(signal(DAY_1));
    expect(await held()).toEqual([]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ guardedIntents: [], outcomes: [] });
    // The next scan sees the subscription whole: one pick, tracked, and sold the next day (whose
    // own pick, MSFT just exited, is GOOG).
    await runner.runCycle(signal(DAY_1_LATER));
    expect(await held()).toEqual(["MSFT"]);
    await runner.runCycle(signal(DAY_2));
    expect(await held()).toEqual(["GOOG"]);
  });

  // Finding 1: switching SKYNET_BETA_FORCING off stopped the scout entirely, so a pick it held was
  // never sold. Disarmed, it picks nothing new and still sells what it holds the next day.
  it("is built disarmed whenever a host account exists, so its exits keep running", () => {
    const broker = new InMemoryBroker(1_000);
    const opts = {
      universe: ["MSFT"],
      managedSymbols: new Set<string>(),
      risk: { maxPositionPct: 0.5 },
      mode: "live" as const,
      subscriptions: () => [],
    };
    expect(buildScoutDeps(0, broker, opts)).toMatchObject({ maxPicks: 0, broker });
    expect(buildScoutDeps(2, undefined, opts)).toBeUndefined();
  });

  it("disarmed, it still sells yesterday's pick and picks nothing new", async () => {
    const { runner, broker, held, decisions } = armed(() => [scout()], {
      maxPicks: 0,
      restored: {
        day: "2026-07-24",
        ranToday: true,
        firedOrganicallyToday: false,
        ownedSymbols: ["MSFT"],
      },
    });
    await broker.submit({
      symbol: "MSFT",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "pick",
    });
    await runner.runCycle(signal(DAY_1_LATER));
    expect(await held()).toEqual(["MSFT"]); // same day: held, as an armed scout would
    await runner.runCycle(signal(DAY_2));
    expect(await held()).toEqual([]);
    expect(
      decisions.flatMap((d) => d.outcomes.map((o) => `${o.intent.side} ${o.intent.symbol}`)),
    ).toEqual(["sell MSFT"]);
  });

  // Finding 5: with the subscription on, picks the guards refused (a cap below one share) left no
  // record at all and were rescanned every cycle in silence.
  it("records picks the guards refused once a day, and keeps looking", async () => {
    const { runner, decisions, held } = armed(() => [scout({ capitalAllocated: 50 })]);
    await runner.runCycle(signal(DAY_1));
    await runner.runCycle(signal(DAY_1_LATER));
    expect(await held()).toEqual([]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.refusals?.map((r) => r.reason)).toEqual(["subscription-budget"]);
  });

  // Finding 14: the buy carried the subscription's mode and the next day's sell "conservative".
  it("sells with the mode it bought with", async () => {
    const { runner, decisions } = armed(() => [scout({ mode: "aggressive" })]);
    await runner.runCycle(signal(DAY_1));
    await runner.runCycle(signal(DAY_2));
    expect(
      decisions.flatMap((d) => d.outcomes.map((o) => `${o.intent.side} ${o.intent.playbookMode}`)),
    ).toEqual(["buy aggressive", "sell aggressive", "buy aggressive"]);
  });

  // Finding 4: a compounding BETA-SCOUT cap never read what the scout realized.
  it("a compounding subscription's cap grows by what the scout realized", async () => {
    const capped = (realized: number) =>
      armed(() => [scout({ capitalAllocated: 1_000, compoundAllocation: true })], {
        realizedPlForPlaybook: (id) => (id === "BETA-SCOUT" ? realized : 0),
      });
    const flat = capped(0);
    await flat.runner.runCycle(signal(DAY_1));
    const grown = capped(2_000);
    await grown.runner.runCycle(signal(DAY_1));
    // At an ask of $100.05: $1,000 buys 9 shares; $1,000 + $2,000 realized buys 29.
    expect(await flat.holdings()).toEqual(["MSFT:9"]);
    expect(await grown.holdings()).toEqual(["MSFT:29"]);
  });
});
