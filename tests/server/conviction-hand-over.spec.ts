import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { type SteeredByView, withOwnSteering } from "../../src/observatory/steered-by-view.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { heldConvictions } from "../../src/server/conviction-hand-over.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import {
  DRAFT_NOTE,
  STEERING_NOTE,
  serveMemberConvictionsApi,
  TOOK_BACK_NOTE,
} from "../../src/server/member-convictions-api-routes.js";
import { pointConvictions } from "../../src/server/subscription-seed-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";

/**
 * #5482 slice 6c, the HAND-OVER — a member hands a saved view to their bots with one tap: it takes
 * the `steering` status with the accounts the session owns that run its pairs, and those bots'
 * subscriptions point at it. Taking it back, editing it or deleting it drops those pointers, and a
 * pair the seeded view steered before returns to it. Only the member's own bots, only their own
 * views, and never two of their views on one pair.
 */

function fakeRes(): { res: ServerResponse; out: { status?: number; body?: string } } {
  const out: { status?: number; body?: string } = {};
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
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
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
const AI_DIP = CONVICTIONS.get("ai-dip-2026-10");

const draft = (title = "CRWV floor", steers = ["CRWV-WHEEL"]) => ({
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
  steers,
  narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] }],
});
const ID = "crwv-floor-2026-10";

