import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ShadowReport } from "../../src/autonomous/authored-shadow-wire.js";
import { playRowWords } from "../../src/observatory/play-feed-words.js";
import { emptyForm } from "../../src/playbooks/authored-play-form.js";
import { AuthoredPlayStore } from "../../src/server/authored-play-store.js";
import { serveAuthoredPlaysApi } from "../../src/server/authored-plays-api-routes.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { PlayMilestoneLedger } from "../../src/server/play-milestone-ledger.js";
import { recordPasses } from "../../src/server/play-milestone-sync.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";

/**
 * AUTHORED PLAYS ON THE ACTIVITY FEED (#5457 slice 5, #809 slice 6): each milestone — a test
 * starting, passing, the play trading, the play paused — posts one row, once, to signed-in members
 * only, in words that never claim an edge the shadow test did not show.
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

const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const ID = "U-sauron-nvda-run-up-tighter";
const FORM = {
  ...emptyForm("sauron"),
  name: "NVDA run-up, tighter",
  symbol: "NVDA",
  thesis: "Long the drift into the print, out before the dead final week.",
};

const reportFor = (since: string, over: Record<string, unknown> = {}): ShadowReport => ({
  kind: "authored-shadow.v1",
  at: Date.parse("2026-10-17T15:00:00.000Z"),
  plays: [
    {
      id: ID,
      since,
      state: "watching",
      window: "long",
      sessions: 10,
      tradeCount: 2,
      roundTrips: 1,
      realized: -40,
      refused: 0,
      recent: [],
      ...over,
    },
  ],
});

describe("authored-play milestones on the feed", () => {
  let dir: string;
  let store: AuthoredPlayStore;
  let subs: SubscriptionStore;
  let ledger: PlayMilestoneLedger;
  let report: ShadowReport | undefined;
  let clock: number;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-authored-feed-"));
    store = new AuthoredPlayStore(join(dir, "authored-plays.json"));
    subs = new SubscriptionStore(join(dir, "subscriptions.json"));
    ledger = new PlayMilestoneLedger(join(dir, "play-milestones.json"));
    report = undefined;
    clock = Date.parse("2026-10-17T14:00:00.000Z");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: () => ["sauron", "human-ada"],
      authoredPlays: store,
      subscriptions: subs,
      playMilestones: ledger,
      readAuthoredShadow: () => report,
      readPlayMilestones: () => {
        recordPasses(store, ledger, report);
        return ledger.list();
      },
      now: () => {
        clock += 60_000;
        return new Date(clock);
      },
      hub: {
        getState: () => ({
          generatedAt: "t",
          collisions: [],
          participants: [
            { id: "sauron", displayName: "Sauron", kind: "bot", positions: [] },
            { id: "human-ada", displayName: "Ada", kind: "human", positions: [] },
          ],
        }),
      },
    }) as unknown as DashboardServerConfig;

  const call = async (path: string, body?: unknown) => {
    const { res, out } = fakeRes();
    const req =
      body === undefined
        ? (Object.assign(Readable.from([""]), {
            method: "GET",
            headers: {},
          }) as unknown as IncomingMessage)
        : post(body);
    await serveAuthoredPlaysApi(req, res, path, config(), ada);
    return JSON.parse(out.body || "{}");
  };

  const feed = async (viewer: unknown) => {
    const { res, out } = fakeRes();
    await serveContentApi(res, "/api/wire", "/api/wire", config(), viewer as never);
    return JSON.parse(out.body ?? "{}").wire;
  };
  const plays = async (viewer: unknown = ada) =>
    (await feed(viewer)).plays as { kindLabel: string; text: string; meta: string }[];

  async function startTest(): Promise<string> {
    await call("/api/authored-plays/save", { form: FORM });
    const started = await call("/api/authored-plays/shadow", { id: ID, on: true });
    return started.play.shadow.since;
  }

  it("starting a shadow test posts one row, and a second tap posts nothing", async () => {
    await startTest();
    await call("/api/authored-plays/shadow", { id: ID, on: true });
    const rows = await plays();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kindLabel: "Testing" });
    expect(rows[0]?.text).toContain("“NVDA run-up, tighter”");
    expect(rows[0]?.text).toContain("places no orders");
  });

  it("a pass posts once however many times the report is read, and only on the current test", async () => {
    const since = await startTest();
    report = reportFor("2026-01-01T00:00:00.000Z"); // an earlier start of the same play
    expect((await plays()).map((r) => r.kindLabel)).toEqual(["Testing"]);
    report = reportFor(since);
    await call("/api/authored-plays");
    await feed(ada);
    await feed(ada);
    const labels = (await plays()).map((r) => r.kindLabel).sort();
    expect(labels).toEqual(["Passed", "Testing"]);
  });

  it("a test that has not met the bar posts no pass", async () => {
    const since = await startTest();
    report = reportFor(since, { sessions: 9 });
    expect((await plays()).map((r) => r.kindLabel)).toEqual(["Testing"]);
  });

  it("promoting posts one 'Trading' row naming the sessions, and a resume is not a second one", async () => {
    const since = await startTest();
    report = reportFor(since);
    await call("/api/authored-plays/promote", { id: ID, on: true });
    await call("/api/authored-plays/promote", { id: ID, on: false });
    await call("/api/authored-plays/promote", { id: ID, on: true });
    const rows = await plays();
    expect(rows.map((r) => r.kindLabel).sort()).toEqual(["Passed", "Paused", "Testing", "Trading"]);
    expect(rows.find((r) => r.kindLabel === "Trading")?.text).toBe(
      "started trading “NVDA run-up, tighter” after 10 shadow sessions",
    );
  });

  it("pausing posts a plain row once; pausing a paused play posts nothing; a second real pause does", async () => {
    const since = await startTest();
    report = reportFor(since);
    await call("/api/authored-plays/promote", { id: ID, on: true });
    await call("/api/authored-plays/promote", { id: ID, on: false });
    await call("/api/authored-plays/promote", { id: ID, on: false });
    expect((await plays()).filter((r) => r.kindLabel === "Paused")).toHaveLength(1);
    await call("/api/authored-plays/promote", { id: ID, on: true });
    await call("/api/authored-plays/promote", { id: ID, on: false });
    expect((await plays()).filter((r) => r.kindLabel === "Paused")).toHaveLength(2);
  });

  it("a refused promotion posts nothing", async () => {
    const since = await startTest();
    report = reportFor(since, { sessions: 3 });
    const refused = await call("/api/authored-plays/promote", { id: ID, on: true });
    expect(refused.ok).toBe(false);
    expect((await plays()).map((r) => r.kindLabel)).toEqual(["Testing"]);
  });

  it("MEMBERS ONLY: with no session the kind is off and no row leaves", async () => {
    await startTest();
    const open = await feed(undefined);
    expect(open.playsEnabled).toBe(false);
    expect(open.plays).toEqual([]);
    expect(JSON.stringify(open)).not.toContain("NVDA run-up");
    expect((await feed(ada)).playsEnabled).toBe(true);
  });

  it("every row is labelled SIM and unvalidated, and no row claims a return or an edge", async () => {
    const since = await startTest();
    report = reportFor(since); // a closed round trip that LOST money: a pass is not a profit
    await call("/api/authored-plays/promote", { id: ID, on: true });
    await call("/api/authored-plays/promote", { id: ID, on: false });
    const rows = await plays();
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.meta).toContain("SIM");
      expect(row.meta).toContain("unvalidated");
      expect(row.text).not.toMatch(/profit|return|gain|beat|edge works|winning|\$/i);
    }
  });
});

describe("the words", () => {
  const base = {
    key: "k",
    at: "2026-10-17T15:00:00.000Z",
    accountId: "sauron",
    playName: "NVDA run-up, tighter",
    symbol: "NVDA",
  };

  it("celebrates a pass and a first promotion; reports a start and a pause plainly", () => {
    expect(playRowWords({ ...base, kind: "passed", sessions: 10 }).cheer).toBe(true);
    expect(playRowWords({ ...base, kind: "promoted", sessions: 10 }).cheer).toBe(true);
    expect(playRowWords({ ...base, kind: "started" }).cheer).toBe(false);
    expect(playRowWords({ ...base, kind: "paused" }).cheer).toBe(false);
  });

  it("says what happened, and a pass says it is not proof of an edge", () => {
    expect(playRowWords({ ...base, kind: "passed", sessions: 10 }).text).toContain(
      "which is not proof of an edge",
    );
    expect(playRowWords({ ...base, kind: "paused" }).text).toBe(
      "paused “NVDA run-up, tighter” — no new positions; exits keep running",
    );
    expect(playRowWords({ ...base, kind: "promoted" }).text).toBe(
      "started trading “NVDA run-up, tighter”",
    );
  });
});

describe("the ledger", () => {
  it("is append-only and idempotent on the key, and survives a reload", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-play-ledger-"));
    try {
      const path = join(dir, "play-milestones.json");
      const entry = {
        key: "a:started:1",
        kind: "started" as const,
        at: "2026-10-17T15:00:00.000Z",
        accountId: "sauron",
        playName: "X",
        symbol: "NVDA",
      };
      const ledger = new PlayMilestoneLedger(path);
      expect(ledger.record(entry)).toBe(true);
      expect(ledger.record(entry)).toBe(false);
      expect(new PlayMilestoneLedger(path).list()).toEqual([entry]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
