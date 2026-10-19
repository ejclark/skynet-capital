import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type ControlsState,
  effectiveBetaPicks,
  effectiveBetaStage,
  effectiveHardcoreIds,
  MAX_BETA_PICKS,
} from "../../src/autonomous/bot-controls.js";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import {
  CONTROLS_BOT_ROSTER_HEADER,
  controlsPollRosterHeaders,
  type EnvBotSettings,
  type HouseRosterReport,
  houseRosterReport,
  parseControlsPollRoster,
} from "../../src/autonomous/house-roster-wire.js";
import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import { hasHardcoreBuild } from "../../src/personas/registry.js";
import { parseBetaForcing } from "../../src/playbooks/beta-scout.js";
import {
  COND_SCOUT_ID,
  parseCondScoutUniverse,
  resolveCondScoutUniverse,
} from "../../src/playbooks/cond-scout.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { botSettingsView } from "../../src/server/bot-settings-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  createEnvSettingsSeeder,
  ENV_SEED_AUTHOR,
  envSettingsMarkersPathFrom,
  seedEnvSettings,
} from "../../src/server/env-settings-seed.js";
import { SettingsChangeLog } from "../../src/server/settings-change-log.js";
import {
  condScoutSeedMarkersPathFrom,
  pollSeedsFromEnv,
} from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import {
  EMPTY_SEED_MARKERS,
  SEEDED_FROM_COND_SCOUT_UNIVERSE,
  seedCondScout,
} from "../../src/subscriptions/subscription-seed.js";

/**
 * #4535 slice 4c, first half: before the bots stop reading `SKYNET_HARDCORE_BOTS`,
 * `SKYNET_BETA_FORCING` and `SKYNET_COND_SCOUT_UNIVERSE`, the app copies what each says into the
 * bots' own stored settings, once — so that with the env gone, every bot does exactly what it does
 * today. These specs are that promise, stated as behaviour.
 */

const AT = new Date("2026-10-19T09:00:00.000Z");
const LATER = new Date("2026-10-19T09:30:00.000Z");
const HOST = "sauron"; // has a hardcore build
const OTHER = "banker"; // has none

/** What the bots app reports for an env, the way `run-autonomous.ts` builds it. */
function envSettings(env: { hardcore?: string; beta?: string; scout?: string }): EnvBotSettings {
  const beta = parseBetaForcing(env.beta);
  return {
    hardcore: (env.hardcore ?? "").split(",").filter((id) => id && hasHardcoreBuild(id)),
    betaPicks: beta.maxPicks,
    betaStage: beta.stageAfterClose,
    condScoutUniverse: parseCondScoutUniverse(env.scout),
  };
}

const PROD = { hardcore: "sauron", beta: "2+stage", scout: "NVDA,TSLA" };
const report = (settings?: EnvBotSettings): HouseRosterReport =>
  houseRosterReport([HOST, OTHER], [], settings);

const empty: ControlsState = { bots: {} };

describe("the bots app's env settings on the /controls poll", () => {
  it("round-trip through the poll header beside the accounts", () => {
    const sent = report(envSettings(PROD));

    expect(parseControlsPollRoster(controlsPollRosterHeaders(sent))).toEqual(sent);
  });

  it("are absent from a bots build that predates them, and the report still reads", () => {
    const headers = controlsPollRosterHeaders(houseRosterReport([HOST], []));

    expect(controlsPollReport(headers).houseRoster).toEqual({ accounts: [HOST], roster: [] });
  });

  it.each([
    ["a fractional pick count", { betaPicks: 1.5 }],
    ["a negative pick count", { betaPicks: -1 }],
    ["a staging flag that is not a boolean", { betaStage: "yes" }],
    ["a blank hardcore id", { hardcore: [""] }],
    ["a scout name that is not a ticker-sized string", { condScoutUniverse: ["NOT-A-TICKER"] }],
  ])("drop on their own when they carry %s — the accounts still read", (_label, bad) => {
    const payload = { accounts: [HOST], roster: [], settings: { ...envSettings(PROD), ...bad } };
    const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

    expect(parseControlsPollRoster({ [CONTROLS_BOT_ROSTER_HEADER]: raw })).toEqual({
      accounts: [HOST],
      roster: [],
    });
  });
});

