import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import {
  MAX_WIRED_CONVICTIONS,
  type WiredConviction,
} from "../../src/autonomous/convictions-wire.js";
import {
  convictionHoldNote,
  UNMOVED_CONVICTION_NOTE,
} from "../../src/observatory/playbook-store-json-view.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { handOverPlan, heldConvictions } from "../../src/server/conviction-hand-over.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { serveMemberConvictionsApi } from "../../src/server/member-convictions-api-routes.js";
import {
  CONVICTION_NO_VIEWS,
  CONVICTION_NOT_KEPT,
  CONVICTION_UNSAVED,
  CONVICTION_WIRE_FULL,
  statePairConviction,
  writeWithConviction,
} from "../../src/server/pair-conviction-write.js";
import { SettingsChangeLog } from "../../src/server/settings-change-log.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";
import { pairViewId } from "../../src/subscriptions/pair-conviction.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 contract piece 3, the app's half — the subscribe and conviction forms write the owner's
 * reason and check day as a view stated on that one pair, held on that one account, and point the
 * subscription at it instead of keeping an inline copy. A day the seeded record states still
 * points at the record, so its narrowings are never traded away. The owner's row reads exactly as
 * it did, and the bots check the view exactly as they checked the inline copy (#5939).
 */

function fakeRes(): { res: ServerResponse; out: { body?: string } } {
  const out: { body?: string } = {};
  const res = {
    writeHead: () => res,
    setHeader: () => undefined,
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(url: string): IncomingMessage {
  return { method: "GET", url, headers: {} } as unknown as IncomingMessage;
}

const ADA = "ada@example.com";
const ada = { email: ADA, name: "Ada Lovelace" } as never;
const NOW = new Date("2026-10-22T15:00:00Z");
const AI_DIP = CONVICTIONS.get("ai-dip-2026-10");
const OWN_DAY = { reason: "Sauron's own rules hold through the print.", checkOn: "2027-04-30" };
const SAURON_VIEW = pairViewId("sauron", "SAURON");
const WHEEL_VIEW = pairViewId("sauron", "CRWV-WHEEL");

describe("an owner's conviction is kept as their own view on the pair", () => {
  let dir: string;
  let members: MemberConvictionStore;
  let subs: SubscriptionStore;
  let log: SettingsChangeLog;
  let config: DashboardServerConfig;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-pair-conviction-"));
    members = new MemberConvictionStore(join(dir, "member-convictions.json"));
    subs = new SubscriptionStore(join(dir, "playbook-subscriptions.json"), undefined, () =>
      members.pointers(),
    );
    log = new SettingsChangeLog(join(dir, "settings-changes.json"));
    config = {
      auth: { providerIds: ["google"] },
      resolveOwnerIds: (email: string) => (email === ADA ? ["sauron"] : []),
      now: () => NOW,
      subscriptions: subs,
      memberConvictions: members,
      controls: {
        store: new BotControlsStore(join(dir, "bot-controls.json")),
        isOwner: () => true,
        bots: () => [],
        changes: log,
      },
    } as unknown as DashboardServerConfig;
    subs.subscribe("sauron", { playbookId: "SAURON", mode: "standard", enabled: true }, NOW);
    subs.subscribe("sauron", { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }, NOW);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const store = async (path: string, body: unknown) => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(post(body), res, `/api/playbook-store/${path}`, config, ada);
    return JSON.parse(out.body || "{}");
  };
  const held = (playbookId: string) => subs.load().sauron?.find((s) => s.playbookId === playbookId);
  const viewIds = () => members.handedOver().map((w) => w.conviction.id);

  it("WHEN an owner states a conviction on a pair no record steers, it is their view and the pointer", async () => {
    expect(
      await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY }),
    ).toEqual({
      ok: true,
    });
    const sub = held("SAURON");
    expect(sub?.convictionId).toBe(SAURON_VIEW);
    expect(sub).not.toHaveProperty("conviction");
    const [wired] = members.handedOver();
    expect(wired?.accounts).toEqual(["sauron"]);
    expect(wired?.conviction).toMatchObject({
      id: SAURON_VIEW,
      scope: "pair",
      owner: "Ada Lovelace",
      statedOn: "2026-10-22",
      checkOn: OWN_DAY.checkOn,
      steers: ["SAURON"],
    });
    // Held by the store's own rules, on that account only — what the bots resolve it on.
    expect(
      members
        .pointers()
        .heldBy("sauron")
        .map((c) => c.id),
    ).toEqual([SAURON_VIEW]);
    expect(members.pointers().heldBy("banker")).toEqual([]);
  });

  it("WHEN the owner reads their row, it shows the reason and day they typed, as the inline copy did", async () => {
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY });
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      get("/api/playbook-store?id=sauron"),
      res,
      "/api/playbook-store",
      config,
      ada,
    );
    const rows = (JSON.parse(out.body || "{}").strategies ?? []).flatMap(
      (c: { pairs: unknown[] }) => c.pairs,
    ) as { id: string; subscription?: Record<string, unknown> }[];
    const row = rows.find((r) => r.id === "SAURON");
    expect(row?.subscription?.conviction).toEqual(OWN_DAY);
    expect(row?.subscription).not.toHaveProperty("convictionId");
    // A view the bots check by its pointer is trading: the row carries no exits-only note.
    expect(row).not.toHaveProperty("notTrading");
  });

  // #5482 contract piece 4 and the inline carry's replacement: the bots read pointers only, so a ◆
  // pair with none runs exits-only, and the owner's row says so (the state block's default).
  it("WHEN a ◆ pair has no pointer, the row says the pair opens nothing new", async () => {
    const state = subs.load();
    subs.replace({
      ...state,
      sauron: (state.sauron ?? []).map((s) => {
        if (s.playbookId !== "CRWV-WHEEL") return s;
        const { convictionId: _pointer, ...unpointed } = s;
        return unpointed;
      }),
    });
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      get("/api/playbook-store?id=sauron"),
      res,
      "/api/playbook-store",
      config,
      ada,
    );
    const rows = (JSON.parse(out.body || "{}").strategies ?? []).flatMap(
      (c: { pairs: unknown[] }) => c.pairs,
    ) as { id: string; notTrading?: string }[];
    expect(rows.find((r) => r.id === "CRWV-WHEEL")?.notTrading).toBe(UNMOVED_CONVICTION_NOTE);
    // A pair that is not ◆ with no pointer has no conviction on record: a label, never a stop.
    expect(rows.find((r) => r.id === "SAURON")).not.toHaveProperty("notTrading");
  });

  // The roll call's test (`rosterSteering`) on the owner's row: a pointer the bots refuse holds the
  // pair exits-only too, and before this the row read as trading.
  it("WHEN a pair points at a view the bots cannot use, the row says it opens nothing new and why", async () => {
    const state = subs.load();
    subs.replace({
      ...state,
      sauron: (state.sauron ?? []).map((s) =>
        s.playbookId === "CRWV-WHEEL" ? { ...s, convictionId: "no-such-view" } : s,
      ),
    });
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      get("/api/playbook-store?id=sauron"),
      res,
      "/api/playbook-store",
      config,
      ada,
    );
    const rows = (JSON.parse(out.body || "{}").strategies ?? []).flatMap(
      (c: { pairs: unknown[] }) => c.pairs,
    ) as { id: string; notTrading?: string }[];
    expect(rows.find((r) => r.id === "CRWV-WHEEL")?.notTrading).toBe(
      convictionHoldNote('points at conviction "no-such-view", which these bots do not hold'),
    );
    expect(rows.find((r) => r.id === "CRWV-WHEEL")?.notTrading).toMatch(
      /^Opening nothing new: .*no-such-view.*Exits still run\.$/,
    );
  });

  it("WHEN the conviction is re-dated, the view is replaced in place and the pointer stays", async () => {
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY });
    const later = { reason: "Still holding.", checkOn: "2027-06-30" };
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: later });
    expect(held("SAURON")?.convictionId).toBe(SAURON_VIEW);
    expect(members.handedOver().map((w) => w.conviction.checkOn)).toEqual([later.checkOn]);
  });

  it("WHEN a subscribe states the conviction, it is kept the same way", async () => {
    await store("subscribe", {
      id: "sauron",
      playbookId: "SAURON",
      mode: "standard",
      capitalAllocated: 5_000,
      conviction: OWN_DAY,
    });
    expect(held("SAURON")).toMatchObject({ convictionId: SAURON_VIEW, capitalAllocated: 5_000 });
    expect(held("SAURON")).not.toHaveProperty("conviction");
    expect(viewIds()).toEqual([SAURON_VIEW]);
  });

  it("WHEN the day is the seeded record's on a pair it steers, the pair points at the record and keeps its narrowings", async () => {
    await store("conviction", { id: "sauron", playbookId: "CRWV-WHEEL", conviction: OWN_DAY });
    expect(viewIds()).toEqual([WHEEL_VIEW]);
    await store("conviction", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "AI dip", checkOn: AI_DIP?.checkOn },
    });
    expect(held("CRWV-WHEEL")?.convictionId).toBe(AI_DIP?.id);
    // Their own view is dropped: left held, it would outrank the record that narrows the pair.
    expect(viewIds()).toEqual([]);
  });

  it("WHEN the change log will not write, the subscription and the view are both put back", async () => {
    const before = held("SAURON");
    config = {
      ...config,
      controls: {
        ...config.controls,
        changes: {
          readable: () => true,
          record: () => {
            throw new Error("disk full");
          },
        },
      },
    } as unknown as DashboardServerConfig;
    await expect(
      store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY }),
    ).rejects.toThrow(/disk full/);
    expect(held("SAURON")).toEqual(before);
    expect(viewIds()).toEqual([]);
  });

  it("WHEN the views file cannot be read whole, the conviction is refused and nothing changes", async () => {
    await writeFile(join(dir, "member-convictions.json"), "{ torn");
    expect(
      await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY }),
    ).toEqual({ ok: false, error: CONVICTION_UNSAVED });
    expect(held("SAURON")).not.toHaveProperty("convictionId");
  });

  it("WHEN the pair is not held, nothing is written", async () => {
    expect(
      await store("conviction", { id: "sauron", playbookId: "S1-NVDA", conviction: OWN_DAY }),
    ).toMatchObject({ ok: false });
    expect(viewIds()).toEqual([]);
  });

  it("WHEN the owner unsubscribes, their view on the pair goes too", async () => {
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY });
    expect(await store("unsubscribe", { id: "sauron", playbookId: "SAURON" })).toEqual({
      ok: true,
    });
    expect(viewIds()).toEqual([]);
  });

  it("WHEN a view outlives its subscription, the controls poll drops it", async () => {
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY });
    subs.unsubscribe("sauron", "SAURON");
    const seed = pollSeedsFromEnv({
      SKYNET_SUBSCRIPTIONS_FILE: join(dir, "playbook-subscriptions.json"),
      SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
    });
    expect(seed(controlsPollReport({}), NOW)).toContainEqual(
      expect.stringMatching(/dropped an owner's own view .*: sauron\/SAURON/),
    );
    expect(viewIds()).toEqual([]);
  });

  it("WHEN a member hands a view over on that pair, it takes over from their own view, which steers again on take-back", async () => {
    await store("conviction", { id: "sauron", playbookId: "CRWV-WHEEL", conviction: OWN_DAY });
    const views = async (path: string, body: unknown) => {
      const { res, out } = fakeRes();
      await serveMemberConvictionsApi(post(body), res, `/api/convictions/${path}`, config, ada);
      return JSON.parse(out.body || "{}");
    };
    const floor = aMemberConviction();
    const { id: _id, owner: _owner, statedOn: _on, ...draft } = floor;
    expect((await views("save", { draft: { ...draft, title: "CRWV floor" } })).ok).toBe(true);
    // The row says what the hand-over takes over, before the tap.
    const { res, out } = fakeRes();
    await serveMemberConvictionsApi(
      get("/api/convictions/mine"),
      res,
      "/api/convictions/mine",
      config,
      ada,
    );
    expect(JSON.parse(out.body || "{}").convictions[0]?.takesOver).toEqual([
      { pair: "CRWV-WHEEL", name: expect.any(String), from: "Ada Lovelace's own conviction" },
    ]);
    const hand = await views("hand-over", { id: floor.id });
    expect(hand).toMatchObject({ ok: true });
    expect(held("CRWV-WHEEL")?.convictionId).toBe(floor.id);
    await views("take-back", { id: floor.id });
    expect(held("CRWV-WHEEL")?.convictionId).toBe(WHEEL_VIEW);
  });

  it("never lists an owner's own view as a view of the club", async () => {
    await store("conviction", { id: "sauron", playbookId: "SAURON", conviction: OWN_DAY });
    expect(heldConvictions(members).get(SAURON_VIEW)).toBeUndefined();
    expect(members.list("account:sauron")).toHaveLength(1);
  });
});

