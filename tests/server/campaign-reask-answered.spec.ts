import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { planPass } from "../../src/domain/discovery-pass.js";
import { CampaignQuestionsStore } from "../../src/server/campaign-questions-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { DiscoveryQueueStore } from "../../src/server/discovery-queue-store.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { serveMemberCampaignsApi } from "../../src/server/member-campaigns-api-routes.js";

/**
 * A RE-ASK OF A SUBJECT ALREADY ON THE RESEARCH SHELF (#7333). The research lane wrote up Ada's NVDA
 * question in the house campaign ai-buildout; Grace then asks about NVDA in that campaign.
 *
 * WHEN a member asks about a campaign-and-subject whose write-up is on the shelf, the reply names
 * that write-up and is never "queued"; WHEN the reply is "queued" or "joined", the next research pass
 * takes the ask; WHILE an ask waits, a later queue write keeps it. The same holds for a bare sector
 * ask. The builder's choice: a re-ask joins the existing write-up (the lane never re-opens one).
 */

interface Answer {
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead() {
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(method: "GET" | "POST", body: unknown, url = ""): IncomingMessage {
  const req = Readable.from([
    method === "POST" ? JSON.stringify(body) : "",
  ]) as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = method === "POST" ? { "content-type": "application/json" } : {};
  return req;
}

const grace = { email: "grace@example.com", name: "Grace" } as never;
const bob = { email: "bob@example.com", name: "Bob" } as never;

/** The shelf as the lane left it: Ada's NVDA question in ai-buildout, a bare Healthcare and SNOW ask. */
const SHELF = new Set(["ai-buildout/name:NVDA", "sector:Healthcare", "name:SNOW"]);
const onShelf = (ask: { kind: string; subject: string; campaign?: string }): boolean =>
  SHELF.has(
    ask.campaign ? `${ask.campaign}/${ask.kind}:${ask.subject}` : `${ask.kind}:${ask.subject}`,
  );

describe("asking again about a subject already written up (#7333)", () => {
  let dir: string;
  let queue: DiscoveryQueueStore;
  let questions: CampaignQuestionsStore;
  let cfg: DashboardServerConfig;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-reask-"));
    queue = new DiscoveryQueueStore(join(dir, "discovery-queue.json"));
    questions = new CampaignQuestionsStore(join(dir, "campaign-questions.json"));
    cfg = {
      memberCampaigns: new MemberCampaignStore(join(dir, "member-campaigns.json")),
      discoveryQueue: queue,
      campaignQuestions: questions,
      campaignShelf: () => false,
      campaignShelfAnswered: onShelf,
      campaignFindings: () => [],
      discoveryPerPass: 6,
    } as unknown as DashboardServerConfig;
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const ask = async (body: unknown, who: unknown) => {
    const { res, out } = fakeRes();
    await serveMemberCampaignsApi(
      request("POST", body),
      res,
      "/api/campaigns/ask",
      cfg,
      who as never,
    );
    return JSON.parse(out.body || "{}");
  };
  const nextPass = () =>
    planPass({
      queue: queue.load(),
      ceiling: 6,
      spentByEvents: 0,
      answered: onShelf,
      openHeads: [],
    });

  it("joins Grace to the NVDA write-up instead of telling her it is queued", async () => {
    const reply = await ask(
      {
        kind: "name",
        subject: "NVDA",
        campaign: "ai-buildout",
        question: "Does power cap its sales?",
      },
      grace,
    );
    expect(reply).toMatchObject({
      ok: true,
      status: "answered",
      writeUp: "docs/research/discovery/name-nvda-in-ai-buildout.md",
    });
    expect(reply.tell).toContain("already wrote up NVDA");
    expect(reply.tell).not.toContain("Queued");
    // Nothing waits that no pass would take.
    expect(queue.load()).toEqual([]);
    expect(nextPass()).toEqual([]);
  });

  it("shows Grace on the question in the campaign's list, written up on the shelf", async () => {
    await ask({ kind: "name", subject: "NVDA", campaign: "ai-buildout" }, grace);
    const { res, out } = fakeRes();
    await serveMemberCampaignsApi(
      request("GET", undefined, "/api/campaigns/questions?campaign=ai-buildout"),
      res,
      "/api/campaigns/questions",
      cfg,
      grace,
    );
    const body = JSON.parse(out.body || "{}");
    expect(body.questions).toMatchObject([
      { subject: "NVDA", askedBy: ["Grace"], state: "on-the-shelf" },
    ]);
  });

  it("a queued reply is one the next pass takes, and a later queue write keeps it", async () => {
    const reply = await ask({ kind: "name", subject: "AMD", campaign: "ai-buildout" }, grace);
    expect(reply.status).toBe("queued");
    await ask({ kind: "name", subject: "PLTR" }, bob);
    expect(queue.load().map((a) => a.id)).toEqual(["ai-buildout/name:AMD", "name:PLTR"]);
    expect(nextPass().map((t) => t.id)).toContain("ai-buildout/name:AMD");
  });

  it("answers a bare sector ask already on the shelf the same way", async () => {
    const reply = await ask({ kind: "sector", subject: "Healthcare" }, bob);
    expect(reply).toMatchObject({
      status: "answered",
      writeUp: "docs/research/discovery/sector-healthcare.md",
    });
    expect(queue.load()).toEqual([]);
  });

  it("a saved campaign's research ask already on the shelf is answered, not queued", async () => {
    const { res, out } = fakeRes();
    const form = {
      title: "Data clouds",
      anchor: { kind: "sector", id: "Technology" },
      symbols: ["SNOW"],
      storyline: "Who stores the data the models eat?",
      mode: "explore",
    };
    await serveMemberCampaignsApi(
      request("POST", { form }),
      res,
      "/api/campaigns/mine/save",
      cfg,
      bob,
    );
    expect(JSON.parse(out.body || "{}").discovery).toMatchObject({
      status: "answered",
      writeUp: "docs/research/discovery/name-snow.md",
    });
    expect(queue.load()).toEqual([]);
  });
});
