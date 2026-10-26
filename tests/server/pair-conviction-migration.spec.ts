import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import type { MemberPointers } from "../../src/subscriptions/conviction-pointer.js";
import { pairViewId } from "../../src/subscriptions/pair-conviction.js";
import { ownViewsToState, statedOnFor } from "../../src/subscriptions/pair-conviction-migration.js";
import { carriedReason } from "../../src/subscriptions/row-conviction.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 contract piece 3, the poll migration — what the forms wrote inline before #5947 moved onto
 * the owner's own view on the pair. Every inline copy has moved (the live count read none on
 * 2026-10-26) and the field is retired, so what is left is a ◆ row's conviction: a ◆ pair no single
 * record steers gets its row's conviction as the owner's view, and the pointer pass points at it.
 */

const NOW = new Date("2026-10-22T15:00:00Z");
const AI_DIP = CONVICTIONS.get("ai-dip-2026-10");
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
  it("WHEN a ◆ row no single record steers has no pointer, its row's conviction becomes the owner's view", () => {
    const [carried, ...rest] = ownViewsToState(
      { sauron: [sub("CRWV-WHEEL")] },
      NOW,
      NONE,
      name,
      [],
    );
    const pair = findPair("CRWV-WHEEL");
    expect(rest).toEqual([]);
    expect(carried).toMatchObject({ accountId: "sauron", playbookId: "CRWV-WHEEL" });
    expect(carried?.view).toMatchObject({
      id: pairViewId("sauron", "CRWV-WHEEL"),
      title: "Sauron's own conviction",
      owner: "Sauron",
      statedOn: "2026-10-22",
      checkOn: pair?.evidence.checkOn,
      steers: ["CRWV-WHEEL"],
      scope: "pair",
      claims: [{ statement: pair && carriedReason(pair) }],
    });
  });

  it("WHEN the pointer rule already resolves a pair (the record that steers it, or a held view), nothing is written", () => {
    const own = aMemberConviction({ id: pairViewId("sauron", "SAURON"), steers: ["SAURON"] });
    const held: MemberPointers = {
      heldBy: () => [{ ...own, scope: "pair", narrowings: [] }],
      ids: new Set([own.id]),
    };
    const state = { sauron: [sub("CRWV-WHEEL"), sub("CRWV-LONG-CALL"), sub("SAURON")] };
    expect(AI_DIP?.steers).toEqual(expect.arrayContaining(["CRWV-WHEEL", "CRWV-LONG-CALL"]));
    expect(ownViewsToState(state, NOW, held, name)).toEqual([]);
  });

  it("WHEN a pair that is not ◆ has no pointer, nothing is written: it has no conviction to move", () => {
    expect(ownViewsToState({ sauron: [sub("SAURON")] }, NOW, NONE, name)).toEqual([]);
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

describe("the controls poll and a retired inline copy (the contract step's last piece)", () => {
  let dir: string;
  let subsPath: string;
  let membersPath: string;
  let subs: SubscriptionStore;
  let members: MemberConvictionStore;
  let poll: ReturnType<typeof pollSeedsFromEnv>;
  const held = (playbookId: string) => subs.load().sauron?.find((s) => s.playbookId === playbookId);

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
    const legacy = { reason: "Sauron's own rules hold through the print.", checkOn: "2027-04-30" };
    await writeFile(
      subsPath,
      JSON.stringify({ sauron: [{ ...sub("SAURON"), conviction: legacy }] }),
    );
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("WHEN the poll runs, nothing is moved from it: no view is written and no pointer set", () => {
    expect(poll(controlsPollReport({}), NOW)).toEqual([]);
    expect(held("SAURON")).not.toHaveProperty("conviction");
    expect(held("SAURON")).not.toHaveProperty("convictionId");
    expect(members.handedOver()).toEqual([]);
  });

  it("WHEN the poll runs again, it writes nothing", async () => {
    poll(controlsPollReport({}), NOW);
    const onDisk = await readFile(subsPath, "utf8");
    expect(poll(controlsPollReport({}), new Date("2026-10-23T15:00:00Z"))).toEqual([]);
    expect(await readFile(subsPath, "utf8")).toBe(onDisk);
  });

  it("WHEN the views file cannot be read whole, nothing is written", async () => {
    await writeFile(membersPath, "{ torn");
    poll(controlsPollReport({}), NOW);
    expect(held("SAURON")).not.toHaveProperty("convictionId");
    expect(await readFile(membersPath, "utf8")).toBe("{ torn");
  });
});
