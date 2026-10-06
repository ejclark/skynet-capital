import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CONTROLS_BOT_ROSTER_HEADER,
  controlsPollRosterHeaders,
  type HouseRosterReport,
  houseRosterReport,
  parseControlsPollRoster,
} from "../../src/autonomous/house-roster-wire.js";
import type { Bot } from "../../src/bots/bot.js";
import type { OrderIntent, PlaybookSubscription } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts } from "../../src/engine/guards.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { enabledPlaybooks } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import {
  createSubscriptionSeeder,
  seedMarkersPathFrom,
} from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import {
  EMPTY_SEED_MARKERS,
  SEEDED_FROM_ENV_ROSTER,
  seedFromHouseRoster,
} from "../../src/subscriptions/subscription-seed.js";
import { parseSubscriptionsState } from "../../src/subscriptions/subscription-state.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * #4535 slice 1b: each house bot's subscriptions are seeded once from the bots app's
 * `SKYNET_PLAYBOOKS` roster — uncapped — so the env roster can retire later with no bot's
 * effective roster or sizing changing. These specs are that promise, stated as behaviour.
 */

const AT = new Date("2026-10-03T14:00:00.000Z");
const LATER = new Date("2026-10-03T15:00:00.000Z");

const ENV = { SKYNET_PLAYBOOKS: "S1-NVDA:aggressive,G1-GOOG,TACO-DJT:conservative" };
const house = enabledPlaybooks(ENV).enabled;

const persona = createDefaultPersonas()[0];
if (!persona) throw new Error("no default persona");
const bot = { persona, credentials: { apiKey: "k", apiSecret: "s" } } as unknown as Bot;
const BOT = persona.id;

const report: HouseRosterReport = houseRosterReport([BOT], house);

