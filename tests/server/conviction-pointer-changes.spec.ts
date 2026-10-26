import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { controlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { botSettingsView } from "../../src/server/bot-settings-route.js";
import {
  POINTER_RULE_AUTHOR,
  pointerChange,
  recordPointerMoves,
} from "../../src/server/conviction-pointer-changes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { serveMemberConvictionsApi } from "../../src/server/member-convictions-api-routes.js";
import { SettingsChangeLog } from "../../src/server/settings-change-log.js";
import { pollSeedsFromEnv } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * #5482, the contract step's first piece — which conviction view steers a pair narrows what that
 * pair may open and sets the day it is checked, so every time the pointer moves the bot's settings
 * change log says so: the view before and after by title, and who moved it (#4535 criterion 4).
 * A member's own tap is theirs; the poll applying the pointer rule on its own is the app's.
 */

function fakeRes(): { res: ServerResponse; out: { body?: string } } {
  const out: { body?: string } = {};
  const res = {
    writeHead: () => res,
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

const ADA = "ada@example.com";
const ada = { email: ADA, name: "Ada Lovelace" } as never;
const NOW = new Date("2026-10-20T15:00:00Z");
const AI_DIP = CONVICTIONS.get("ai-dip-2026-10");
const ID = "crwv-floor-2026-10";
/** The owner's own view on the pair, by its title (#5482 contract piece 3). */
const OWN = "Ada Lovelace's own conviction";

const draft = (title = "CRWV floor") => ({
  title,
  checkOn: "2027-02-26",
  claims: [
    {
      tag: "underrated",
      statement: "CRWV's backlog outlasts the selloff.",
      bucket: "forward",
      evidence: "The 2026-10-16 premium-fit re-run.",
      falsifier: "CRWV closes under $45 on or before 2026-12-18.",
      scoreBy: "2026-12-18",
    },
  ],
  steers: ["CRWV-WHEEL"],
  narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] }],
});

describe("a conviction pointer that moves is a line in the settings change log", () => {
  let dir: string;
  let members: MemberConvictionStore;
  let subs: SubscriptionStore;
  let log: SettingsChangeLog;
  let config: DashboardServerConfig;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-pointer-changes-"));
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
    subs.subscribe("sauron", { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }, NOW);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const views = async (path: string, body: unknown) => {
    const { res, out } = fakeRes();
    await serveMemberConvictionsApi(post(body), res, `/api/convictions/${path}`, config, ada);
    return JSON.parse(out.body || "{}");
  };
  const store = async (path: string, body: unknown) => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(post(body), res, `/api/playbook-store/${path}`, config, ada);
    return JSON.parse(out.body || "{}");
  };
  /** The pointer lines on sauron's Settings card, oldest first, as Ada reads them. */
  const pointerLines = () =>
    (botSettingsView(config, "sauron", ADA)?.changes ?? [])
      .filter((c) => c.setting === "conviction:CRWV-WHEEL")
      .reverse()
      .map(({ before, after, proposedBy }) => ({ before, after, proposedBy }));

  it("WHEN a member hands a view over and takes it back, their bot's card lists both moves as theirs", async () => {
    expect((await views("save", { draft: draft() })).ok).toBe(true);
    expect((await views("hand-over", { id: ID })).ok).toBe(true);
    expect((await views("take-back", { id: ID })).ok).toBe(true);
    // The ◆ wheel starts on the seeded view that steers it, and a take-back returns it there.
    expect(pointerLines()).toEqual([
      { before: "AI-dip view", after: "CRWV floor", proposedBy: "you" },
      { before: "CRWV floor", after: "AI-dip view", proposedBy: "you" },
    ]);
  });

  it("WHEN a take-back finds the pair was on its owner's own day, it returns to that day", async () => {
    // The owner's own day: no record states it, so it is kept as their own view on the pair.
    await store("conviction", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "later", checkOn: "2027-04-30" },
    });
    await views("save", { draft: draft() });
    await views("hand-over", { id: ID });
    await views("take-back", { id: ID });
    // #5482 contract piece 3: the own day is a view held underneath the hand-over, so a take-back
    // returns the pair to it, not to the seeded view — and every move says so.
    expect(pointerLines()).toEqual([
      { before: "AI-dip view", after: OWN, proposedBy: "you" },
      { before: OWN, after: "CRWV floor", proposedBy: "you" },
      { before: "CRWV floor", after: OWN, proposedBy: "you" },
    ]);
  });

  it("WHEN a subscription write moves the pointer, its line rides beside the subscription's", async () => {
    // A conviction on a day no record holds points at the owner's own view, said so.
    await store("conviction", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "later", checkOn: "2027-04-30" },
    });
    // Newest first, as the card lists them: one write, two lines.
    const changes = botSettingsView(config, "sauron", ADA)?.changes ?? [];
    expect(changes.map((c) => c.setting)).toEqual([
      "conviction:CRWV-WHEEL",
      "subscription:CRWV-WHEEL",
    ]);
    // The subscription's line still says the day, kept as a view or inline alike.
    expect(changes[1]?.after).toMatch(/conviction checked 2027-04-30/);
    expect(pointerLines().at(-1)).toEqual({ before: "AI-dip view", after: OWN, proposedBy: "you" });
    // A new day replaces the view in place: the pointer stays, and the line carries both days.
    await store("conviction", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "later still", checkOn: "2027-05-28" },
    });
    const redated = botSettingsView(config, "sauron", ADA)?.changes ?? [];
    expect(redated[0]).toMatchObject({
      setting: "subscription:CRWV-WHEEL",
      before: expect.stringMatching(/conviction checked 2027-04-30/),
      after: expect.stringMatching(/conviction checked 2027-05-28/),
    });
    expect(pointerLines()).toHaveLength(1);
    // The record's own day points it back, and their own view is dropped.
    await store("conviction", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "AI dip", checkOn: AI_DIP?.checkOn },
    });
    expect(pointerLines().at(-1)).toEqual({ before: OWN, after: "AI-dip view", proposedBy: "you" });
    expect(members.handedOver()).toEqual([]);
  });

  it("WHEN a steering view is deleted, the line still names it", async () => {
    await views("save", { draft: draft() });
    await views("hand-over", { id: ID });
    expect(await views("delete", { id: ID })).toEqual({ ok: true });
    expect(pointerLines().at(-1)).toEqual({
      before: "CRWV floor",
      after: "AI-dip view",
      proposedBy: "you",
    });
  });

  it("WHEN the poll moves a pointer on its own, the line is the app's", () => {
    // Written raw so no write path pointed it: the poll's seeded match is the only mover.
    subs.replace({
      sauron: (subs.load().sauron ?? []).map(({ convictionId: _pointer, ...s }) => s),
    });
    const seed = pollSeedsFromEnv({
      SKYNET_SUBSCRIPTIONS_FILE: join(dir, "playbook-subscriptions.json"),
      SKYNET_CONTROLS_FILE: join(dir, "bot-controls.json"),
    });
    seed(controlsPollReport({}), NOW);
    expect(pointerLines()).toEqual([
      { before: null, after: "AI-dip view", proposedBy: "the app, on its own" },
    ]);
    // An invariant: the next poll moves nothing and logs nothing.
    seed(controlsPollReport({}), NOW);
    expect(pointerLines()).toHaveLength(1);
  });

  it("WHEN nothing moves the pointer, a subscription write logs no pointer line", async () => {
    await store("configure", {
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      mode: "standard",
      capitalAllocated: 10_000,
    });
    expect(pointerLines()).toEqual([]);
  });
});

