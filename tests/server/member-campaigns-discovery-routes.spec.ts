import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { DiscoveryQueueStore } from "../../src/server/discovery-queue-store.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { serveMemberCampaignsApi } from "../../src/server/member-campaigns-api-routes.js";
import {
  ADA,
  ada,
  FORM,
  fakeRes,
  grace,
  OFF_SHELF,
  plantHostileShelf,
  post,
} from "../support/member-campaigns-harness.js";

/** A question starts discovery (#6952 slices 2b and 2c), split out of member-campaigns-api-routes.spec.ts. */

plantHostileShelf();

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
      campaignShelfAnswered: OFF_SHELF,
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
    expect(answer.body).toMatchObject({ ok: true, status: "covered", cover: "house" });
    expect(answer.body.tell).toMatch(/energy-for-ai/);
    expect(queue.load()).toEqual([]);
  });

  it("marks a name the research shelf already holds as the house's cover, not a campaign's (#7443)", async () => {
    const answer = await askAbout(
      { kind: "name", subject: "AAPL" },
      ada,
      config({ campaignShelf: (s: string) => s === "AAPL" }),
    );
    expect(answer.body).toMatchObject({
      ok: true,
      status: "covered",
      cover: "house",
      campaign: "the research shelf",
    });
    expect(answer.body.tell).toMatch(/in the research shelf/);
    expect(queue.load()).toEqual([]);
  });

  it("keeps the member's cleaned words on a bare ask, so a question drafted in the chat reaches the list", async () => {
    const answer = await askAbout({
      kind: "name",
      subject: "PLTR",
      question: "  Why is it\nmoving   this week?  ",
    });
    expect(answer.body).toMatchObject({ ok: true, status: "queued" });
    expect(queue.load()).toMatchObject([
      { id: "name:PLTR", question: "Why is it moving this week?", askers: [ADA] },
    ]);
    expect(queue.load()[0]?.campaign).toBeUndefined();
  });

  it("caps a bare ask's words at 200 characters and keeps none when they are blank", async () => {
    await askAbout({ kind: "name", subject: "PLTR", question: "q".repeat(900) });
    await askAbout({ kind: "market", subject: "gold", question: "   " });
    expect(queue.load()[0]?.question).toHaveLength(200);
    expect(queue.load()[1]?.question).toBeUndefined();
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
      campaignShelfAnswered: OFF_SHELF,
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