describe("copying hardcore, the forced-pick count and staging into stored settings", () => {
  const seed = (controls: ControlsState, settings = envSettings(PROD)) =>
    seedEnvSettings(controls, {}, report(settings), hasHardcoreBuild, AT);

  describe("once the env retires, every bot does what it does today", () => {
    it.each([
      ["production's settings", PROD],
      ["picks with no staging", { beta: "3" }],
      ["nothing armed", {}],
      ["hardcore named on a bot with no build", { hardcore: "banker" }],
    ])("with %s", (_label, env) => {
      const settings = envSettings(env);
      const result = seed(empty, settings);
      const stored: ControlsState = {
        bots: Object.fromEntries(Object.entries(result.written).map(([id, w]) => [id, w.after])),
      };
      const envHardcore = new Set(settings.hardcore);
      const ids = [HOST, OTHER];
      const todayPicks = effectiveBetaPicks(undefined, settings.betaPicks);
      const thenPicks = effectiveBetaPicks(stored.bots[HOST]?.betaPicks, 0);

      expect(effectiveHardcoreIds(ids, new Set(), stored)).toEqual(
        effectiveHardcoreIds(ids, envHardcore, empty),
      );
      expect(thenPicks).toBe(todayPicks);
      expect(effectiveBetaStage(stored.bots[HOST]?.betaStage, false, thenPicks)).toBe(
        effectiveBetaStage(undefined, settings.betaStage, todayPicks),
      );
    });
  });

  it("copies only what the env turned on, and the count and staging only to the host", () => {
    const result = seed(empty);

    expect(result.written).toEqual({
      [HOST]: { before: {}, after: { hardcore: true, betaPicks: 2, betaStage: true } },
    });
    expect(result.markers).toEqual({
      [HOST]: { at: AT.toISOString(), settings: ["hardcore", "betaPicks", "betaStage"] },
      [OTHER]: { at: AT.toISOString(), settings: [] },
    });
  });

  it("never touches a setting the owner already stored, off included", () => {
    const owned: ControlsState = {
      bots: { [HOST]: { hardcore: false, betaPicks: 0, suspended: true } },
    };
    const result = seed(owned);

    expect(result.written).toEqual({
      [HOST]: {
        before: owned.bots[HOST],
        after: { hardcore: false, betaPicks: 0, suspended: true, betaStage: true },
      },
    });
  });

  it("refuses a count over the app's ceiling in words, never storing a smaller one", () => {
    const result = seed(empty, { ...envSettings(PROD), betaPicks: MAX_BETA_PICKS + 5 });

    expect(result.written[HOST]?.after).toEqual({ hardcore: true, betaStage: true });
    expect(result.refused).toEqual([
      `[settings] not copied: ${HOST}'s forced picks per day (${MAX_BETA_PICKS + 5}) is over the app's ${MAX_BETA_PICKS} — set it on the bot's Settings card`,
    ]);
  });

  it("marks nothing for a bots build that reports no settings", () => {
    expect(seedEnvSettings(empty, {}, report(), hasHardcoreBuild, AT).seeded).toEqual([]);
  });

  it("runs once per account", () => {
    const once = seed(empty);
    const twice = seedEnvSettings(
      empty,
      once.markers,
      report(envSettings(PROD)),
      hasHardcoreBuild,
      LATER,
    );

    expect(twice.seeded).toEqual([]);
    expect(twice.written).toEqual({});
  });
});