describe("a pointer line in words", () => {
  const names = (id: string) =>
    ({ "ai-dip-2026-10": "AI-dip view", "ai-dip-2026-11": "AI-dip view" })[id];

  it("reads a view by its id once it is no longer stored", () => {
    const line = pointerChange(
      { accountId: "sauron", playbookId: "CRWV-WHEEL", from: "gone-view-2026-10" },
      names,
      POINTER_RULE_AUTHOR,
      NOW,
    );
    expect(line).toMatchObject({ before: "gone-view-2026-10", after: null });
  });

  it("reads two views sharing a title by id, so the line never looks like no change", () => {
    const line = pointerChange(
      {
        accountId: "sauron",
        playbookId: "CRWV-WHEEL",
        from: "ai-dip-2026-10",
        to: "ai-dip-2026-11",
      },
      names,
      POINTER_RULE_AUTHOR,
      NOW,
    );
    expect(line).toMatchObject({ before: "ai-dip-2026-10", after: "ai-dip-2026-11" });
  });

  it("keeps the move and reports it when the log will not write", () => {
    const errors: string[] = [];
    const broken = {
      record: () => {
        throw new Error("disk full");
      },
    } as unknown as SettingsChangeLog;
    recordPointerMoves(
      broken,
      [{ accountId: "sauron", playbookId: "CRWV-WHEEL", to: "ai-dip-2026-10" }],
      names,
      () => POINTER_RULE_AUTHOR,
      NOW,
      (line) => errors.push(line),
    );
    expect(errors).toEqual([expect.stringMatching(/sauron .*disk full/)]);
  });
});
