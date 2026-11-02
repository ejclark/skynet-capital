import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { authoredPlayId } from "../../src/playbooks/authored-play.js";
import { registeredPlaybooks } from "../../src/playbooks/registry.js";
import { resolveBotRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { botSettingsView } from "../../src/server/bot-settings-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { SettingsChangeLog } from "../../src/server/settings-change-log.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { dropUnknownSubscriptions } from "../../src/server/unknown-subscription-drop.js";
import { pairView } from "../../src/subscriptions/pair-conviction.js";

/**
 * #6599 — a subscription whose playbook id no registry entry knows (HC-SAURON, dissolved 2026-10-16)
 * is dropped by the app's controls poll and logged as the app's own move. The bots' refusal stays:
 * a bots build older than the app must still refuse the id itself.
 */

const NOW = new Date("2026-11-01T18:30:00.000Z");
const ADA = "ada@example.com";
const STALE = "HC-SAURON";

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

describe("the controls poll drops a subscription no registry entry knows", () => {
  let dir: string;
  let subsPath: string;
  let subs: SubscriptionStore;
  let log: SettingsChangeLog;
  let poll: ReturnType<typeof pollSeedsFromEnv>;
  let config: DashboardServerConfig;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-unknown-subscription-"));
    subsPath = join(dir, "playbook-subscriptions.json");
    subs = new SubscriptionStore(subsPath);
    log = new SettingsChangeLog(join(dir, "settings-changes.json"));
    poll = pollSeedsFromEnv({
      SKYNET_SUBSCRIPTIONS_FILE: subsPath,
      SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
    });
    config = {
      controls: {
        store: new BotControlsStore(join(dir, "bot-controls.json")),
        isOwner: () => true,
        bots: () => [],
        changes: log,
      },
    } as unknown as DashboardServerConfig;
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const heldBy = (accountId: string) => (subs.load()[accountId] ?? []).map((s) => s.playbookId);
  /** Sauron's Settings card, as his owner reads it. */
  const card = () => botSettingsView(config, "sauron", ADA)?.changes ?? [];

  it("WHEN the poll finds one, it drops it, leaves the rest as they were and says so", () => {
    const kept = sub("S1-NVDA", { mode: "aggressive", capitalAllocated: 40_000 });
    subs.replace({ sauron: [kept, sub(STALE), sub("CRWV-WHEEL")] });

    const lines = poll(controlsPollReport({}), NOW);

    expect(heldBy("sauron")).toEqual(["S1-NVDA", "CRWV-WHEEL"]);
    expect(subs.load().sauron?.[0]).toEqual(kept);
    expect(lines).toContainEqual(expect.stringContaining(`sauron/${STALE}`));
  });

  it("WHEN it drops one, the bot's Settings card lists a line that is the app's own", () => {
    subs.replace({ sauron: [sub("S1-NVDA"), sub(STALE)] });

    poll(controlsPollReport({}), NOW);

    expect(card()).toEqual([
      {
        at: NOW.toISOString(),
        setting: `subscription:${STALE}`,
        before: "on · standard · no budget",
        after: null,
        proposedBy: "the app, on its own",
        approvedBy: "the app, on its own",
      },
    ]);
  });

  it("WHEN the next poll runs, nothing is left to drop, so nothing is written or logged", async () => {
    subs.replace({ sauron: [sub("S1-NVDA"), sub(STALE)] });
    poll(controlsPollReport({}), NOW);
    const after = await readFile(subsPath, "utf8");

    expect(poll(controlsPollReport({}), NOW)).toEqual([]);

    expect(await readFile(subsPath, "utf8")).toBe(after);
    expect(card()).toHaveLength(1);
  });

  it("drops a paused one too: paused or not, nothing can ever run it", () => {
    subs.replace({ sauron: [sub(STALE, { enabled: false })] });

    poll(controlsPollReport({}), NOW);

    expect(subs.load().sauron).toBeUndefined();
    expect(card()[0]).toMatchObject({ before: "paused · standard · no budget", after: null });
  });

  it("removes the account once its only subscription is gone, and every other account stays", () => {
    const other = sub("G1-GOOG", { accountId: "futurist" });
    subs.replace({ sauron: [sub(STALE)], futurist: [other] });

    poll(controlsPollReport({}), NOW);

    expect(subs.load()).toEqual({ futurist: [other] });
  });

  it("logs each account's drop on that account's own card", () => {
    subs.replace({
      sauron: [sub(STALE)],
      futurist: [sub("GONE-PLAY", { accountId: "futurist" })],
    });

    poll(controlsPollReport({}), NOW);

    expect(log.list("sauron").map((c) => c.setting)).toEqual([`subscription:${STALE}`]);
    expect(log.list("futurist").map((c) => c.setting)).toEqual(["subscription:GONE-PLAY"]);
  });

  it("logs the pointer too when the dropped subscription carried one", () => {
    subs.replace({ sauron: [sub(STALE, { convictionId: "gone-view-2026-10" })] });

    poll(controlsPollReport({}), NOW);

    expect(card().map((c) => [c.setting, c.before, c.after])).toEqual(
      expect.arrayContaining([
        [`conviction:${STALE}`, "gone-view-2026-10", null],
        [`subscription:${STALE}`, "on · standard · no budget", null],
      ]),
    );
  });

  it("takes an owner's own view on the dropped pair on the same poll, its day still in the line", () => {
    const members = new MemberConvictionStore(join(dir, "member-convictions.json"));
    const view = pairView({
      accountId: "sauron",
      playbookId: STALE,
      conviction: { reason: "An old call", checkOn: "2027-01-29" },
      owner: "Sauron",
      statedOn: "2026-10-01",
    });
    expect(members.statePairs([{ accountId: "sauron", playbookId: STALE, view }], NOW)).toEqual([
      `sauron/${STALE}`,
    ]);
    subs.replace({ sauron: [sub(STALE, { convictionId: view.id }), sub("S1-NVDA")] });

    poll(controlsPollReport({}), NOW);

    expect(new MemberConvictionStore(join(dir, "member-convictions.json")).load()).toEqual({});
    expect(card().find((c) => c.setting === `subscription:${STALE}`)?.before).toBe(
      "on · standard · no budget · conviction checked 2027-01-29",
    );
  });

  it("keeps what the rewrite does not own: the strategy allocations survive the drop", () => {
    subs.replace({ sauron: [sub("CRWV-WHEEL"), sub(STALE)] });
    subs.setAllocation("sauron", "wheel", 25_000, NOW);

    poll(controlsPollReport({}), NOW);

    expect(subs.loadAllocations().sauron?.wheel?.capitalAllocated).toBe(25_000);
  });

  describe("what it must never drop", () => {
    it("never drops a playbook the registry knows, on or paused", () => {
      const held = registeredPlaybooks().flatMap((p) => [
        sub(p.id),
        sub(p.id, { accountId: "futurist", enabled: false }),
      ]);
      const state = {
        sauron: held.filter((s) => s.accountId === "sauron"),
        futurist: held.filter((s) => s.accountId === "futurist"),
      };
      subs.replace(state);

      const dropped = dropUnknownSubscriptions(subs, log, undefined, NOW);

      expect(dropped).toEqual([]);
      expect(subs.load()).toEqual(state);
      expect(log.list("sauron")).toEqual([]);
    });

    it("never drops a member's authored play, whether or not its spec still compiles here", () => {
      // The registry does not know a `U-` id, and the spec behind one is no business of this rule.
      const id = authoredPlayId({ authorAccountId: "ada", slug: "earnings-runup" } as never);
      const state = {
        ada: [sub(id, { accountId: "ada" })],
        sauron: [sub(id), sub("U-sauron-paused", { enabled: false })],
      };
      subs.replace(state);

      expect(poll(controlsPollReport({}), NOW)).toEqual([]);

      expect(subs.load()).toEqual(state);
      expect(log.list("ada")).toEqual([]);
    });

    it("treats only the authored prefix as authored: a house-shaped id with a U inside is unknown", () => {
      subs.replace({ sauron: [sub("U2-NVDA"), sub("MENU-PLAY")] });

      poll(controlsPollReport({}), NOW);

      expect(subs.load().sauron).toBeUndefined();
    });
  });

  describe("every drop is recorded, or it does not happen", () => {
    it("WHEN the log will not write, the subscription stays, it is reported, and a later poll retries", () => {
      subs.replace({
        sauron: [sub("S1-NVDA"), sub(STALE)],
        futurist: [sub("GONE-PLAY", { accountId: "futurist" })],
      });
      const errors: string[] = [];
      const broken = {
        readable: () => true,
        record: (id: string) => {
          if (id === "sauron") throw new Error("disk full");
        },
      } as unknown as SettingsChangeLog;

      const dropped = dropUnknownSubscriptions(subs, broken, undefined, NOW, (m) => errors.push(m));

      expect(dropped).toEqual(["futurist/GONE-PLAY"]);
      expect(heldBy("sauron")).toEqual(["S1-NVDA", STALE]);
      expect(heldBy("futurist")).toEqual([]);
      expect(errors).toEqual([expect.stringMatching(/sauron.*disk full/)]);

      expect(dropUnknownSubscriptions(subs, log, undefined, NOW)).toEqual([`sauron/${STALE}`]);
      expect(heldBy("sauron")).toEqual(["S1-NVDA"]);
    });

    it("WHEN the log is there but torn, nothing is dropped until it reads whole", async () => {
      subs.replace({ sauron: [sub(STALE)] });
      await writeFile(join(dir, "settings-changes.json"), "{ torn");

      expect(dropUnknownSubscriptions(subs, log, undefined, NOW)).toEqual([]);

      expect(heldBy("sauron")).toEqual([STALE]);
    });

    it("WHEN the subscriptions file is torn, it is left untouched", async () => {
      await writeFile(subsPath, "{ torn");

      expect(dropUnknownSubscriptions(subs, log, undefined, NOW)).toEqual([]);

      expect(await readFile(subsPath, "utf8")).toBe("{ torn");
    });
  });
});

describe("the bots' own refusal stays exactly as it is (#6599 criterion 2)", () => {
  it("a bots build still refuses an unknown id, by the line it has always written", () => {
    const error = rstest.spyOn(console, "error").mockImplementation(() => undefined);
    const bot = { persona: new SauronPersona(), credentials: { apiKey: "k", apiSecret: "s" } };

    const roster = resolveBotRoster(bot, [], [sub(STALE), sub("S1-NVDA")]);

    expect(roster.enabled.map((e) => e.playbook.id)).not.toContain(STALE);
    expect(error).toHaveBeenCalledWith(
      `[playbooks] sauron is subscribed to unknown playbook "${STALE}" — refused`,
    );
    error.mockRestore();
  });
});