describe("the copy on the dashboard's files", () => {
  let dir: string;
  let controls: BotControlsStore;
  let changes: SettingsChangeLog;
  let seed: ReturnType<typeof createEnvSettingsSeeder>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "env-settings-seed-"));
    const path = join(dir, "bot-controls.json");
    controls = new BotControlsStore(path);
    changes = new SettingsChangeLog(join(dir, "settings-changes.json"));
    seed = createEnvSettingsSeeder(
      controls,
      changes,
      envSettingsMarkersPathFrom(path),
      hasHardcoreBuild,
    );
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("stores the copy, logs it as the operations setting's, and is a no-op on every poll after", () => {
    const lines = seed(report(envSettings(PROD)), AT);

    expect(controls.load().bots[HOST]).toEqual({ hardcore: true, betaPicks: 2, betaStage: true });
    expect(lines).toEqual([
      "[settings] copied the bots app's own settings into each bot's stored settings: sauron (hardcore, betaPicks, betaStage)",
    ]);
    expect(changes.list(HOST).map((c) => [c.setting, c.before, c.after, c.proposedBy])).toEqual([
      ["betaStage", null, true, ENV_SEED_AUTHOR],
      ["betaPicks", null, 2, ENV_SEED_AUTHOR],
      ["hardcore", null, true, ENV_SEED_AUTHOR],
    ]);
    expect(seed(report(envSettings(PROD)), LATER)).toEqual([]);
  });

  it("leaves the audit line an owner's edit stamped", () => {
    controls.setBot(HOST, { suspended: true }, "owner@example.com", AT);
    seed(report(envSettings(PROD)), LATER);

    expect(controls.load().updatedBy).toBe("owner@example.com");
    expect(controls.load().updatedAt).toBe(AT.toISOString());
  });

  it("never re-copies a setting the owner handed back to the operations setting", () => {
    seed(report(envSettings(PROD)), AT);
    controls.replaceBot(HOST, {}, "owner@example.com", AT);

    expect(seed(report(envSettings(PROD)), LATER)).toEqual([]);
    expect(controls.load().bots[HOST]).toEqual({});
  });

  it("never writes over a controls file it could not read whole", () => {
    writeFileSync(join(dir, "bot-controls.json"), "{ torn");

    expect(seed(report(envSettings(PROD)), AT)).toEqual([]);
    expect(readFileSync(join(dir, "bot-controls.json"), "utf8")).toBe("{ torn");
  });

  it("never writes while the change log does not read whole — its history would be written over", () => {
    writeFileSync(join(dir, "settings-changes.json"), "{ torn");

    expect(seed(report(envSettings(PROD)), AT)).toEqual([]);
    expect(controls.load().bots).toEqual({});
    expect(readFileSync(join(dir, "settings-changes.json"), "utf8")).toBe("{ torn");
  });

  it("puts the bot back and tries again next poll when the change log can't be written", () => {
    const failing = createEnvSettingsSeeder(
      controls,
      {
        readable: () => true,
        record: () => {
          throw new Error("disk full");
        },
      } as unknown as SettingsChangeLog,
      envSettingsMarkersPathFrom(join(dir, "bot-controls.json")),
      hasHardcoreBuild,
    );

    expect(failing(report(envSettings(PROD)), AT)).toEqual([
      "[settings] copying sauron's settings failed, put back, retried next poll: Error: disk full",
    ]);
    expect(controls.load().bots[HOST]).toEqual({});
    expect(seed(report(envSettings(PROD)), LATER)).toHaveLength(1);
    expect(controls.load().bots[HOST]).toEqual({ hardcore: true, betaPicks: 2, betaStage: true });
  });

  it("shows the copy on the bot's Settings card as the operations setting's, never an owner's", () => {
    seed(report(envSettings(PROD)), AT);
    const config = {
      controls: { store: controls, changes },
      readHouseRoster: () => report(envSettings(PROD)),
    } as unknown as DashboardServerConfig;

    const view = botSettingsView(config, HOST, "owner@example.com");

    expect(view?.hardcore).toBe(true);
    expect(view?.changes.map((c) => c.proposedBy)).toEqual([
      "the operations setting, copied once",
      "the operations setting, copied once",
      "the operations setting, copied once",
    ]);
  });
});

