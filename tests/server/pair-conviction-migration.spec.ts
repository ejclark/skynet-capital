import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import { MAX_WIRED_CONVICTIONS } from "../../src/autonomous/convictions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { CONVICTIONS, statedCheck } from "../../src/playbooks/conviction-store.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { POINTER_RULE_AUTHOR } from "../../src/server/conviction-pointer-changes.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { createSettingsChangeLog } from "../../src/server/settings-change-log.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import type { MemberPointers } from "../../src/subscriptions/conviction-pointer.js";
import { pairViewId } from "../../src/subscriptions/pair-conviction.js";
import { ownViewsToState, statedOnFor } from "../../src/subscriptions/pair-conviction-migration.js";
import { carriedReason } from "../../src/subscriptions/row-conviction.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 contract piece 3, the poll migration — what the forms wrote inline before #5947 moves onto
 * the owner's own view on the pair: an owner's own day, a pair no record steers, and a ◆ row's
 * carry. The pointer pass then points at the view and logs the move, so every pair is checked by a
 * pointer, on the same day it was checked before.
 */

const NOW = new Date("2026-10-22T15:00:00Z");
const AI_DIP = CONVICTIONS.get("ai-dip-2026-10");
const OWN_DAY = { reason: "Sauron's own rules hold through the print.", checkOn: "2027-04-30" };
const NONE: MemberPointers = { heldBy: () => [], ids: new Set() };
const name = (id: string) => (id === "sauron" ? "Sauron" : id);

const sub = (
  playbookId: string,
  extra: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: "2026-10-01T14:00:00.000Z",
  updatedAt: "2026-10-01T14:00:00.000Z",
  ...extra,
});

describe("which subscriptions get their owner's own view (ownViewsToState)", () => {
  it("WHEN an inline conviction states a day no record holds, it becomes the owner's view on that pair", () => {
    const [moved, ...rest] = ownViewsToState(
      { sauron: [sub("SAURON", { conviction: OWN_DAY })] },
      NOW,
      NONE,
      name,
    );
    expect(rest).toEqual([]);
    expect(moved).toMatchObject({ accountId: "sauron", playbookId: "SAURON" });
    expect(moved?.view).toMatchObject({
      id: pairViewId("sauron", "SAURON"),
      title: "Sauron's own conviction",
      owner: "Sauron",
      statedOn: "2026-10-22",
      checkOn: OWN_DAY.checkOn,
      steers: ["SAURON"],
      scope: "pair",
      claims: [{ statement: OWN_DAY.reason, scoreBy: OWN_DAY.checkOn }],
    });
  });

  it("WHEN the pointer rule already resolves a pair (the seeded day, or a held view), nothing is written", () => {
    const own = aMemberConviction({ id: pairViewId("sauron", "SAURON"), steers: ["SAURON"] });
    const held: MemberPointers = {
      heldBy: () => [{ ...own, scope: "pair", narrowings: [] }],
      ids: new Set([own.id]),
    };
    const state = {
      sauron: [
        sub("CRWV-WHEEL", { conviction: { reason: "AI dip", checkOn: AI_DIP?.checkOn ?? "" } }),
        sub("CRWV-LONG-CALL"),
        sub("SAURON", { conviction: OWN_DAY }),
      ],
    };
    expect(ownViewsToState(state, NOW, held, name)).toEqual([]);
  });

  it("WHEN a subscription states no conviction on a pair that is not ◆, nothing is written", () => {
    expect(ownViewsToState({ sauron: [sub("SAURON")] }, NOW, NONE, name)).toEqual([]);
  });

  it("WHEN a ◆ row no single record steers is subscribed with no conviction, its row's conviction becomes the view", () => {
    const [carried] = ownViewsToState({ sauron: [sub("CRWV-WHEEL")] }, NOW, NONE, name, []);
    const pair = findPair("CRWV-WHEEL");
    expect(carried?.view).toMatchObject({
      checkOn: pair?.evidence.checkOn,
      claims: [{ statement: pair && carriedReason(pair) }],
      steers: ["CRWV-WHEEL"],
    });
  });

  it("WHEN the view would break the store's rules or not read back, the inline copy stays", () => {
    const state = {
      sauron: [
        sub("NO-SUCH-PAIR", { conviction: OWN_DAY }),
        sub("SAURON", { conviction: { reason: "x".repeat(1_500), checkOn: OWN_DAY.checkOn } }),
      ],
    };
    expect(ownViewsToState(state, NOW, NONE, name)).toEqual([]);
  });
});

