import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { Bot } from "../../src/bots/bot.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { DEFAULT_RISK_CONFIG, type RiskConfig } from "../../src/engine/guards.js";
import { type AuthoredPlaySpec, authoredRoster } from "../../src/playbooks/authored-play.js";
import { type AuthoredPlayRecord, runnableSpecs } from "../../src/playbooks/authored-play-draft.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { aContext, aSubscription } from "../support/builders.js";

/**
 * A PROMOTED PLAY TRADES THROUGH THE REAL GUARDS, ON ITS AUTHOR'S BOT ONLY (#5457 slice 3). A live
 * cycle — the real trader, the real `tradingRoster`, the real guards, an in-memory broker — with a
 * promoted play subscribed on the author's bot. The calendar is the checked-in one: NVDA reports
 * 2026-08-26 (confirmed), so a (20, 5) day window is long on 08-10 and flat from 08-21.
 */

const PLAY_ID = "U-futurist-nvda-run-up";
const spec = (over: Partial<AuthoredPlaySpec> = {}): AuthoredPlaySpec => ({
  slug: "nvda-run-up",
  authorAccountId: "futurist",
  authorDisplayName: "Ada",
  symbols: ["NVDA"],
  thesis: "long the pre-print drift, out before the dead final week",
  trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 5 },
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  ...over,
});
const record = (status: AuthoredPlayRecord["status"]): AuthoredPlayRecord => ({
  id: PLAY_ID,
  name: "NVDA run-up",
  status,
  spec: spec(),
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
});
const botOf = (id: string): Bot => ({
  persona: { id, name: id, thesis: "t", decide: () => [] },
  credentials: { apiKey: "k", apiSecret: "s" },
});

const IN_WINDOW = "2026-08-10T14:30:00Z";
const AFTER_EXIT = "2026-08-24T14:30:00Z";
const quiet = () => undefined;

function cycle(
  accountId: string,
  records: readonly AuthoredPlayRecord[],
  subscriptions: readonly PlaybookSubscription[],
  risk: RiskConfig = DEFAULT_RISK_CONFIG,
) {
  const bot = botOf(accountId);
  const build = (subs: readonly PlaybookSubscription[]) => {
    rstest.spyOn(console, "error").mockImplementation(quiet);
    rstest.spyOn(console, "log").mockImplementation(quiet);
    rstest.spyOn(console, "warn").mockImplementation(quiet);
    const authored = authoredRoster(runnableSpecs(records), accountId);
    return tradingRoster(resolveBotRoster(bot, [], subs, authored), risk);
  };
  const broker = new InMemoryBroker(100_000, [
    { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: IN_WINDOW },
  ]);
  const records_: DecisionRecord[] = [];
  let clock = 1_760_000_000_000;
  const first = build(subscriptions);
  const trader = new AutonomousTrader({
    persona: first.persona,
    broker,
    risk: first.risk,
    mode: "live",
    now: () => (clock += 3_600_000 * 24),
    onDecision: (r) => records_.push(r),
  });
  return {
    broker,
    trader,
    decisions: records_,
    swap: (subs: readonly PlaybookSubscription[]) => trader.swapRoster(build(subs)),
    run: (asOf: string) => trader.evaluate(aContext({ NVDA: { last: 100 } }, asOf)),
    held: async () =>
      (await broker.getPortfolio()).positions.find((p) => p.symbol === "NVDA")?.quantity ?? 0,
  };
}

const on = (over: Partial<PlaybookSubscription> = {}) => aSubscription("futurist", PLAY_ID, over);

describe("a promoted play, live, on its author's bot", () => {
  afterEach(() => {
    rstest.restoreAllMocks();
  });

  it("buys inside its window through the normal path: stamped with its id, sized under the 3% ceiling", async () => {
    const live = cycle("futurist", [record("promoted")], [on()]);
    const results = await live.run(IN_WINDOW);
    expect(results.some((r) => r.status !== "rejected")).toBe(true);
    const bought = await live.held();
    expect(bought).toBeGreaterThan(0);
    expect(bought * 100).toBeLessThanOrEqual(100_000 * 0.03);
    expect(JSON.stringify(live.decisions)).toContain(PLAY_ID);
  });

  it("the guards still apply: a tighter position cap clamps the same play's buy", async () => {
    const free = cycle("futurist", [record("promoted")], [on()]);
    await free.run(IN_WINDOW);
    const tight = cycle("futurist", [record("promoted")], [on()], {
      ...DEFAULT_RISK_CONFIG,
      maxPositionPct: 0.005,
    });
    await tight.run(IN_WINDOW);
    expect(await tight.held()).toBeLessThan(await free.held());
    expect((await tight.held()) * 100).toBeLessThanOrEqual(100_000 * 0.005);
  });

  it("a subscription is still required: promoted but unsubscribed opens nothing", async () => {
    const live = cycle("futurist", [record("promoted")], []);
    await live.run(IN_WINDOW);
    expect(await live.held()).toBe(0);
  });

  it("a draft or a shadow test with a subscription still opens nothing", async () => {
    for (const status of ["draft", "shadow"] as const) {
      const live = cycle("futurist", [record(status)], [on()]);
      await live.run(IN_WINDOW);
      expect(await live.held()).toBe(0);
    }
  });

  it("lands on the author's bot only: another bot subscribed to the same id trades nothing", async () => {
    const other = cycle("dragon", [record("promoted")], [aSubscription("dragon", PLAY_ID)]);
    await other.run(IN_WINDOW);
    expect(await other.held()).toBe(0);
  });
});

describe("pausing a promoted play (demote): entries stop, exits never do", () => {
  afterEach(() => {
    rstest.restoreAllMocks();
  });

  it("paused inside its window it opens nothing new", async () => {
    const live = cycle("futurist", [record("promoted")], [on({ enabled: false })]);
    await live.run(IN_WINDOW);
    expect(await live.held()).toBe(0);
  });

  it("paused while holding, it still sells when its window closes", async () => {
    const live = cycle("futurist", [record("promoted")], [on()]);
    await live.run(IN_WINDOW);
    const bought = await live.held();
    expect(bought).toBeGreaterThan(0);

    live.swap([on({ enabled: false })]);
    await live.run(IN_WINDOW); // still in the window: paused, it adds nothing and holds
    expect(await live.held()).toBe(bought);

    await live.run(AFTER_EXIT); // past its exit day: the exit runs although the play is paused
    expect(await live.held()).toBe(0);
  });
});
