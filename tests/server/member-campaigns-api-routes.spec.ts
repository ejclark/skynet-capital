import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { CampaignQuestionsStore } from "../../src/server/campaign-questions-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { DiscoveryQueueStore } from "../../src/server/discovery-queue-store.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { serveMemberCampaignsApi } from "../../src/server/member-campaigns-api-routes.js";

/**
 * A member's own campaigns (#6949 slice 3a): WHEN a member submits the campaign form, the server
 * validates it through `parseCampaign`, stores it with the member as author, and returns it only to
 * that author's reads; the storyline is capped at 200 characters; the research it asks for is
 * recorded as an ask and starts nothing.
 *
 * Slice 3b: WHEN an author shares a campaign, every signed-in member's party read lists it with
 * the author's display name and a request with no session never gets it; WHEN the author takes it
 * back, other members' reads stop returning it; another member can never edit, delete, share or
 * unshare it.
 *
 * Slice 6 (criterion 8, amended 2026-11-07): a saved campaign is the party's unless its author holds
 * it back as a draft.
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
const ADA = opaqueMemberId("ada@example.com");

const FORM = {
  title: "Energy for AI",
  anchor: { kind: "sector", id: "Energy" },
  symbols: ["XOM", "CVX"],
  storyline: "Data centres need power; who keeps the windfall?",
  mode: "explore",
};

describe("serveMemberCampaignsApi", () => {
  let dir: string;
  let file: string;
  let store: MemberCampaignStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-campaigns-"));
    file = join(dir, "member-campaigns.json");
    store = new MemberCampaignStore(file);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      memberCampaigns: store,
      // The house has a ledger on XOM only, in this spec's world.
      campaignShelf: (symbol: string) => symbol === "XOM",
      ...over,
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, req: IncomingMessage, who: unknown = ada, cfg = config()) => {
    const { res, out } = fakeRes();
    const handled = await serveMemberCampaignsApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const save = (form: unknown, who: unknown = ada, replaceId?: string, draft?: boolean) =>
    call(
      "/api/campaigns/mine/save",
      post({
        form,
        ...(replaceId ? { replaceId } : {}),
        ...(draft === undefined ? {} : { draft }),
      }),
      who,
    );
  const list = (who: unknown = ada) => call("/api/campaigns/mine", get(), who);

  it("claims only its paths, and nothing without a session", async () => {
    const { res } = fakeRes();
    expect(await serveMemberCampaignsApi(get(), res, "/api/board", config(), ada)).toBe(false);
    expect(
      await serveMemberCampaignsApi(get(), res, "/api/campaigns/mine", config(), undefined),
    ).toBe(false);
  });

  it("saves a valid form as the session's own campaign, the party's by default", async () => {
    const answer = await save(FORM);
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({
      ok: true,
      campaign: {
        id: "energy-for-ai",
        title: "Energy for AI",
        anchor: { kind: "sector", name: "Energy", fund: "XLE" },
        cast: ["XOM", "CVX", "XLE"],
        mode: "explore",
        visibility: "party",
        researchAsk: ["CVX"],
        suggestions: [],
      },
    });
    const [kept] = store.list(ADA);
    expect(kept?.campaign.sector).toBe("Energy");
  });

  it("returns a campaign to its author and to nobody else", async () => {
    await save(FORM);
    expect((await list(ada)).body.campaigns.map((c: { id: string }) => c.id)).toEqual([
      "energy-for-ai",
    ]);
    expect((await list(grace)).body.campaigns).toEqual([]);
    // The author is the session, never a body field.
    await save({ ...FORM, author: "grace@example.com" });
    expect((await list(grace)).body.campaigns).toEqual([]);
  });

  it("hands the form its choices from the catalogs", async () => {
    const { body } = await list();
    expect(body.choices.sectors).toHaveLength(11);
    expect(body.choices.maxStoryline).toBe(200);
  });

  it("refuses a storyline over 200 characters, and writes nothing", async () => {
    const answer = await save({ ...FORM, storyline: "x".repeat(201) });
    expect(answer.body.ok).toBe(false);
    expect(answer.body.refusals).toEqual([
      expect.objectContaining({ field: "storyline", reason: expect.stringContaining("200") }),
    ]);
    expect(store.list(ADA)).toEqual([]);
  });

  it("refuses a second campaign with the same name, and Edit replaces the one named", async () => {
    await save(FORM);
    const twice = await save(FORM);
    expect(twice.body.refusals).toEqual([expect.objectContaining({ field: "title" })]);
    const edited = await save({ ...FORM, mode: "play" }, ada, "energy-for-ai");
    expect(edited.body.campaign.mode).toBe("play");
    expect(store.list(ADA)).toHaveLength(1);
  });

  it("answers 400 to a malformed body", async () => {
    expect((await save({ ...FORM, symbols: "XOM" })).status).toBe(400);
    expect((await call("/api/campaigns/mine/save", post("not json"))).status).toBe(400);
  });

  it("deletes only the author's own campaign", async () => {
    await save(FORM);
    await call("/api/campaigns/mine/delete", post({ id: "energy-for-ai" }), grace);
    expect(store.list(ADA)).toHaveLength(1);
    await call("/api/campaigns/mine/delete", post({ id: "energy-for-ai" }), ada);
    expect(store.list(ADA)).toEqual([]);
  });

  describe("sharing with the party", () => {
    const share = (id: string, shared: boolean, who: unknown = ada) =>
      call("/api/campaigns/mine/share", post({ id, shared }), who);
    const party = (who: unknown = grace) => call("/api/campaigns/party", get(), who);
    const ids = (answer: { body: { campaigns: { id: string }[] } }) =>
      answer.body.campaigns.map((c) => c.id);

    it("keeps a draft off the party read until its author shares it", async () => {
      const held = await save(FORM, ada, undefined, true);
      expect(held.body.campaign.visibility).toBe("draft");
      expect(ids(await party())).toEqual([]);
      const shared = await share("energy-for-ai", true);
      expect(shared.body).toMatchObject({
        ok: true,
        campaign: { id: "energy-for-ai", visibility: "party" },
      });
      const seen = await party();
      expect(seen.body.campaigns).toEqual([
        expect.objectContaining({
          id: "energy-for-ai",
          title: "Energy for AI",
          author: "Ada Lovelace",
          mine: false,
          cast: ["XOM", "CVX", "XLE"],
        }),
      ]);
      // The author reads the same list and is told which is theirs.
      expect((await party(ada)).body.campaigns[0].mine).toBe(true);
    });

    it("shows other members only what the story shows, never the author's form or ask", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      const [entry] = (await party()).body.campaigns;
      expect(Object.keys(entry).sort()).toEqual(
        ["anchor", "author", "cast", "id", "mine", "mode", "sharedAt", "storyline", "title"].sort(),
      );
    });

    it("never serves a shared campaign to a request with no session", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      const { res, out } = fakeRes();
      const handled = await serveMemberCampaignsApi(
        get(),
        res,
        "/api/campaigns/party",
        config(),
        undefined,
      );
      expect(handled).toBe(false);
      expect(out.body).toBeUndefined();
    });

    it("stops returning it to other members once the author takes it back", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      const back = await share("energy-for-ai", false);
      expect(back.body.campaign.visibility).toBe("draft");
      expect(ids(await party())).toEqual([]);
      expect(store.listShared()).toEqual([]);
      // The author still has it.
      expect(store.list(ADA)).toHaveLength(1);
    });

    it("keeps a shared campaign shared across the author's own edit", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      await save({ ...FORM, mode: "play" }, ada, "energy-for-ai");
      const [entry] = (await party()).body.campaigns;
      expect(entry).toMatchObject({ id: "energy-for-ai", mode: "play" });
    });

    it("lets only the author share, unshare, edit or delete it", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      const grab = await share("energy-for-ai", false, grace);
      expect(grab.body.ok).toBe(false);
      expect(ids(await party())).toEqual(["energy-for-ai"]);
      await call("/api/campaigns/mine/delete", post({ id: "energy-for-ai" }), grace);
      const edit = await save({ ...FORM, storyline: "mine now" }, grace, "energy-for-ai");
      expect(edit.body.ok).toBe(false);
      expect(store.list(ADA)[0]?.campaign.storyline).toBe(FORM.storyline);
      // Grace's own campaign with the same name is hers alone.
      await save(FORM, grace, undefined, true);
      expect(store.list(opaqueMemberId("grace@example.com"))).toHaveLength(1);
      expect(ids(await party())).toEqual(["energy-for-ai"]);
    });

    it("drops a shared campaign from the party read when the author deletes it", async () => {
      await save(FORM);
      await share("energy-for-ai", true);
      await call("/api/campaigns/mine/delete", post({ id: "energy-for-ai" }), ada);
      expect(ids(await party())).toEqual([]);
    });

    it("falls back to a neutral author name when the session has none", async () => {
      const nameless = { email: "nameless@example.com" } as never;
      await save(FORM, nameless);
      await share("energy-for-ai", true, nameless);
      expect((await party()).body.campaigns[0].author).toBe("A member");
    });

    it("answers 400 to a malformed share body, and not-found for a campaign that isn't theirs", async () => {
      expect((await call("/api/campaigns/mine/share", post({ id: "x" }))).status).toBe(400);
      expect((await share("nope", true)).body.ok).toBe(false);
    });

    it("serves the party read by GET only", async () => {
      const { res, out } = fakeRes();
      await serveMemberCampaignsApi(post({}), res, "/api/campaigns/party", config(), grace);
      expect(out.status).toBe(405);
    });
  });

  it("answers not-wired when the deployment has no store", async () => {
    const answer = await call(
      "/api/campaigns/mine/save",
      post({ form: FORM }),
      ada,
      config({ memberCampaigns: undefined }),
    );
    expect(answer.body).toEqual({ ok: false, error: "Campaigns aren't wired in this deployment." });
  });
});

describe("MemberCampaignStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-campaigns-store-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("drops a stored record the campaign parser refuses, rather than serving it", async () => {
    const file = join(dir, "member-campaigns.json");
    const store = new MemberCampaignStore(file);
    const { res } = fakeRes();
    await serveMemberCampaignsApi(
      post({ form: FORM }),
      res,
      "/api/campaigns/mine/save",
      { memberCampaigns: store, campaignShelf: () => true } as unknown as DashboardServerConfig,
      ada,
    );
    const onDisk = JSON.parse(readFileSync(file, "utf8"));
    onDisk[ADA][0].campaign.storyline = "y".repeat(201);
    writeFileSync(file, JSON.stringify(onDisk));
    expect(new MemberCampaignStore(file).list(ADA)).toEqual([]);
  });

  it("reads a record with half a share (a date and no name) as a draft", async () => {
    const file = join(dir, "member-campaigns.json");
    const store = new MemberCampaignStore(file);
    const { res } = fakeRes();
    await serveMemberCampaignsApi(
      post({ form: FORM }),
      res,
      "/api/campaigns/mine/save",
      { memberCampaigns: store, campaignShelf: () => true } as unknown as DashboardServerConfig,
      ada,
    );
    const onDisk = JSON.parse(readFileSync(file, "utf8"));
    expect(onDisk[ADA][0].sharedAt).toEqual(expect.any(String));
    delete onDisk[ADA][0].sharedBy;
    writeFileSync(file, JSON.stringify(onDisk));
    expect(new MemberCampaignStore(file).listShared()).toEqual([]);
  });
});

describe("a question starts discovery (#6952 slice 2b)", () => {
  let dir: string;
  let queue: DiscoveryQueueStore;
  let campaigns: MemberCampaignStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-discovery-routes-"));
    queue = new DiscoveryQueueStore(join(dir, "discovery-queue.json"));
    campaigns = new MemberCampaignStore(join(dir, "member-campaigns.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      memberCampaigns: campaigns,
      discoveryQueue: queue,
      campaignShelf: (symbol: string) => symbol === "XOM",
      discoveryPerPass: 6,
      ...over,
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, req: IncomingMessage, who: unknown = ada, cfg = config()) => {
    const { res, out } = fakeRes();
    const handled = await serveMemberCampaignsApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const askAbout = (body: unknown, who: unknown = ada, cfg = config()) =>
    call("/api/campaigns/ask", post(body), who, cfg);

  it("queues a name no campaign covers and tells the member it is queued", async () => {
    const answer = await askAbout({ kind: "name", subject: "pltr" });
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({ ok: true, status: "queued" });
    expect(answer.body.tell).toMatch(/^Queued\. It is next in line .* runs once a day/);
    expect(queue.load().map((a) => a.id)).toEqual(["name:PLTR"]);
    expect(queue.load()[0]?.askers).toEqual([ADA]);
  });

  it("queues a sector or a market no campaign covers, by the names the catalogs use", async () => {
    expect((await askAbout({ kind: "sector", subject: "healthcare" })).body.status).toBe("queued");
    expect((await askAbout({ kind: "market", subject: "gold" })).body.status).toBe("queued");
    expect(queue.load().map((a) => a.id)).toEqual(["sector:Healthcare", "market:gold"]);
  });

  it("starts nothing for a subject a campaign covers", async () => {
    const answer = await askAbout({ kind: "sector", subject: "Utilities" });
    expect(answer.body).toMatchObject({ ok: true, status: "covered" });
    expect(answer.body.tell).toMatch(/energy-for-ai/);
    expect(queue.load()).toEqual([]);
  });

  it("lets a second member join the same question instead of queueing it twice", async () => {
    await askAbout({ kind: "name", subject: "PLTR" });
    const answer = await askAbout({ kind: "name", subject: "PLTR" }, grace);
    expect(answer.body.status).toBe("joined");
    expect(queue.load()).toHaveLength(1);
    expect(queue.load()[0]?.askers).toHaveLength(2);
  });

  it("counts the research passes in days for a deep ask, from the lane's per-pass number", async () => {
    for (const s of ["AA", "BB", "CC"]) await askAbout({ kind: "name", subject: s });
    const answer = await askAbout(
      { kind: "name", subject: "DD" },
      ada,
      config({ discoveryPerPass: 2 }),
    );
    // The discovery lane reads the queue once a day (#7034 slice 3b): 3 ahead at 2 a pass is 2 passes.
    expect(answer.body.tell).toMatch(/3 ahead of it, so about 2 research passes .* once a day/);
  });

  it("refuses a malformed or unknown ask with 400 and writes nothing", async () => {
    for (const bad of [
      { kind: "name", subject: "not a ticker!" },
      { kind: "sector", subject: "Mordor" },
      { kind: "market", subject: "nope" },
      { kind: "planet", subject: "X" },
      { kind: "name" },
    ]) {
      expect((await askAbout(bad)).status).toBe(400);
    }
    expect(queue.load()).toEqual([]);
  });

  it("answers not-wired, and writes nothing, when the queue is off", async () => {
    const answer = await askAbout(
      { kind: "name", subject: "PLTR" },
      ada,
      config({ discoveryQueue: undefined }),
    );
    expect(answer.body).toMatchObject({ ok: false });
    expect(queue.load()).toEqual([]);
  });

  it("is a member route: no session, no route", async () => {
    const { res } = fakeRes();
    expect(
      await serveMemberCampaignsApi(
        post({ kind: "name", subject: "PLTR" }),
        res,
        "/api/campaigns/ask",
        config(),
        undefined,
      ),
    ).toBe(false);
  });

  it("queues the uncovered names of a saved campaign and tells the author", async () => {
    const form = {
      title: "My watchlist",
      anchor: { kind: "sector", id: "Energy" },
      symbols: ["XOM", "RIVN"],
      storyline: "Where the EV pull hits the pumps.",
      mode: "explore",
    };
    const answer = await call("/api/campaigns/mine/save", post({ form }));
    expect(answer.body.ok).toBe(true);
    expect(answer.body.discovery.status).toBe("queued");
    expect(queue.load().map((a) => a.id)).toEqual(["name:RIVN"]);
  });

  it("a saved campaign whose names are all covered queues nothing and says nothing", async () => {
    const form = {
      title: "Plain oil",
      anchor: { kind: "sector", id: "Energy" },
      symbols: ["XOM", "CVX"],
      storyline: "The majors.",
      mode: "play",
    };
    const answer = await call("/api/campaigns/mine/save", post({ form }));
    expect(answer.body.ok).toBe(true);
    expect(answer.body.discovery).toMatchObject({ status: "covered" });
    expect(queue.load()).toEqual([]);
  });

  it("saves fine, queueing nothing, when the queue is off", async () => {
    const form = {
      title: "No queue",
      anchor: { kind: "sector", id: "Energy" },
      symbols: ["XOM", "RIVN"],
      storyline: "Offline.",
      mode: "explore",
    };
    const answer = await call(
      "/api/campaigns/mine/save",
      post({ form }),
      ada,
      config({ discoveryQueue: undefined }),
    );
    expect(answer.body.ok).toBe(true);
    expect(answer.body.discovery).toBeUndefined();
  });

  it("stops one member taking every slot, and says so", async () => {
    for (const t of ["AA", "BB", "CC", "DD", "EE"]) await askAbout({ kind: "name", subject: t });
    const answer = await askAbout({ kind: "name", subject: "FF" });
    expect(answer.body).toMatchObject({ ok: true, status: "limit" });
    expect(answer.body.tell).toMatch(/already have 5 questions/);
    expect(queue.load()).toHaveLength(5);
    expect((await askAbout({ kind: "name", subject: "FF" }, grace)).body.status).toBe("queued");
  });

  it("says so when a saved campaign's names were only partly taken", async () => {
    for (const t of ["AA", "BB", "CC", "DD"]) await askAbout({ kind: "name", subject: t });
    const form = {
      title: "Many",
      anchor: { kind: "sector", id: "Energy" },
      symbols: ["RIVN", "LCID"],
      storyline: "Two new ones.",
      mode: "explore",
    };
    const answer = await call("/api/campaigns/mine/save", post({ form }));
    expect(answer.body.discovery.status).toBe("queued");
    expect(answer.body.discovery.tell).toMatch(/1 more couldn't be taken/);
  });

  it("writes the queue only when it changed", async () => {
    await askAbout({ kind: "sector", subject: "Utilities" });
    expect(existsSync(join(dir, "discovery-queue.json"))).toBe(false);
  });

  it("still saves the campaign when the queue can't be written", async () => {
    const broken = {
      load: () => [],
      write: () => {
        throw new Error("disk full");
      },
    };
    const form = {
      title: "Disk full",
      anchor: { kind: "sector", id: "Energy" },
      symbols: ["XOM", "RIVN"],
      storyline: "Write fails.",
      mode: "explore",
    };
    const answer = await call(
      "/api/campaigns/mine/save",
      post({ form }),
      ada,
      config({ discoveryQueue: broken }),
    );
    expect(answer.status).toBe(200);
    expect(answer.body.ok).toBe(true);
    expect(answer.body.discovery).toBeUndefined();
    expect(campaigns.list(ADA)).toHaveLength(1);
  });
});

describe("a question asked inside a campaign (#6952 slice 2c)", () => {
  let dir: string;
  let queue: DiscoveryQueueStore;
  let campaigns: MemberCampaignStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-campaign-ask-"));
    queue = new DiscoveryQueueStore(join(dir, "discovery-queue.json"));
    campaigns = new MemberCampaignStore(join(dir, "member-campaigns.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const cfg = (): DashboardServerConfig =>
    ({
      memberCampaigns: campaigns,
      discoveryQueue: queue,
      campaignShelf: () => false,
      discoveryPerPass: 6,
    }) as unknown as DashboardServerConfig;
  const askIn = async (body: unknown, who: unknown = ada) => {
    const { res, out } = fakeRes();
    await serveMemberCampaignsApi(post(body), res, "/api/campaigns/ask", cfg(), who as never);
    return { status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const saveAs = async (who: unknown, title: string, draft?: boolean) => {
    const { res } = fakeRes();
    await serveMemberCampaignsApi(
      post({ form: { ...FORM, title, symbols: ["XOM"] }, ...(draft ? { draft } : {}) }),
      res,
      "/api/campaigns/mine/save",
      cfg(),
      who as never,
    );
  };
  const shareAs = async (who: unknown, id: string) => {
    const { res } = fakeRes();
    await serveMemberCampaignsApi(
      post({ id, shared: true }),
      res,
      "/api/campaigns/mine/share",
      cfg(),
      who as never,
    );
  };

  it("queues a covered name when asked inside the house campaign that covers it, with the words", async () => {
    const bare = await askIn({ kind: "name", subject: "NVDA" });
    expect(bare.body.status).toBe("covered");
    const answer = await askIn({
      kind: "name",
      subject: "NVDA",
      campaign: "ai-buildout",
      question: "  Who\nsupplies   its power?  ",
    });
    expect(answer.body).toMatchObject({ ok: true, status: "queued" });
    expect(queue.load()).toMatchObject([
      {
        id: "ai-buildout/name:NVDA",
        campaign: "ai-buildout",
        question: "Who supplies its power?",
        askers: [ADA],
      },
    ]);
  });

  it("reads a member campaign that shares a house campaign's id as the house one", async () => {
    await saveAs(ada, "Energy for AI");
    await askIn({ kind: "name", subject: "PLTR", campaign: "energy-for-ai" }, grace);
    expect(queue.load()[0]?.campaign).toBe("energy-for-ai");
  });

  it("caps the words at 200 characters", async () => {
    await askIn({
      kind: "name",
      subject: "NVDA",
      campaign: "ai-buildout",
      question: "q".repeat(900),
    });
    expect(queue.load()[0]?.question).toHaveLength(200);
  });

  it("lets a second member asking the same thing in the same campaign join the first", async () => {
    await askIn({ kind: "name", subject: "NVDA", campaign: "ai-buildout", question: "First" });
    const answer = await askIn(
      { kind: "name", subject: "NVDA", campaign: "ai-buildout", question: "Second" },
      grace,
    );
    expect(answer.body.status).toBe("joined");
    expect(queue.load()).toHaveLength(1);
    expect(queue.load()[0]).toMatchObject({ question: "First" });
    expect(queue.load()[0]?.askers).toHaveLength(2);
  });

  it("scopes an ask in a campaign a member shared with the party, for every member", async () => {
    await saveAs(ada, "Grid watchers");
    const id = campaigns.list(ADA)[0]?.campaign.id as string;
    await shareAs(ada, id);
    const answer = await askIn(
      { kind: "name", subject: "PLTR", campaign: id, question: "Why?" },
      grace,
    );
    expect(answer.body).toMatchObject({ ok: true, status: "queued" });
    expect(queue.load()[0]?.campaign).toBe(`${ADA}~${id}`);
  });

  it("answers a member's own draft for them, and never for another member", async () => {
    await saveAs(ada, "Private notes", true);
    const id = campaigns.list(ADA)[0]?.campaign.id as string;
    const mine = await askIn({ kind: "name", subject: "PLTR", campaign: id }, ada);
    expect(mine.body.ok).toBe(true);
    const theirs = await askIn({ kind: "name", subject: "PLTR", campaign: id }, grace);
    expect(theirs.body).toMatchObject({ ok: false });
    // The same words as a campaign that doesn't exist, so a private one is never confirmed.
    const nowhere = await askIn(
      { kind: "name", subject: "PLTR", campaign: "no-such-campaign" },
      grace,
    );
    expect(nowhere.body).toEqual(theirs.body);
    expect(queue.load().map((a) => a.askers)).toEqual([[ADA]]);
  });

  it("refuses an over-long or non-string campaign id and writes nothing", async () => {
    for (const bad of ["x".repeat(61), 5, ""]) {
      expect((await askIn({ kind: "name", subject: "PLTR", campaign: bad })).body.ok).toBe(false);
    }
    expect(queue.load()).toEqual([]);
  });

  it("keeps the per-member bound for asks inside a campaign", async () => {
    for (const t of ["AA", "BB", "CC", "DD", "EE"])
      await askIn({ kind: "name", subject: t, campaign: "ai-buildout" });
    const answer = await askIn({ kind: "name", subject: "FF", campaign: "ai-buildout" });
    expect(answer.body).toMatchObject({ ok: true, status: "limit" });
    expect(queue.load()).toHaveLength(5);
  });
});

describe("campaigns are communal (#6949 slice 6, criteria 8, 10, 11)", () => {
  let dir: string;
  let queue: DiscoveryQueueStore;
  let campaigns: MemberCampaignStore;
  let questions: CampaignQuestionsStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-communal-"));
    queue = new DiscoveryQueueStore(join(dir, "discovery-queue.json"));
    campaigns = new MemberCampaignStore(join(dir, "member-campaigns.json"));
    questions = new CampaignQuestionsStore(join(dir, "campaign-questions.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const bob = { email: "bob@example.com", name: "Bob" } as never;
  // `energy-for-ai` is also a house campaign's id, and a house id wins, so this suite's own differs.
  const GAS = { ...FORM, title: "Gas for AI" };
  const FOUND = {
    id: "nvda-power",
    kind: "tested",
    idea: "NVDA's buyers are short of power, not chips.",
    symbols: ["NVDA"],
    on: "2026-11-08",
    falsifier: "PJM capacity clears below last year's price.",
    source: "docs/research/ai-energy-constraint.md",
    answers: "ai-buildout/name:NVDA",
  };
  const cfg = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      memberCampaigns: campaigns,
      discoveryQueue: queue,
      campaignQuestions: questions,
      campaignShelf: () => false,
      discoveryPerPass: 6,
      campaignFindings: (campaign: string, ask: string) =>
        campaign === "ai-buildout" && ask === FOUND.answers ? [FOUND] : [],
      ...over,
    }) as unknown as DashboardServerConfig;
  const call = async (path: string, req: IncomingMessage, who: unknown = ada) => {
    const { res, out } = fakeRes();
    const handled = await serveMemberCampaignsApi(req, res, path, cfg(), who as never);
    return { handled, raw: out.body ?? "", body: JSON.parse(out.body || "{}") };
  };
  const getAt = (url: string): IncomingMessage => {
    const req = get();
    req.url = url;
    return req;
  };
  const save = (form: unknown, who: unknown = ada, draft?: boolean) =>
    call("/api/campaigns/mine/save", post({ form, ...(draft ? { draft } : {}) }), who);
  const askIn = (campaign: string, subject: string, who: unknown, question?: string) =>
    call(
      "/api/campaigns/ask",
      post({ kind: "name", subject, campaign, ...(question ? { question } : {}) }),
      who,
    );
  const questionsIn = (campaign: string, who: unknown = bob) =>
    call("/api/campaigns/questions", getAt(`/api/campaigns/questions?campaign=${campaign}`), who);

  it("puts a saved campaign in front of the party, and a draft in front of nobody else", async () => {
    await save(GAS);
    await save({ ...GAS, title: "Held back" }, ada, true);
    const party = await call("/api/campaigns/party", get(), bob);
    expect(party.body.campaigns.map((c: { id: string }) => c.id)).toEqual(["gas-for-ai"]);
    expect(party.body.campaigns[0].author).toBe("Ada Lovelace");
  });

  it("shows every member who can read a campaign the question, who asked it and that it waits", async () => {
    await save(GAS);
    await askIn("gas-for-ai", "XOM", grace, "Who wins if gas stays cheap?");
    for (const reader of [ada, bob, grace]) {
      const { body } = await questionsIn("gas-for-ai", reader);
      expect(body.questions).toEqual([
        expect.objectContaining({
          subject: "XOM",
          question: "Who wins if gas stays cheap?",
          askedBy: ["Grace"],
          state: "waiting",
          ahead: 0,
          found: [],
          suggestion: false,
        }),
      ]);
    }
  });

  it("adds a second asker by name instead of a second question", async () => {
    await askIn("ai-buildout", "NVDA", grace, "First");
    await askIn("ai-buildout", "NVDA", bob, "Second");
    const { body } = await questionsIn("ai-buildout", ada);
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0]).toMatchObject({ question: "First", askedBy: ["Grace", "Bob"] });
  });

  it("shows what a question's research found, beside the question", async () => {
    await askIn("ai-buildout", "NVDA", grace, "Is power the real limit?");
    const { body } = await questionsIn("ai-buildout");
    expect(body.questions[0]).toMatchObject({
      state: "found",
      found: [
        {
          kind: "tested",
          idea: FOUND.idea,
          falsifier: FOUND.falsifier,
          source: FOUND.source,
          on: "2026-11-08",
        },
      ],
    });
  });

  it("keeps a question after the research lane takes it from the queue", async () => {
    await askIn("ai-buildout", "AMD", grace);
    queue.write([]);
    const { body } = await questionsIn("ai-buildout");
    expect(body.questions).toEqual([
      expect.objectContaining({ subject: "AMD", askedBy: ["Grace"], state: "no-finding-yet" }),
    ]);
  });

  it("never puts an email in a response, even when the session's name is one", async () => {
    const mailer = { email: "mail@example.com", name: "mail@example.com" } as never;
    await save(GAS, mailer);
    await askIn("gas-for-ai", "XOM", mailer, "Mine?");
    const party = await call("/api/campaigns/party", get(), bob);
    const asked = await questionsIn("gas-for-ai");
    expect(party.body.campaigns[0].author).toBe("A member");
    expect(asked.body.questions[0].askedBy).toEqual(["A member"]);
    for (const answer of [party, asked]) expect(answer.raw).not.toMatch(/@/);
  });

  it("answers another member's draft the same as a campaign that doesn't exist", async () => {
    await save(GAS, ada, true);
    await askIn("gas-for-ai", "XOM", ada, "Note to self");
    const theirs = await questionsIn("gas-for-ai", grace);
    const nowhere = await questionsIn("no-such-campaign", grace);
    expect(theirs.body).toMatchObject({ ok: false });
    expect(theirs.body).toEqual(nowhere.body);
    // The author reads their own draft's questions.
    expect((await questionsIn("gas-for-ai", ada)).body.questions).toHaveLength(1);
  });

  it("serves a campaign's questions to signed-in members only, by GET only", async () => {
    await askIn("ai-buildout", "NVDA", grace, "Why?");
    const { res, out } = fakeRes();
    const handled = await serveMemberCampaignsApi(
      getAt("/api/campaigns/questions?campaign=ai-buildout"),
      res,
      "/api/campaigns/questions",
      cfg(),
      undefined,
    );
    expect(handled).toBe(false);
    expect(out.body).toBeUndefined();
    const posted = fakeRes();
    await serveMemberCampaignsApi(post({}), posted.res, "/api/campaigns/questions", cfg(), bob);
    expect(posted.out.status).toBe(405);
  });

  it("brings a question outside the cast to the author as a suggestion, and never edits the campaign", async () => {
    await save(GAS);
    await askIn("gas-for-ai", "NEE", grace, "Should utilities be in this?");
    const mine = await call("/api/campaigns/mine", get(), ada);
    const [own] = mine.body.campaigns;
    expect(own.cast).toEqual(["XOM", "CVX", "XLE"]);
    expect(own.suggestions).toEqual([
      expect.objectContaining({ subject: "NEE", askedBy: ["Grace"], suggestion: true }),
    ]);
    expect(campaigns.list(ADA)[0]?.campaign.title).toBe("Gas for AI");
    // Once the author adds the name, it is no longer a suggestion: the author's act settles it.
    await call(
      "/api/campaigns/mine/save",
      post({ form: { ...GAS, symbols: ["XOM", "CVX", "NEE"] }, replaceId: "gas-for-ai" }),
      ada,
    );
    const after = await call("/api/campaigns/mine", get(), ada);
    expect(after.body.campaigns[0].suggestions).toEqual([]);
  });

  it("points a bare question about a party campaign's name at that campaign", async () => {
    await save({ ...FORM, title: "EV pumps", symbols: ["XOM", "RIVN"] });
    queue.write([]);
    const answer = await call("/api/campaigns/ask", post({ kind: "name", subject: "RIVN" }), grace);
    expect(answer.body).toMatchObject({ ok: true, status: "covered", campaign: "ev-pumps" });
    expect(answer.body.tell).toMatch(/"EV pumps", a campaign the party shares/);
    expect(queue.load()).toEqual([]);
  });

  it("still queues a saved campaign's own uncovered names: a campaign never covers itself", async () => {
    const answer = await save({ ...FORM, title: "EV pumps", symbols: ["XOM", "RIVN"] });
    expect(answer.body.discovery.status).toBe("queued");
    expect(queue.load().map((a) => a.id)).toContain("name:RIVN");
  });
});