describe("the day a migrated view is stated (statedOnFor)", () => {
  it("is today while the check day is ahead", () => {
    expect(statedOnFor(sub("SAURON"), "2027-04-30", NOW)).toBe("2026-10-22");
  });

  it("is the subscription's start day once the check day passed (a latched failure)", () => {
    expect(statedOnFor(sub("SAURON"), "2026-10-20", NOW)).toBe("2026-10-01");
  });

  it("is the day before the check when the subscription started on or after it", () => {
    const late = sub("SAURON", { createdAt: "2026-10-21T14:00:00.000Z" });
    expect(statedOnFor(late, "2026-10-20", NOW)).toBe("2026-10-19");
    expect(statedOnFor(late, "2026-10-21", NOW)).toBe("2026-10-20");
  });
});

describe("the controls poll moves inline convictions onto views", () => {
  let dir: string;
  let subsPath: string;
  let membersPath: string;
  let subs: SubscriptionStore;
  let members: MemberConvictionStore;
  let poll: ReturnType<typeof pollSeedsFromEnv>;
  const held = (playbookId: string) => subs.load().sauron?.find((s) => s.playbookId === playbookId);
  const SAURON_VIEW = pairViewId("sauron", "SAURON");

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-pair-migration-"));
    subsPath = join(dir, "playbook-subscriptions.json");
    membersPath = join(dir, "member-convictions.json");
    members = new MemberConvictionStore(membersPath);
    subs = new SubscriptionStore(subsPath, undefined, () => members.pointers());
    poll = pollSeedsFromEnv({
      SKYNET_SUBSCRIPTIONS_FILE: subsPath,
      SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
    });
    // As the forms wrote it before #5947: the owner's day inline, no pointer.
    subs.replace({ sauron: [sub("SAURON", { conviction: OWN_DAY })] });
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("WHEN the poll runs, the pair points at its owner's view, keeps no inline copy, and is checked on the same day", () => {
    const before = held("SAURON");
    const lines = poll(controlsPollReport({}), NOW).join("\n");
    expect(lines).toMatch(/moved an inline conviction .*: sauron\/SAURON/);
    expect(lines).toMatch(/pointed each subscription .*: sauron\/SAURON/);
    const after = held("SAURON");
    expect(after?.convictionId).toBe(SAURON_VIEW);
    expect(after).not.toHaveProperty("conviction");
    const lookup = (id: string) =>
      members
        .pointers()
        .heldBy("sauron")
        .find((c) => c.id === id);
    // The day the inline copy stated (the bots no longer read it, #5482 contract piece 4).
    expect(after && statedCheck(after, lookup).checkOn).toBe(before?.conviction?.checkOn);
    expect(members.pointers().heldBy("banker")).toEqual([]);
  });

  it("WHEN the pointer moves, the bot's change log says so, by the pointer rule", () => {
    poll(controlsPollReport({}), NOW);
    const log = createSettingsChangeLog({ SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json") });
    expect(log.list("sauron")).toEqual([
      expect.objectContaining({
        setting: "conviction:SAURON",
        before: null,
        after: "Sauron's own conviction",
        proposedBy: POINTER_RULE_AUTHOR,
      }),
    ]);
  });

  it("WHEN the poll runs again, it writes nothing", async () => {
    poll(controlsPollReport({}), NOW);
    const files = async () => [
      await readFile(subsPath, "utf8"),
      await readFile(membersPath, "utf8"),
    ];
    const onDisk = await files();
    const lines = poll(controlsPollReport({}), new Date("2026-10-23T15:00:00Z"));
    expect(lines).toEqual([]);
    expect(await files()).toEqual(onDisk);
  });

  it("WHEN the views file cannot be read whole, the inline copy stays and nothing is written", async () => {
    await writeFile(membersPath, "{ torn");
    poll(controlsPollReport({}), NOW);
    expect(held("SAURON")).toMatchObject({ conviction: OWN_DAY });
    expect(held("SAURON")?.convictionId).toBeUndefined();
    expect(await readFile(membersPath, "utf8")).toBe("{ torn");
  });

  it("WHEN the controls wire is full, the inline copy stays until room frees", async () => {
    const full = Array.from({ length: MAX_WIRED_CONVICTIONS }, (_, i) => ({
      status: "steering",
      conviction: aMemberConviction({ id: `view-${i}` }),
      accounts: ["banker"],
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    }));
    await writeFile(membersPath, JSON.stringify({ a1b2c3d4e5: full }));
    poll(controlsPollReport({}), NOW);
    expect(held("SAURON")).toMatchObject({ conviction: OWN_DAY });
    expect(members.handedOver()).toHaveLength(MAX_WIRED_CONVICTIONS);
  });
});