describe("handing a member's view to their bots", () => {
  let dir: string;
  let store: MemberConvictionStore;
  let subs: SubscriptionStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-hand-over-"));
    store = new MemberConvictionStore(join(dir, "member-convictions.json"));
    subs = new SubscriptionStore(join(dir, "subscriptions.json"), undefined, () =>
      store.pointers(),
    );
    subs.subscribe("sauron", { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }, NOW);
    subs.subscribe("banker", { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }, NOW);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: (email: string) =>
        email === "ada@example.com" ? ["ada-human", "sauron"] : ["banker"],
      subscriptions: subs,
      memberConvictions: store,
      now: () => NOW,
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, req: IncomingMessage, who: unknown = ada) => {
    const { res, out } = fakeRes();
    await serveMemberConvictionsApi(req, res, path, config(), who as never);
    return JSON.parse(out.body || "{}");
  };
  const save = (body: unknown, who: unknown = ada) =>
    call("/api/convictions/save", post(body), who);
  const handOver = (id = ID, who: unknown = ada) =>
    call("/api/convictions/hand-over", post({ id }), who);
  const takeBack = (id = ID, who: unknown = ada) =>
    call("/api/convictions/take-back", post({ id }), who);
  const pointer = (account: string, pair = "CRWV-WHEEL") =>
    subs.load()[account]?.find((s) => s.playbookId === pair)?.convictionId;

  it("steers only the member's own bots that run its pairs, and says what it steers", async () => {
    expect((await save({ draft: draft() })).ok).toBe(true);
    const answer = await handOver();
    expect(answer).toEqual({
      ok: true,
      label: "SIM",
      steering: [{ pair: "CRWV-WHEEL", name: expect.stringContaining("CRWV") }],
      note: STEERING_NOTE,
    });
    // The record carries the accounts from the session — the human account runs nothing, so it is not one.
    expect(store.handedOver()).toEqual([
      { conviction: expect.objectContaining({ id: ID }), accounts: ["sauron"] },
    ]);
    expect(pointer("sauron")).toBe(ID);
    expect(pointer("banker")).toBeUndefined();
    const mine = await call("/api/convictions/mine", get());
    expect(mine.convictions[0]).toMatchObject({
      status: "steering",
      steering: [{ pair: "CRWV-WHEEL" }],
    });
  });

  it("takes it back: a draft again, and the pointer dropped", async () => {
    await save({ draft: draft() });
    await handOver();
    expect(await takeBack()).toEqual({ ok: true, label: "SIM", note: DRAFT_NOTE });
    expect(store.handedOver()).toEqual([]);
    expect(pointer("sauron")).toBeUndefined();
  });

  it("takes it back when it is edited, even under a new name, and says so", async () => {
    await save({ draft: draft() });
    await handOver();
    const edited = await save({ draft: draft("CRWV floor, revised"), replaceId: ID });
    expect(edited).toMatchObject({ ok: true, tookBack: true, note: TOOK_BACK_NOTE });
    expect(store.handedOver()).toEqual([]);
    expect(pointer("sauron")).toBeUndefined();
  });

  it("drops the pointer when a steering view is deleted", async () => {
    await save({ draft: draft() });
    await handOver();
    expect(await call("/api/convictions/delete", post({ id: ID }))).toEqual({ ok: true });
    expect(pointer("sauron")).toBeUndefined();
  });

  it("never hands over another member's view", async () => {
    await save({ draft: draft() });
    const answer = await handOver(ID, grace);
    expect(answer.ok).toBe(false);
    expect(answer.problems[0]).toMatch(/gone/);
    expect(store.list(opaqueMemberId("ada@example.com"))[0]?.status).toBe("draft");
  });

  it("refuses a view whose pair the member's bots no longer run", async () => {
    await save({ draft: draft() });
    subs.unsubscribe("sauron", "CRWV-WHEEL");
    const answer = await handOver();
    expect(answer.ok).toBe(false);
    expect(answer.problems.join(" ")).toMatch(/none of your bots runs .*CRWV/);
    expect(store.handedOver()).toEqual([]);
  });

  it("refuses a second view of theirs on a pair one already steers", async () => {
    await save({ draft: draft() });
    await save({ draft: draft("CRWV second look") });
    await handOver();
    const answer = await handOver("crwv-second-look-2026-10");
    expect(answer.ok).toBe(false);
    expect(answer.problems[0]).toMatch(/already steered by your view "CRWV floor"/);
    expect(pointer("sauron")).toBe(ID);
  });

  it("takes over from the seeded view, says so first, and returns the pair to it when taken back", async () => {
    subs.setConviction("sauron", "CRWV-WHEEL", {
      reason: "AI dip",
      checkOn: AI_DIP?.checkOn ?? "",
    });
    expect(pointer("sauron")).toBe("ai-dip-2026-10");
    await save({ draft: draft() });
    const before = await call("/api/convictions/mine", get());
    expect(before.convictions[0].takesOver).toEqual([
      { pair: "CRWV-WHEEL", name: expect.any(String), from: AI_DIP?.title },
    ]);
    await handOver();
    expect(pointer("sauron")).toBe(ID);
    // A restated conviction on the pair keeps the member's view while it is handed over.
    subs.setConviction("sauron", "CRWV-WHEEL", { reason: "AI dip", checkOn: "2027-03-31" });
    expect(pointer("sauron")).toBe(ID);
    await takeBack();
    subs.setConviction("sauron", "CRWV-WHEEL", {
      reason: "AI dip",
      checkOn: AI_DIP?.checkOn ?? "",
    });
    expect(pointer("sauron")).toBe("ai-dip-2026-10");
  });

  it("is finished by the next poll when the hand-over's own pointer write never landed", async () => {
    await save({ draft: draft() });
    store.handOver(opaqueMemberId("ada@example.com"), ID, ["sauron"], NOW);
    expect(pointer("sauron")).toBeUndefined();
    expect(pointConvictions(subs, NOW, store.pointers())).toEqual(["sauron/CRWV-WHEEL"]);
    expect(pointer("sauron")).toBe(ID);
  });

  it("is what /api/convictions and the member's own row read; a draft is neither", async () => {
    await save({ draft: draft() });
    expect(heldConvictions(store).get(ID)).toBeUndefined();
    await handOver();
    expect(heldConvictions(store).get(ID)?.owner).toBe("Ada Lovelace");
    const rows: { pairs: { id: string; steeredBy?: SteeredByView }[] }[] = [
      { pairs: [{ id: "CRWV-WHEEL" }] },
    ];
    const own = store.pointers().heldBy("sauron");
    const lookup = (id: string) => CONVICTIONS.get(id) ?? own.find((c) => c.id === id);
    const [onAda] = withOwnSteering(rows, subs.load().sauron ?? [], lookup);
    expect(onAda?.pairs[0]?.steeredBy).toMatchObject({ convictionId: ID, title: "CRWV floor" });
    // Grace's bot is not steered by it, so her row shows no view of Ada's.
    const [onBanker] = withOwnSteering(rows, subs.load().banker ?? [], () => undefined);
    expect(onBanker?.pairs[0]).toEqual({ id: "CRWV-WHEEL" });
  });
});
