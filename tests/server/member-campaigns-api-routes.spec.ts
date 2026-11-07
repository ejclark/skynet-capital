import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { serveMemberCampaignsApi } from "../../src/server/member-campaigns-api-routes.js";

/**
 * A member's own campaigns (#6949 slice 3a): WHEN a member submits the campaign form, the server
 * validates it through `parseCampaign`, stores it with the member as author, and returns it only to
 * that author's reads; the storyline is capped at 200 characters; the research it asks for is
 * recorded as an ask and starts nothing.
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
  const save = (form: unknown, who: unknown = ada, replaceId?: string) =>
    call("/api/campaigns/mine/save", post({ form, ...(replaceId ? { replaceId } : {}) }), who);
  const list = (who: unknown = ada) => call("/api/campaigns/mine", get(), who);

  it("claims only its paths, and nothing without a session", async () => {
    const { res } = fakeRes();
    expect(await serveMemberCampaignsApi(get(), res, "/api/board", config(), ada)).toBe(false);
    expect(
      await serveMemberCampaignsApi(get(), res, "/api/campaigns/mine", config(), undefined),
    ).toBe(false);
  });

  it("saves a valid form as the session's own private campaign", async () => {
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
        visibility: "private",
        researchAsk: ["CVX"],
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
});
