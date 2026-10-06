import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  controlsPollGateHeaders,
  controlsPollReport,
  type PersonaGateVerdict,
} from "../../src/autonomous/controls-poll-wire.js";
import { controlsPollRosterHeaders } from "../../src/autonomous/house-roster-wire.js";
import type { Bot } from "../../src/bots/bot.js";
import type { OrderIntent, PlaybookSubscription } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { enabledPlaybooks, registeredPlaybooks } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { accountKind } from "../../src/server/account-kind.js";
import {
  createOwnRulesSeeder,
  createSubscriptionSeeder,
  ownRulesSeedMarkersPathFrom,
  pollSeedsFromEnv,
  seedMarkersPathFrom,
} from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import {
  EMPTY_SEED_MARKERS,
  SEEDED_FROM_OWN_RULES,
  seedOwnRules,
} from "../../src/subscriptions/subscription-seed.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * #4642 slice 9b (design on #4651) — the cutover. The dashboard subscribes the `sauron` bot account
 * to `SAURON` (his own rules as a playbook) once: standard, uncapped, enabled, no symbol filter, on a
 * marker of its own. After it his share orders carry `playbookId: "SAURON"`, so a cap or filter set
 * in the Store's Edit acts on his buys; nothing else he trades or holds changes. Pausing it takes the
 * label off again and his rules keep trading unlabelled until slice 10. An owner who unsubscribes or
 * pauses it stays that way.
 */

const AT = new Date("2026-10-06T14:00:00.000Z");
const LATER = new Date("2026-10-06T15:00:00.000Z");
const OWN_RULES = registeredPlaybooks();

/** The shape of Eric's live subscriptions on Sauron's account, CRWV-WHEEL and S1-NVDA (the amounts
 *  are stand-ins, varied on purpose: capped, filtered, another mode) — never to be touched. */
const sub = (
  playbookId: string,
  over: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
  ...over,
});
const ERICS_LIVE: readonly PlaybookSubscription[] = [
  sub("CRWV-WHEEL", { capitalAllocated: 25_000 }),
  sub("S1-NVDA", { mode: "aggressive", capitalAllocated: 40_000, symbols: ["NVDA"] }),
];
const OTHER_BOT: readonly PlaybookSubscription[] = [
  { ...sub("G1-GOOG"), accountId: "futurist", compoundAllocation: true },
];
const LIVE_STATE: SubscriptionsState = { sauron: ERICS_LIVE, futurist: OTHER_BOT };

const SEEDED_SAURON: PlaybookSubscription = {
  accountId: "sauron",
  playbookId: "SAURON",
  mode: "standard",
  enabled: true,
  createdAt: AT.toISOString(),
  updatedAt: AT.toISOString(),
};

const verdict = (id: string): PersonaGateVerdict => ({ id, ready: true, reason: "ready" });
/** An env-roster entry, for the specs that run both seeds on one store. */
const TACO = { playbookId: "TACO-DJT", mode: "standard" } as const;
/** What a store-level seed call reports writing. */
const NOTHING = { added: [], markedOnly: [] };
const ADDED_SAURON = { added: ["sauron"], markedOnly: [] };