const ownSub = (over: Partial<PlaybookSubscription>): PlaybookSubscription => ({
  accountId: BOT,
  playbookId: "G1-GOOG",
  mode: "standard",
  capitalAllocated: 2_000,
  enabled: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

/** What a bot actually trades: ids and modes, in order. */
const effective = (subs: readonly PlaybookSubscription[]) =>
  resolveBotRoster(bot, house, subs).enabled.map((e) => `${e.playbook.id}:${e.mode}`);

describe("seeding a house bot's subscriptions from the env roster", () => {
  describe("the effective roster per bot", () => {
    it("is unchanged for a bot with no subscriptions of its own", () => {
      const before = effective([]);
      const after = effective(
        seedFromHouseRoster({}, EMPTY_SEED_MARKERS, report, AT).state[BOT] ?? [],
      );

      expect(after).toEqual(before);
      expect(after).toEqual(["S1-NVDA:aggressive", "G1-GOOG:standard", "TACO-DJT:conservative"]);
    });

    it("is unchanged, order included, when the owner already subscribes to a house playbook", () => {
      const own = [ownSub({ playbookId: "S1-NVDA", mode: "conservative" })];
      const before = effective(own);
      const seeded = seedFromHouseRoster({ [BOT]: own }, EMPTY_SEED_MARKERS, report, AT).state;

      expect(effective(seeded[BOT] ?? [])).toEqual(before);
    });

    it("is unchanged when the owner has PAUSED a house playbook — the pause is never overwritten", () => {
      const own = [ownSub({ playbookId: "TACO-DJT", enabled: false })];
      const before = effective(own);
      const seeded = seedFromHouseRoster({ [BOT]: own }, EMPTY_SEED_MARKERS, report, AT).state;

      expect(effective(seeded[BOT] ?? [])).toEqual(before);
      expect(seeded[BOT]?.find((s) => s.playbookId === "TACO-DJT")).toEqual(own[0]);
    });

    it("seeds every reported bot account, and no other", () => {
      const both = houseRosterReport([BOT, "other-bot"], house);
      const result = seedFromHouseRoster({ human: [] }, EMPTY_SEED_MARKERS, both, AT);

      expect(Object.keys(result.state).sort()).toEqual([BOT, "human", "other-bot"].sort());
      expect(result.state.human).toEqual([]);
      expect(result.seeded).toEqual([BOT, "other-bot"]);
    });
  });

  describe("a seeded subscription", () => {
    it("is uncapped, enabled, in the env roster's mode, and marked as seeded from it", () => {
      const result = seedFromHouseRoster({}, EMPTY_SEED_MARKERS, report, AT);
      const nvda = result.state[BOT]?.find((s) => s.playbookId === "S1-NVDA");

      expect(nvda).toEqual({
        accountId: BOT,
        playbookId: "S1-NVDA",
        mode: "aggressive",
        enabled: true,
        createdAt: AT.toISOString(),
        updatedAt: AT.toISOString(),
      });
      expect(nvda && "capitalAllocated" in nvda).toBe(false);
      expect(result.markers[BOT]).toEqual({
        seededFrom: SEEDED_FROM_ENV_ROSTER,
        at: AT.toISOString(),
        playbookIds: ["S1-NVDA", "G1-GOOG", "TACO-DJT"],
      });
    });

    it("survives a write and a re-read of the store — the parser accepts an absent capitalAllocated", () => {
      const seeded = seedFromHouseRoster({}, EMPTY_SEED_MARKERS, report, AT).state;
      const reread = parseSubscriptionsState(JSON.parse(JSON.stringify(seeded)));

      expect(reread).toEqual(seeded);
    });

    it("still refuses a capitalAllocated that is present but not a finite number", () => {
      const raw = { [BOT]: [{ ...ownSub({}), capitalAllocated: "lots" }] };

      expect(parseSubscriptionsState(raw)).toEqual({});
    });
  });

  describe("uncapped sizing", () => {
    const intent: OrderIntent = {
      symbol: "NVDA",
      side: "buy",
      quantity: 10_000,
      type: "market",
      reason: "test",
      playbookId: "S1-NVDA",
      playbookMode: "aggressive",
    };
    const baseRisk = { maxPositionPct: 0.03 };
    const context = aContext({ NVDA: { last: 100 } });
    const portfolio = aPortfolio({ cash: 1_000_000 });
    const sized = (subs: readonly PlaybookSubscription[]) =>
      applyGuardsWithVerdicts(
        [intent],
        portfolio,
        context,
        tradingRoster(resolveBotRoster(bot, house, subs), baseRisk).risk,
      );

    it("equals today's env-roster sizing exactly", () => {
      const before = sized([]);
      const after = sized(seedFromHouseRoster({}, EMPTY_SEED_MARKERS, report, AT).state[BOT] ?? []);

      expect(after).toEqual(before);
      expect(after.approved[0]?.quantity).toBeGreaterThan(0);
    });

    it("is genuinely uncapped — a capped subscription to the same playbook would clamp harder", () => {
      const capped = sized([ownSub({ playbookId: "S1-NVDA", capitalAllocated: 500 })]);

      expect(capped.approved[0]?.quantity).toBeLessThanOrEqual(5); // $500 at an ask just over $100
      expect(sized([]).approved[0]?.quantity).toBeGreaterThan(5);
    });
  });

  describe("idempotence", () => {
    it("seeding twice is seeding once", () => {
      const once = seedFromHouseRoster({}, EMPTY_SEED_MARKERS, report, AT);
      const twice = seedFromHouseRoster(once.state, once.markers, report, LATER);

      expect(twice.state).toEqual(once.state);
      expect(twice.markers).toEqual(once.markers);
      expect(twice.seeded).toEqual([]);
    });

    it("an empty roster seeds nothing and marks nothing, so a later real roster still seeds", () => {
      const empty = seedFromHouseRoster(
        {},
        EMPTY_SEED_MARKERS,
        { accounts: [BOT], roster: [] },
        AT,
      );

      expect(empty).toEqual({ state: {}, markers: EMPTY_SEED_MARKERS, seeded: [], added: [] });
    });
  });

  describe("on the dashboard's store", () => {
    let dir: string;
    let store: SubscriptionStore;
    let seeder: ReturnType<typeof createSubscriptionSeeder>;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "subscription-seed-"));
      const path = join(dir, "playbook-subscriptions.json");
      store = new SubscriptionStore(path);
      seeder = createSubscriptionSeeder(store, seedMarkersPathFrom(path));
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("seeds on the first report and is a no-op on every poll after", () => {
      expect(seeder.seed(report, AT)).toEqual({ added: [BOT], markedOnly: [] });
      const afterFirst = store.load();

      expect(seeder.seed(report, LATER)).toEqual({ added: [], markedOnly: [] });
      expect(store.load()).toEqual(afterFirst);
    });

    it("never re-seeds a playbook the owner unsubscribed from", () => {
      seeder.seed(report, AT);
      store.unsubscribe(BOT, "S1-NVDA");

      expect(seeder.seed(report, LATER)).toEqual({ added: [], markedOnly: [] });
      expect(store.load()[BOT]?.map((s) => s.playbookId)).toEqual(["G1-GOOG", "TACO-DJT"]);
    });

    it("never re-seeds an account the owner emptied entirely", () => {
      seeder.seed(report, AT);
      for (const entry of house) store.unsubscribe(BOT, entry.playbook.id);

      expect(seeder.seed(report, LATER)).toEqual({ added: [], markedOnly: [] });
      expect(store.load()[BOT]).toBeUndefined();
    });

    it("keeps its markers beside the subscriptions file, never in it", () => {
      seeder.seed(report, AT);

      expect(seedMarkersPathFrom(join(dir, "playbook-subscriptions.json"))).toBe(
        join(dir, "playbook-subscription-seeds.json"),
      );
      expect(Object.keys(store.load())).toEqual([BOT]);
    });
  });
});

describe("the house-roster report on the /controls poll", () => {
  it("round-trips through the poll header", () => {
    const headers = controlsPollRosterHeaders(report);

    expect(parseControlsPollRoster(headers)).toEqual(report);
  });

  it("sends no header when there is nothing to seed", () => {
    expect(controlsPollRosterHeaders(undefined)).toEqual({});
    expect(controlsPollRosterHeaders(houseRosterReport([BOT], []))).toEqual({});
    expect(controlsPollRosterHeaders(houseRosterReport([], house))).toEqual({});
  });

  it.each([
    ["not base64 JSON", "%%%"],
    ["an unknown mode", { accounts: [BOT], roster: [{ playbookId: "S1-NVDA", mode: "yolo" }] }],
    [
      "a blank account id",
      { accounts: [""], roster: [{ playbookId: "S1-NVDA", mode: "standard" }] },
    ],
    ["an empty roster", { accounts: [BOT], roster: [] }],
  ])("reads %s as not reported, never as a partial roster", (_label, payload) => {
    const raw =
      typeof payload === "string"
        ? payload
        : Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

    expect(parseControlsPollRoster({ [CONTROLS_BOT_ROSTER_HEADER]: raw })).toBeUndefined();
  });
});
