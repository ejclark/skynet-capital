import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ShadowReport } from "../../src/autonomous/authored-shadow-wire.js";
import { runnableSpecs } from "../../src/playbooks/authored-play-draft.js";
import { emptyForm } from "../../src/playbooks/authored-play-form.js";
import { AuthoredPlayStore, PROMOTED_LOCK } from "../../src/server/authored-play-store.js";
import { serveAuthoredPlaysApi } from "../../src/server/authored-plays-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";

/**
 * PROMOTING A PLAY (#5457 slice 3) at the API: a passing shadow test is the only way in, the
 * author's own bot is the only place it lands, it enters through the normal subscription store, and
 * pausing it keeps it compiled so its exits keep running.
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
const ME = opaqueMemberId("ada@example.com");
const ID = "U-sauron-my-nvda-run-up";
const FORM = {
  ...emptyForm("sauron"),
  name: "My NVDA run-up",
  symbol: "NVDA",
  thesis: "Long the drift into the print, out before the dead final week.",
};

const entry = (since: string, over: Record<string, unknown> = {}): ShadowReport => ({
  kind: "authored-shadow.v1",
  at: 1,
  plays: [
    {
      id: ID,
      since,
      state: "watching",
      window: "long",
      sessions: 10,
      tradeCount: 2,
      roundTrips: 1,
      realized: 12,
      refused: 0,
      recent: [],
      ...over,
    },
  ],
});

describe("promoting a play that passed its shadow test", () => {
  let dir: string;
  let store: AuthoredPlayStore;
  let subs: SubscriptionStore;
  let report: ShadowReport | undefined;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-promote-api-"));
    store = new AuthoredPlayStore(join(dir, "authored-plays.json"));
    subs = new SubscriptionStore(join(dir, "subscriptions.json"));
    report = undefined;
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: () => ["sauron", "human-ada"],
      authoredPlays: store,
      subscriptions: subs,
      readAuthoredShadow: () => report,
      hub: {
        getState: () => ({
          participants: [
            { id: "sauron", kind: "bot" },
            { id: "human-ada", kind: "human" },
          ],
        }),
      },
      ...over,
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, req: IncomingMessage, cfg = config(), who: unknown = ada) => {
    const { res, out } = fakeRes();
    await serveAuthoredPlaysApi(req, res, path, cfg, who as never);
    return { status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const promote = (on: unknown, cfg = config(), who: unknown = ada, id = ID) =>
    call("/api/authored-plays/promote", post({ id, on }), cfg, who);

  /** A saved play in its shadow test, with the bots' report for exactly this test. */
  async function testing(over: Record<string, unknown> = {}) {
    await call("/api/authored-plays/save", post({ form: FORM }));
    const started = await call("/api/authored-plays/shadow", post({ id: ID, on: true }));
    report = entry(started.body.play.shadow.since, over);
  }

  it("a passing test promotes: the first trading status, a subscription on the author's own bot", async () => {
    await testing();
    const answer = await promote(true);
    expect(answer.body.ok).toBe(true);
    expect(answer.body.play).toMatchObject({
      id: ID,
      status: "promoted",
      trading: { running: true },
    });
    expect(store.list(ME)[0]?.status).toBe("promoted");
    expect(runnableSpecs(store.list(ME)).map((s) => s.slug)).toEqual(["my-nvda-run-up"]);
    expect(subs.load().sauron).toEqual([
      expect.objectContaining({ playbookId: ID, mode: "standard", enabled: true }),
    ]);
    // ...and nowhere else: no other account holds a subscription to it.
    expect(Object.keys(subs.load())).toEqual(["sauron"]);
  });

  it("each edge of the bar refuses with the sentence that names it, and writes nothing", async () => {
    for (const [over, words] of [
      [{ sessions: 9 }, "1 more session to watch"],
      [{ roundTrips: 0 }, "hasn't bought and sold yet"],
      [{ refused: 1 }, "A guard refused it 1 time"],
      [{ state: "invalid" }, "no longer clears the limits"],
    ] as const) {
      await testing(over);
      const answer = await promote(true);
      expect(answer.body.ok).toBe(false);
      expect(answer.body.error).toContain(words);
      expect(store.list(ME)[0]?.status).toBe("shadow");
      expect(subs.load()).toEqual({});
      await call("/api/authored-plays/shadow", post({ id: ID, on: false }));
      await call("/api/authored-plays/delete", post({ id: ID }));
    }
  });

  it("a test the bots have not reported on, or reported for an earlier start, is not a pass", async () => {
    await testing();
    report = undefined;
    expect((await promote(true)).body.error).toContain("10 more sessions");
    report = entry("2026-01-01T00:00:00.000Z");
    expect((await promote(true)).body.ok).toBe(false);
    expect(store.list(ME)[0]?.status).toBe("shadow");
  });

  it("a draft that was never tested cannot be promoted", async () => {
    await call("/api/authored-plays/save", post({ form: FORM }));
    const answer = await promote(true);
    expect(answer.body).toEqual({ ok: false, error: "Put the playbook in its shadow test first." });
    expect(subs.load()).toEqual({});
  });

  it("a non-owner cannot promote: another member's play is gone to them, and nothing is written", async () => {
    await testing();
    const theirs = await promote(true, config(), grace);
    expect(theirs.body.ok).toBe(false);
    expect(store.list(ME)[0]?.status).toBe("shadow");
    expect(subs.load()).toEqual({});
  });

  it("the bot must still be the member's own: a bot no longer owned is refused", async () => {
    await testing();
    const answer = await promote(true, config({ resolveOwnerIds: () => ["human-ada"] }));
    expect(answer.body).toEqual({
      ok: false,
      error: "A playbook can only run on one of your own bots.",
    });
    expect(store.list(ME)[0]?.status).toBe("shadow");
    expect(subs.load()).toEqual({});
  });

  it("a symbol the bot already trades under another subscription is refused", async () => {
    await testing();
    subs.subscribe("sauron", { playbookId: "S1-NVDA", mode: "standard", enabled: true });
    const answer = await promote(true);
    expect(answer.body.error).toBe(
      "S1-NVDA already trades NVDA on this bot; a bot runs one playbook per symbol.",
    );
    expect(store.list(ME)[0]?.status).toBe("shadow");
  });

  it("pausing switches the subscription off and keeps the play compiled for its exits", async () => {
    await testing();
    await promote(true);
    const paused = await promote(false);
    expect(paused.body.play).toMatchObject({ status: "promoted", trading: { running: false } });
    expect(subs.load().sauron?.[0]?.enabled).toBe(false);
    // The spec is still on the wire's source: an open position keeps its exit rules.
    expect(runnableSpecs(store.list(ME))).toHaveLength(1);
    const listed = (await call("/api/authored-plays", get())).body.plays[0];
    expect(listed.trading).toEqual({ running: false });
    // Resume re-passes the gates and switches it back on without a second subscription.
    const resumed = await promote(true);
    expect(resumed.body.play.trading).toEqual({ running: true });
    expect(subs.load().sauron).toHaveLength(1);
  });

  it("only the owner can pause, and only a promoted play", async () => {
    await testing();
    expect((await promote(false)).body.ok).toBe(false);
    await promote(true);
    expect((await promote(false, config(), grace)).body.ok).toBe(false);
    expect(subs.load().sauron?.[0]?.enabled).toBe(true);
  });

  it("a promoted play can't be edited, re-tested or discarded: it may hold a position", async () => {
    await testing();
    await promote(true);
    const edit = await call(
      "/api/authored-plays/save",
      post({ form: { ...FORM, symbol: "AMD" }, replaceId: ID }),
    );
    expect(edit.body.refusals[0].reason).toBe(PROMOTED_LOCK);
    expect((await call("/api/authored-plays/shadow", post({ id: ID, on: false }))).body).toEqual({
      ok: false,
      error: PROMOTED_LOCK,
    });
    expect((await call("/api/authored-plays/delete", post({ id: ID }))).body).toEqual({
      ok: false,
      error: PROMOTED_LOCK,
    });
    expect(store.list(ME)[0]).toMatchObject({ status: "promoted" });
  });

  it("an unwired deployment can't promote, and a malformed body is a 400", async () => {
    await testing();
    expect((await promote(true, config({ subscriptions: undefined }))).body.ok).toBe(false);
    expect((await call("/api/authored-plays/promote", post({ id: ID }))).status).toBe(400);
    expect((await call("/api/authored-plays/promote", post({ on: true }))).status).toBe(400);
  });
});