describe("copying the shadow scout's names into its host's COND-SCOUT subscription", () => {
  const STREAMED = BOTS_UNIVERSE; // what the runner streams, and the Store's chips for COND-SCOUT

  it("scans the same names with the env gone as it scans from the env today", () => {
    const settings = envSettings(PROD);
    const result = seedCondScout(
      {},
      EMPTY_SEED_MARKERS,
      report(settings),
      COND_SCOUT_ID,
      BOTS_UNIVERSE,
      AT,
    );
    const today = resolveCondScoutUniverse([], PROD.scout, STREAMED);
    const then = resolveCondScoutUniverse(result.state[HOST] ?? [], undefined, STREAMED);

    expect(then.wanted).toEqual(today.wanted);
    expect(result.state[HOST]).toEqual([
      {
        accountId: HOST,
        playbookId: COND_SCOUT_ID,
        mode: "standard",
        enabled: true,
        symbols: ["NVDA", "TSLA"],
        createdAt: AT.toISOString(),
        updatedAt: AT.toISOString(),
      },
    ]);
    expect(result.markers[HOST]?.seededFrom).toBe(SEEDED_FROM_COND_SCOUT_UNIVERSE);
  });

  it("only marks a host that already holds COND-SCOUT, paused included", () => {
    const paused = {
      accountId: HOST,
      playbookId: COND_SCOUT_ID,
      mode: "standard" as const,
      enabled: false,
      createdAt: "2026-10-18T00:00:00.000Z",
      updatedAt: "2026-10-18T00:00:00.000Z",
    };
    const state = { [HOST]: [paused] };
    const result = seedCondScout(
      state,
      EMPTY_SEED_MARKERS,
      report(envSettings(PROD)),
      COND_SCOUT_ID,
      BOTS_UNIVERSE,
      AT,
    );

    expect(result.state).toBe(state);
    expect(result.seeded).toEqual([HOST]);
  });

  it("keeps only the names the Store's chips offer — the scout drops the rest today anyway", () => {
    const settings = { ...envSettings(PROD), condScoutUniverse: ["NVDA", "ZZZZ"] };
    const result = seedCondScout(
      {},
      EMPTY_SEED_MARKERS,
      report(settings),
      COND_SCOUT_ID,
      BOTS_UNIVERSE,
      AT,
    );
    const today = resolveCondScoutUniverse([], "NVDA,ZZZZ", STREAMED).wanted.filter((n) =>
      STREAMED.includes(n),
    );

    expect(result.state[HOST]?.[0]?.symbols).toEqual(["NVDA"]);
    expect(today).toEqual(["NVDA"]);
  });

  it("seeds nothing, rather than an empty filter meaning every name, when no env name is pickable", () => {
    const settings = { ...envSettings(PROD), condScoutUniverse: ["ZZZZ"] };

    expect(
      seedCondScout({}, EMPTY_SEED_MARKERS, report(settings), COND_SCOUT_ID, BOTS_UNIVERSE, AT)
        .seeded,
    ).toEqual([]);
  });

  it("seeds and marks nothing when the env names no scout names", () => {
    const result = seedCondScout(
      {},
      EMPTY_SEED_MARKERS,
      report(envSettings({})),
      COND_SCOUT_ID,
      BOTS_UNIVERSE,
      AT,
    );

    expect(result.seeded).toEqual([]);
  });
});

describe("both copies on a real /controls poll (the dashboard's own wiring)", () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "env-settings-poll-"));
    env = {
      SKYNET_SUBSCRIPTIONS_FILE: join(dir, "playbook-subscriptions.json"),
      SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
    };
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("copies the settings and the scout's names on the first poll, and nothing after", () => {
    const seed = pollSeedsFromEnv(env);
    const poll = controlsPollReport(controlsPollRosterHeaders(report(envSettings(PROD))));

    expect(seed(poll, AT)).toEqual([
      "[subscriptions] seeded the shadow scout's host on SKYNET_COND_SCOUT_UNIVERSE's names (COND-SCOUT, no budget): sauron",
      "[settings] copied the bots app's own settings into each bot's stored settings: sauron (hardcore, betaPicks, betaStage)",
    ]);
    expect(
      new SubscriptionStore(env.SKYNET_SUBSCRIPTIONS_FILE ?? "").load()[HOST]?.[0]?.symbols,
    ).toEqual(["NVDA", "TSLA"]);
    expect(
      new SettingsChangeLog(join(dir, "settings-changes.json")).list(HOST).map((c) => c.setting),
    ).toContain(`subscription:${COND_SCOUT_ID}`);
    expect(condScoutSeedMarkersPathFrom(env.SKYNET_SUBSCRIPTIONS_FILE ?? "")).toBe(
      join(dir, "playbook-cond-scout-seeds.json"),
    );
    expect(seed(poll, LATER)).toEqual([]);
  });
});
