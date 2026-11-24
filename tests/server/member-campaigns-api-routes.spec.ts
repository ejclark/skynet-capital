import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
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
 * it back as a draft. The question and communal suites live in
 * member-campaigns-discovery-routes.spec.ts and member-campaigns-communal-routes.spec.ts.
 */

plantHostileShelf();

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
      campaignShelfAnswered: OFF_SHELF,
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
