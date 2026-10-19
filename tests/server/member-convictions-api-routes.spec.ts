import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import {
  MAX_CONVICTIONS_PER_MEMBER,
  MemberConvictionStore,
  memberConvictionsFilePath,
  UNREADABLE_FILE,
} from "../../src/server/member-conviction-store.js";
import {
  DRAFT_NOTE,
  serveMemberConvictionsApi,
} from "../../src/server/member-convictions-api-routes.js";

/**
 * #5482 slice 6a — a member states a conviction: the owner and day come from the session and the
 * clock, a preview writes nothing, a save keeps a DRAFT that steers nothing (and says so), only a
 * pair the member's own bot already subscribes to can be steered, and one member never sees
 * another's.
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.headers = {};
  return req;
}

const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const grace = { email: "grace@example.com", name: "Grace" } as never;
const NOW = new Date("2026-10-19T15:00:00Z");

const DRAFT = {
  title: "CRWV floor",
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
  narrowings: [{ pair: "CRWV-WHEEL", fromClaims: ["1"], narrow: [{ kind: "contracts", max: 1 }] }],
};

describe("serveMemberConvictionsApi", () => {
  let dir: string;
  let store: MemberConvictionStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-convictions-"));
    store = new MemberConvictionStore(join(dir, "member-convictions.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: (email: string) =>
        email === "ada@example.com" ? ["sauron"] : ["grace-bot"],
      subscriptions: {
        load: () => ({
          sauron: [{ playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }],
          "grace-bot": [],
        }),
      },
      memberConvictions: store,
      now: () => NOW,
      ...over,
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, req: IncomingMessage, who: unknown = ada, cfg = config()) => {
    const { res, out } = fakeRes();
    const handled = await serveMemberConvictionsApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const mine = (who: unknown = ada) => call("/api/convictions/mine", get(), who);

  it("claims only its paths, and nothing without a session", async () => {
    const { res } = fakeRes();
    expect(await serveMemberConvictionsApi(get(), res, "/api/convictions", config(), ada)).toBe(
      false,
    );
    expect(
      await serveMemberConvictionsApi(get(), res, "/api/convictions/mine", config(), undefined),
    ).toBe(false);
  });

  it("previews a view as the settings it would change, and writes nothing", async () => {
    const answer = await call("/api/convictions/draft", post({ draft: DRAFT }));
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({
      ok: true,
      label: "SIM",
      saved: false,
      note: DRAFT_NOTE,
      conviction: { id: "crwv-floor-2026-10", owner: "Ada Lovelace", statedOn: "2026-10-19" },
      card: {
        pairs: [{ pair: "CRWV-WHEEL", changes: [{ setting: "Contracts", after: "at most 1" }] }],
      },
    });
    expect(store.list(opaqueMemberId("ada@example.com"))).toEqual([]);
  });

  it("saves it as a draft that steers nothing, and says so", async () => {
    const answer = await call("/api/convictions/save", post({ draft: DRAFT }));
    expect(answer.body).toMatchObject({ ok: true, saved: true, note: DRAFT_NOTE });
    const listed = (await mine()).body;
    expect(listed.label).toBe("SIM");
    expect(listed.note).toBe(DRAFT_NOTE);
    expect(listed.convictions).toHaveLength(1);
    expect(listed.convictions[0]).toMatchObject({
      status: "draft",
      conviction: { id: "crwv-floor-2026-10" },
      card: { pairs: [{ pair: "CRWV-WHEEL" }] },
    });
    // The records the bots act on are the seeded ones alone.
    expect(CONVICTIONS.get("crwv-floor-2026-10")).toBeUndefined();
  });

  it("offers only the ◆ pairs the member's own bots subscribe to, with their playbook's room", async () => {
    const cfg = config({
      subscriptions: {
        load: () => ({
          sauron: [
            { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true },
            { playbookId: "S1-NVDA", mode: "standard", enabled: true },
          ],
          "grace-bot": [{ playbookId: "CRWV-LONG-CALL", mode: "standard", enabled: true }],
        }),
      },
    });
    const ofAda = (await call("/api/convictions/mine", get(), ada, cfg)).body.steerable;
    // S1-NVDA runs on its study (✓), so a view cites it and never steers it.
    expect(ofAda).toEqual([
      {
        pair: "CRWV-WHEEL",
        name: expect.stringContaining("CRWV"),
        strategy: "wheel",
        bounds: { dte: expect.any(Object), contracts: expect.any(Object) },
      },
    ]);
    const ofGrace = (await call("/api/convictions/mine", get(), grace, cfg)).body.steerable;
    expect(ofGrace.map((p: { pair: string }) => p.pair)).toEqual(["CRWV-LONG-CALL"]);
  });

  it("takes the owner from the session, never the body", async () => {
    const answer = await call(
      "/api/convictions/draft",
      post({ draft: { ...DRAFT, owner: "Eric", statedOn: "2020-01-01", id: "ai-dip-2026-10" } }),
    );
    expect(answer.body.conviction).toMatchObject({
      id: "crwv-floor-2026-10",
      owner: "Ada Lovelace",
      statedOn: "2026-10-19",
    });
  });

  it("refuses a pair the member's bots don't subscribe to, and writes nothing", async () => {
    const answer = await call("/api/convictions/save", post({ draft: DRAFT }), grace);
    expect(answer.body.ok).toBe(false);
    expect(answer.body.problems[0]).toMatch(/none of your bots subscribes to CRWV-WHEEL/);
    expect(store.load()).toEqual({});
  });

  it("refuses a name a seeded record already holds", async () => {
    const answer = await call(
      "/api/convictions/draft",
      post({ draft: { ...DRAFT, title: "AI dip" } }),
    );
    expect(answer.body.ok).toBe(false);
    expect(answer.body.problems[0]).toMatch(/already stated this month/);
  });

  it("edits a member's own view in place, and keeps others' apart", async () => {
    await call("/api/convictions/save", post({ draft: DRAFT }));
    const edited = await call(
      "/api/convictions/save",
      post({ draft: { ...DRAFT, checkOn: "2027-03-26" }, replaceId: "crwv-floor-2026-10" }),
    );
    expect(edited.body.ok).toBe(true);
    const list = (await mine()).body.convictions;
    expect(list).toHaveLength(1);
    expect(list[0].conviction.checkOn).toBe("2027-03-26");
    expect((await mine(grace)).body.convictions).toEqual([]);
  });

  it("deletes only the member's own view", async () => {
    await call("/api/convictions/save", post({ draft: DRAFT }));
    await call("/api/convictions/delete", post({ id: "crwv-floor-2026-10" }), grace);
    expect((await mine()).body.convictions).toHaveLength(1);
    await call("/api/convictions/delete", post({ id: "crwv-floor-2026-10" }));
    expect((await mine()).body.convictions).toEqual([]);
  });

  it("answers 400 to a malformed body and says so when no store is wired", async () => {
    expect((await call("/api/convictions/save", post({ draft: { title: "x" } }))).status).toBe(400);
    expect((await call("/api/convictions/delete", post({}))).status).toBe(400);
    const unwired = await call(
      "/api/convictions/save",
      post({ draft: DRAFT }),
      ada,
      config({ memberConvictions: undefined }),
    );
    expect(unwired.body).toEqual({
      ok: false,
      error: "Convictions aren't wired in this deployment.",
    });
  });
});

describe("MemberConvictionStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-convictions-store-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const record = (id: string) => ({
    id,
    owner: "Ada",
    statedOn: "2026-10-19",
    title: id,
    checkOn: "2027-02-26",
    claims: DRAFT.claims as never,
    steers: ["CRWV-WHEEL"],
  });

  it("lives beside the subscriptions file", () => {
    expect(memberConvictionsFilePath({ SKYNET_SUBSCRIPTIONS_FILE: "/data/subs.json" })).toBe(
      "/data/member-convictions.json",
    );
  });

  it("caps a member's views, and refuses an id another member holds", () => {
    const store = new MemberConvictionStore(join(dir, "c.json"));
    for (let i = 0; i < MAX_CONVICTIONS_PER_MEMBER; i += 1) {
      expect(store.save("ada", record(`view-${i}`), NOW).ok).toBe(true);
    }
    expect(store.save("ada", record("one-more"), NOW)).toEqual({
      ok: false,
      reason: `You hold ${MAX_CONVICTIONS_PER_MEMBER} views already; delete one before stating another.`,
    });
    expect(store.save("grace", record("view-0"), NOW).ok).toBe(false);
    expect(store.save("ada", record("x"), NOW, "gone")).toEqual({
      ok: false,
      reason: "That view is gone, so it can't be edited.",
    });
  });

  it("refuses a write over a file it cannot read whole, and leaves the file as it was", async () => {
    const path = join(dir, "c.json");
    const onDisk = JSON.stringify({
      grace: [{ status: "retired", conviction: record("g"), createdAt: "x", updatedAt: "x" }],
    });
    await writeFile(path, onDisk);
    const store = new MemberConvictionStore(path);
    expect(store.save("ada", record("a"), NOW)).toEqual({ ok: false, reason: UNREADABLE_FILE });
    expect(store.delete("grace", "g")).toEqual({ ok: false, reason: UNREADABLE_FILE });
    expect(await readFile(path, "utf8")).toBe(onDisk);
  });

  it("drops a record whose status this build does not know, never reading it as a draft", async () => {
    const path = join(dir, "c.json");
    await writeFile(
      path,
      JSON.stringify({
        ada: [
          { status: "retired", conviction: record("a"), createdAt: "x", updatedAt: "x" },
          { status: "draft", conviction: record("b"), createdAt: "x", updatedAt: "x" },
        ],
      }),
    );
    const store = new MemberConvictionStore(path);
    expect(store.list("ada").map((r) => r.conviction.id)).toEqual(["b"]);
  });

  // #5482 slice 6c, the expand step: this build reads a handed-over view before any build writes one.
  describe("a view handed to the bots", () => {
    const steering = (id: string, accounts?: unknown) => ({
      status: "steering",
      conviction: record(id),
      ...(accounts === undefined ? {} : { accounts }),
      createdAt: "x",
      updatedAt: "x",
    });

    it("is read with the accounts it may steer, and only it is handed over", async () => {
      const path = join(dir, "c.json");
      await writeFile(
        path,
        JSON.stringify({
          ada: [steering("a", ["futurist"]), { ...steering("b"), status: "draft" }],
        }),
      );
      const store = new MemberConvictionStore(path);
      expect(store.list("ada").map((r) => [r.conviction.id, r.status])).toEqual([
        ["a", "steering"],
        ["b", "draft"],
      ]);
      expect(store.handedOver()).toEqual([{ conviction: record("a"), accounts: ["futurist"] }]);
    });

    it("is unreadable without the accounts it may steer, so nothing reaches the bots", async () => {
      const path = join(dir, "c.json");
      await writeFile(
        path,
        JSON.stringify({ ada: [steering("a"), steering("b", []), steering("c", [7])] }),
      );
      const store = new MemberConvictionStore(path);
      expect(store.list("ada")).toEqual([]);
      expect(store.handedOver()).toEqual([]);
      // Unreadable is never rewritten: a draft saved now is refused rather than drop all three.
      expect(store.save("ada", record("d"), NOW)).toEqual({ ok: false, reason: UNREADABLE_FILE });
    });

    it("survives a draft saved beside it, so a rollback onto this build loses nothing", async () => {
      const path = join(dir, "c.json");
      await writeFile(path, JSON.stringify({ grace: [steering("g", ["dragon"])] }));
      const store = new MemberConvictionStore(path);
      expect(store.save("ada", record("a"), NOW).ok).toBe(true);
      expect(store.handedOver()).toEqual([{ conviction: record("g"), accounts: ["dragon"] }]);
    });
  });
});
