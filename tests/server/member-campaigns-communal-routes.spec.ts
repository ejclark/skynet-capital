import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CampaignQuestionsStore } from "../../src/server/campaign-questions-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { DiscoveryQueueStore } from "../../src/server/discovery-queue-store.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { serveMemberCampaignsApi } from "../../src/server/member-campaigns-api-routes.js";
import {
  ADA,
  ada,
  FORM,
  fakeRes,
  get,
  grace,
  OFF_SHELF,
  plantHostileShelf,
  post,
} from "../support/member-campaigns-harness.js";

/** Campaigns are communal (#6949 slice 6), split out of member-campaigns-api-routes.spec.ts. */

plantHostileShelf();

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
      campaignShelfAnswered: OFF_SHELF,
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
    expect(answer.body).toMatchObject({
      ok: true,
      status: "covered",
      campaign: "ev-pumps",
      cover: "party",
    });
    expect(answer.body.tell).toMatch(/"EV pumps", a campaign the party shares/);
    expect(queue.load()).toEqual([]);
  });

  it("still queues a saved campaign's own uncovered names: a campaign never covers itself", async () => {
    const answer = await save({ ...FORM, title: "EV pumps", symbols: ["XOM", "RIVN"] });
    expect(answer.body.discovery.status).toBe("queued");
    expect(queue.load().map((a) => a.id)).toContain("name:RIVN");
  });
});