describe("never past what the bots will hold", () => {
  const full: WiredConviction[] = Array.from({ length: MAX_WIRED_CONVICTIONS }, (_, i) => ({
    conviction: aMemberConviction({ id: `view-${i}` }),
    accounts: ["banker"],
  }));

  it("refuses a hand-over once the controls wire is full, but not a view already on it", () => {
    const floor = aMemberConviction();
    const state = {
      sauron: [
        {
          accountId: "sauron",
          playbookId: "CRWV-WHEEL",
          mode: "standard" as const,
          enabled: true,
          createdAt: NOW.toISOString(),
          updatedAt: NOW.toISOString(),
        },
      ],
    };
    const refused = handOverPlan(floor, ["sauron"], state, full);
    expect(refused).toMatchObject({
      ok: false,
      problems: [expect.stringMatching(/as many views as they can read/)],
    });
    const onIt = [...full.slice(1), { conviction: floor, accounts: ["sauron"] }];
    expect(handOverPlan(floor, ["sauron"], state, onIt)).toEqual({
      ok: true,
      accounts: ["sauron"],
    });
  });

  // #5482 contract piece 4: the bots read pointers only, so keeping the day inline would quietly
  // run the pair exits-only. The write is refused instead, and says why.
  it("refuses a new view once the controls wire is full, and changes nothing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-pair-full-"));
    try {
      const members = new MemberConvictionStore(join(dir, "member-convictions.json"));
      const ref = { accountId: "sauron", playbookId: "SAURON" };
      const at = new Date("2026-10-22T15:00:00Z");
      expect(statePairConviction(members, ref, OWN_DAY, "Ada", at).ok).toBe(true);
      const crowded = Object.assign(Object.create(members), { handedOver: () => full });
      const later = { ...OWN_DAY, checkOn: "2027-05-28" };
      expect(statePairConviction(crowded, ref, later, "Ada", at)).toEqual({
        ok: false,
        reason: CONVICTION_WIRE_FULL,
      });
      const write = rstest.fn();
      expect(writeWithConviction(crowded, ref, later, "Ada", at, write)).toEqual({
        ok: false,
        reason: CONVICTION_WIRE_FULL,
      });
      expect(write).not.toHaveBeenCalled();
      expect(members.handedOver().map((w) => w.conviction.checkOn)).toEqual([OWN_DAY.checkOn]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

// #5482's last contract piece: no inline copy to fall back on, so a conviction that cannot be kept
// as a view is refused with a reason that says why, never answered ok and lost.
describe("statePairConviction — refusals once nothing is kept inline", () => {
  const AT = new Date("2026-10-26T15:00:00Z");
  const own = { reason: "My own day.", checkOn: "2027-04-30" };
  const ref = (playbookId: string) => ({ accountId: "sauron", playbookId });

  it("refuses an own day with no views file wired, but still lets the shared view's day through", () => {
    expect(statePairConviction(undefined, ref("CRWV-WHEEL"), own, "Ada", AT)).toEqual({
      ok: false,
      reason: CONVICTION_NO_VIEWS,
    });
    const shared = { reason: "AI dip", checkOn: CONVICTIONS.get("ai-dip-2026-10")?.checkOn ?? "" };
    expect(statePairConviction(undefined, ref("CRWV-WHEEL"), shared, "Ada", AT).ok).toBe(true);
  });

  it("refuses a view the pointer rule would never hold: an id the pair table does not know", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-not-kept-"));
    try {
      const views = new MemberConvictionStore(join(dir, "member-convictions.json"));
      expect(statePairConviction(views, ref("U-my-own-play"), own, "Ada", AT)).toEqual({
        ok: false,
        reason: CONVICTION_NOT_KEPT,
      });
      expect(views.handedOver()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