describe("seeding Sauron's own rules as his subscription", () => {
  describe("the seed itself", () => {
    it("adds exactly one SAURON subscription — standard, uncapped, enabled, no symbols — and marks it", () => {
      const result = seedOwnRules(LIVE_STATE, EMPTY_SEED_MARKERS, ["sauron"], OWN_RULES, AT);

      expect(result.seeded).toEqual(["sauron"]);
      expect(result.state.sauron).toEqual([...ERICS_LIVE, SEEDED_SAURON]);
      const seeded = result.state.sauron?.[2];
      for (const absent of ["capitalAllocated", "symbols", "compoundAllocation"]) {
        expect(seeded && absent in seeded).toBe(false);
      }
      expect(result.markers).toEqual({
        sauron: {
          seededFrom: SEEDED_FROM_OWN_RULES,
          at: AT.toISOString(),
          playbookIds: ["SAURON"],
        },
      });
    });

    it("leaves every existing subscription exactly as it was — Eric's CRWV-WHEEL and S1-NVDA included", () => {
      const result = seedOwnRules(LIVE_STATE, EMPTY_SEED_MARKERS, ["sauron"], OWN_RULES, AT);

      expect(result.state.sauron?.slice(0, 2)).toEqual(ERICS_LIVE);
      result.state.sauron?.slice(0, 2).forEach((s, i) => {
        expect(s).toBe(ERICS_LIVE[i]);
      });
      expect(result.state.futurist).toBe(OTHER_BOT);
    });

    it("an account already holding SAURON — paused and capped — is marked, and nothing is added or changed", () => {
      const paused = [...ERICS_LIVE, sub("SAURON", { enabled: false, capitalAllocated: 5_000 })];
      const state = { sauron: paused };
      const result = seedOwnRules(state, EMPTY_SEED_MARKERS, ["sauron"], OWN_RULES, AT);

      expect(result.state).toBe(state);
      expect(result.added).toEqual([]);
      expect(result.markers.sauron).toEqual({
        seededFrom: SEEDED_FROM_OWN_RULES,
        at: AT.toISOString(),
        playbookIds: [],
      });
    });

    it("never seeds again once marked", () => {
      const once = seedOwnRules(LIVE_STATE, EMPTY_SEED_MARKERS, ["sauron"], OWN_RULES, AT);
      const unsubscribed = { ...once.state, sauron: ERICS_LIVE };
      const twice = seedOwnRules(unsubscribed, once.markers, ["sauron"], OWN_RULES, LATER);

      expect(twice).toEqual({ state: unsubscribed, markers: once.markers, seeded: [], added: [] });
    });

    it("a bot whose persona has no own-rules playbook is neither seeded nor marked", () => {
      const others = createDefaultPersonas()
        .map((p) => p.id)
        .filter((id) => id !== "sauron");
      const result = seedOwnRules(LIVE_STATE, EMPTY_SEED_MARKERS, others, OWN_RULES, AT);

      expect(others.length).toBeGreaterThan(0);
      expect(result).toEqual({
        state: LIVE_STATE,
        markers: EMPTY_SEED_MARKERS,
        seeded: [],
        added: [],
      });
    });

    it("a human account is never seeded, even reported, and holds what it held", () => {
      const human = { "human-eric": [{ ...sub("SAURON"), accountId: "human-eric" }] };
      const result = seedOwnRules(
        human,
        EMPTY_SEED_MARKERS,
        ["human-eric", "human-x"],
        OWN_RULES,
        AT,
      );

      expect(result).toEqual({ state: human, markers: EMPTY_SEED_MARKERS, seeded: [], added: [] });
    });

    it("today names exactly one account and playbook — sauron → SAURON — and that account is a bot", () => {
      const owners = OWN_RULES.flatMap((p) => (p.rulesOf ? [[p.rulesOf, p.id]] : []));

      // A new `rulesOf` playbook makes its persona's next deploy a cutover too: update this on purpose.
      expect(owners).toEqual([["sauron", "SAURON"]]);
      expect(accountKind("sauron", [])).toBe("bot");
    });
  });

  describe("on the dashboard's store", () => {
    let dir: string;
    let path: string;
    let store: SubscriptionStore;
    let seeder: ReturnType<typeof createOwnRulesSeeder>;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "own-rules-seed-"));
      path = join(dir, "playbook-subscriptions.json");
      store = new SubscriptionStore(path);
      store.replace(LIVE_STATE);
      seeder = createOwnRulesSeeder(store, ownRulesSeedMarkersPathFrom(path), OWN_RULES);
    });

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it("seeds on the first poll that reports sauron, and is a no-op on every poll after", () => {
      expect(seeder.seed(["futurist", "sauron"], AT)).toEqual(ADDED_SAURON);
      const afterFirst = readFileSync(path, "utf8");

      expect(seeder.seed(["futurist", "sauron"], LATER)).toEqual(NOTHING);
      expect(readFileSync(path, "utf8")).toBe(afterFirst);
      expect(store.load()).toEqual({ ...LIVE_STATE, sauron: [...ERICS_LIVE, SEEDED_SAURON] });
    });

    it("never re-seeds after the owner unsubscribes", () => {
      seeder.seed(["sauron"], AT);
      store.unsubscribe("sauron", "SAURON");

      expect(seeder.seed(["sauron"], LATER)).toEqual(NOTHING);
      expect(store.load().sauron).toEqual(ERICS_LIVE);
    });

    it("never resumes, re-moves or duplicates it after the owner pauses it", () => {
      seeder.seed(["sauron"], AT);
      store.setEnabled("sauron", "SAURON", false, LATER);
      const paused = store.load();

      expect(seeder.seed(["sauron"], LATER)).toEqual(NOTHING);
      expect(store.load()).toEqual(paused);
      expect(paused.sauron?.filter((s) => s.playbookId === "SAURON")).toEqual([
        { ...SEEDED_SAURON, enabled: false, updatedAt: LATER.toISOString() },
      ]);
    });

    it("keeps its own marker file, so the env roster's marker on sauron never stops it", () => {
      const envRoster = createSubscriptionSeeder(store, seedMarkersPathFrom(path));
      const envSeeded = envRoster.seed({ accounts: ["sauron"], roster: [TACO] }, AT);
      expect(envSeeded).toEqual(ADDED_SAURON);

      expect(seeder.seed(["sauron"], LATER)).toEqual(ADDED_SAURON);
      expect(store.load().sauron?.map((s) => s.playbookId)).toEqual([
        "TACO-DJT",
        "CRWV-WHEEL",
        "S1-NVDA",
        "SAURON",
      ]);
      expect(ownRulesSeedMarkersPathFrom(path)).toBe(join(dir, "playbook-own-rules-seeds.json"));
      expect(JSON.parse(readFileSync(seedMarkersPathFrom(path), "utf8")).sauron.seededFrom).toBe(
        "SKYNET_PLAYBOOKS",
      );
      expect(
        JSON.parse(readFileSync(ownRulesSeedMarkersPathFrom(path), "utf8")).sauron.seededFrom,
      ).toBe(SEEDED_FROM_OWN_RULES);
    });

    it("writes nothing at all for a poll that reports no own-rules bot", () => {
      const before = readFileSync(path, "utf8");

      expect(seeder.seed(["futurist", "day-trader"], AT)).toEqual(NOTHING);
      expect(readFileSync(path, "utf8")).toBe(before);
      expect(existsSync(ownRulesSeedMarkersPathFrom(path))).toBe(false);
    });
  });

  describe("never writes over a file it could not read", () => {
    let dir: string;
    let path: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "own-rules-seed-guard-"));
      path = join(dir, "playbook-subscriptions.json");
    });

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    /** Both seeds share the one write path; each, with the marker file it keeps. */
    const bothSeeds = (store: SubscriptionStore) => {
      const ownRules = ownRulesSeedMarkersPathFrom(path);
      const envRoster = seedMarkersPathFrom(path);
      return [
        {
          seed: () => createOwnRulesSeeder(store, ownRules, OWN_RULES).seed(["sauron"], AT),
          markersPath: ownRules,
        },
        {
          seed: () =>
            createSubscriptionSeeder(store, envRoster).seed(
              { accounts: ["sauron"], roster: [TACO] },
              AT,
            ),
          markersPath: envRoster,
        },
      ];
    };

    it("an unreadable subscriptions file is left byte for byte, and no marker is written", () => {
      const torn = '{"sauron": [ {"playbookId": "CRWV-WHEEL"';
      for (const { seed, markersPath } of bothSeeds(new SubscriptionStore(path))) {
        writeFileSync(path, torn, "utf8");

        expect(seed()).toEqual(NOTHING);
        expect(readFileSync(path, "utf8")).toBe(torn);
        expect(existsSync(markersPath)).toBe(false);
      }
    });

    it("a subscriptions file with one record the parser drops is left byte for byte, and no marker is written", () => {
      const broken = [
        { ...sub("S1-NVDA"), capitalAllocated: "50000" },
        { ...sub("S1-NVDA"), mode: "custom" },
        { ...sub("S1-NVDA"), addedByANewerBuild: true },
      ];
      for (const record of broken) {
        const file = `${JSON.stringify({ sauron: [sub("CRWV-WHEEL"), record] }, null, 2)}\n`;
        const errors: string[] = [];
        const store = new SubscriptionStore(path, (message) => errors.push(message));
        for (const { seed, markersPath } of bothSeeds(store)) {
          writeFileSync(path, file, "utf8");

          expect(seed()).toEqual(NOTHING);
          expect(readFileSync(path, "utf8")).toBe(file);
          expect(existsSync(markersPath)).toBe(false);
        }
        expect(errors.at(-1)).toContain("left untouched");
      }
    });

    it("a mark-only pass — the account already holds it all — writes the marker and leaves the subscriptions file byte for byte", () => {
      const held = [...ERICS_LIVE, sub("SAURON", { enabled: false }), sub("TACO-DJT")];
      // Compact on purpose: any rewrite by the store (two-space indent) would change the bytes.
      const file = JSON.stringify({ sauron: held });
      for (const { seed, markersPath } of bothSeeds(new SubscriptionStore(path))) {
        writeFileSync(path, file, "utf8");

        expect(seed()).toEqual({ added: [], markedOnly: ["sauron"] });
        expect(readFileSync(path, "utf8")).toBe(file);
        expect(JSON.parse(readFileSync(markersPath, "utf8")).sauron.playbookIds).toEqual([]);
      }
    });

    it("an unreadable marker file never re-seeds what the owner unsubscribed", () => {
      const store = new SubscriptionStore(path);
      store.replace(LIVE_STATE);
      for (const { seed, markersPath } of bothSeeds(store)) {
        writeFileSync(markersPath, "not json", "utf8");

        expect(seed()).toEqual(NOTHING);
        expect(store.load()).toEqual(LIVE_STATE);
      }
    });
  });

  describe("on the /controls poll — what the bots app already reports, nothing new on the wire", () => {
    let dir: string;
    let path: string;
    let store: SubscriptionStore;
    let seed: ReturnType<typeof pollSeedsFromEnv>;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "own-rules-poll-"));
      path = join(dir, "playbook-subscriptions.json");
      store = new SubscriptionStore(path);
      store.replace(LIVE_STATE);
      // The dashboard's own wiring, pointed at a temp file the way fly.toml points it at /data.
      seed = pollSeedsFromEnv({ SKYNET_SUBSCRIPTIONS_FILE: path });
    });

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    /** The headers a bots build sends today, read the way the dashboard's listener reads them. */
    const poll = (verdicts: readonly PersonaGateVerdict[], envRoster?: string) =>
      controlsPollReport({
        ...controlsPollGateHeaders(verdicts),
        ...(envRoster
          ? controlsPollRosterHeaders({
              accounts: verdicts.map((v) => v.id),
              roster: enabledPlaybooks({ SKYNET_PLAYBOOKS: envRoster }).enabled.map((e) => ({
                playbookId: e.playbook.id,
                mode: e.mode,
              })),
            })
          : {}),
      });

    it("seeds sauron from the gate verdicts every bots build already sends, and no other bot", () => {
      const lines = seed(poll([verdict("futurist"), verdict("sauron"), verdict("day-trader")]), AT);

      expect(store.load()).toEqual({ ...LIVE_STATE, sauron: [...ERICS_LIVE, SEEDED_SAURON] });
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("sauron");
    });

    it("a SAURON the env roster names keeps the env roster's mode — that seed runs first", () => {
      const lines = seed(poll([verdict("sauron")], "SAURON:aggressive"), AT);

      expect(lines).toEqual([
        "[subscriptions] seeded from the bots app's SKYNET_PLAYBOOKS roster (uncapped): sauron",
        "[subscriptions] marked for the own-rules seed, nothing added (already held): sauron",
      ]);

      expect(store.load().sauron?.filter((s) => s.playbookId === "SAURON")).toEqual([
        { ...SEEDED_SAURON, mode: "aggressive" },
      ]);
      expect(
        JSON.parse(readFileSync(ownRulesSeedMarkersPathFrom(path), "utf8")).sauron.playbookIds,
      ).toEqual([]);
    });

    it("one poll runs both seeds, each on its own marker: the env roster's never stops this one", () => {
      const lines = seed(poll([verdict("sauron")], "TACO-DJT"), AT);

      expect(store.load().sauron?.map((s) => s.playbookId)).toEqual([
        "TACO-DJT",
        "CRWV-WHEEL",
        "S1-NVDA",
        "SAURON",
      ]);
      expect(lines).toHaveLength(2);
      expect(seed(poll([verdict("sauron")], "TACO-DJT"), LATER)).toEqual([]);
    });

    it("a poll with no gate verdicts — an older bots build, no live bots — seeds nothing", () => {
      expect(seed(controlsPollReport({}), AT)).toEqual([]);
      expect(store.load()).toEqual(LIVE_STATE);
    });
  });

  describe("after the seed, on Sauron's live roster", () => {
    const bot: Bot = { persona: new SauronPersona(), credentials: { apiKey: "k", apiSecret: "s" } };
    /** Panic turning up on four names: S1-NVDA's NVDA, the wheel's CRWV, AAPL, and GLD (outside
     *  the bots' universe — he trades whatever is quoted, and the seed must not narrow that). */
    const panic = aContext({
      NVDA: { sentiment: -0.9, momentum: 0.02 },
      CRWV: { sentiment: -0.9, momentum: 0.02 },
      AAPL: { sentiment: -0.9, momentum: 0.02 },
      GLD: { sentiment: -0.8, momentum: 0.01 },
    });
    const intentsUnder = (subs: readonly PlaybookSubscription[]): OrderIntent[] =>
      tradingRoster(resolveBotRoster(bot, [], subs), DEFAULT_RISK_CONFIG).persona.decide(
        panic,
        aPortfolio(),
      );
    const seededSubs =
      seedOwnRules(LIVE_STATE, EMPTY_SEED_MARKERS, ["sauron"], OWN_RULES, AT).state.sauron ?? [];

    it("his resolved roster holds SAURON beside the two live playbooks", () => {
      const roster = resolveBotRoster(bot, [], seededSubs);

      expect(roster.enabled.map((e) => `${e.playbook.id}:${e.mode}`)).toEqual([
        "CRWV-WHEEL:standard",
        "S1-NVDA:aggressive",
        "SAURON:standard",
      ]);
    });

    it("his reflexes are stamped SAURON:standard — the same orders as before, now labelled", () => {
      const before = intentsUnder(ERICS_LIVE).filter((i) => i.playbookId === undefined);
      const after = intentsUnder(seededSubs);

      expect(before.map((i) => i.symbol).sort()).toEqual(["AAPL", "GLD"]);
      expect(after.filter((i) => i.playbookId === "SAURON")).toEqual(
        before.map((i) => ({ ...i, playbookId: "SAURON", playbookMode: "standard" })),
      );
      expect(after.filter((i) => i.playbookId === undefined)).toEqual([]);
    });

    it("pausing the seeded subscription in the Store takes the label off — his orders are exactly the pre-seed ones", () => {
      const paused = seededSubs.map((s) =>
        s.playbookId === "SAURON" ? { ...s, enabled: false } : s,
      );

      expect(intentsUnder(paused)).toEqual(intentsUnder(ERICS_LIVE));
    });

    it("the guards size his labelled buys exactly as they sized them unlabelled — uncapped means no new limit", () => {
      const sized = (subs: readonly PlaybookSubscription[]) => {
        const { persona, risk } = tradingRoster(resolveBotRoster(bot, [], subs), {
          ...DEFAULT_RISK_CONFIG,
          maxPositionPct: 1,
        });
        const portfolio = aPortfolio({ cash: 1_000_000 });
        return applyGuardsWithVerdicts(persona.decide(panic, portfolio), portfolio, panic, risk)
          .approved;
      };
      const before = sized(ERICS_LIVE).filter((i) => i.playbookId === undefined);
      const after = sized(seededSubs).filter((i) => i.playbookId === "SAURON");

      expect(before.map((i) => `${i.side} ${i.symbol}`).sort()).toEqual(["buy AAPL", "buy GLD"]);
      expect(after).toEqual(
        before.map((i) => ({ ...i, playbookId: "SAURON", playbookMode: "standard" })),
      );
    });
  });
});
