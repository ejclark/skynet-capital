import { readdirSync, readFileSync, statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { BOTS_ONLY_NOTE } from "../../src/domain/playbook-bots-only.js";
import { serveBotsApi } from "../../src/server/bots-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { MemberFollowStore } from "../../src/server/member-follow-store.js";
import type { BotsStandingRead } from "../../src/server/ops-status-service.js";

/**
 * The Bots screen's API (#8254 PR 1): WHEN a signed-in member opens `/app/bots`, the server SHALL
 * list every bot account with its standing, loop state, last check and newest skip (criterion 1),
 * from the bots' own records and the `/controls` report alone (criterion 10). Following is a pin
 * that SHALL be stored per member and refused for a non-bot id (criterion 5), and the store SHALL be
 * read by no trading code (criterion 6).
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    setHeader() {
      return res;
    },
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

const member = { email: "member-a@example.com", name: "Member A" } as never;
const other = { email: "member-b@example.com", name: "Member B" } as never;

const NOW = Date.now();
const intent = (over: Record<string, unknown> = {}) =>
  ({ symbol: "NVDA", side: "buy", quantity: 1, reason: "momentum turned up", ...over }) as never;
const pass = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: NOW - 30_000,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

const PARTICIPANTS = [
  { id: "sauron", displayName: "Sauron", kind: "bot", personaId: "sauron" },
  { id: "banker", displayName: "The Banker", kind: "bot", personaId: "banker" },
  { id: "human-1", displayName: "A human", kind: "human" },
];

const STANDING: BotsStandingRead = {
  processMode: "live",
  verdicts: [
    { id: "sauron", ready: true, reason: "ok", wanted: "live", mode: "live" },
    { id: "banker", ready: false, reason: "pack", wanted: "live", mode: "observe" },
  ],
  suspendedReason: () => null,
  opensHeldReason: () => null,
};

describe("serveBotsApi", () => {
  let dir: string;
  let store: MemberFollowStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-follows-"));
    store = new MemberFollowStore(join(dir, "member-follows.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const decisions: Record<string, readonly DecisionRecord[]> = {
    sauron: [
      pass({ at: NOW - 30_000, refusals: [{ intent: intent(), reason: "s2-print" }] as never }),
      pass({
        at: NOW - 90_000,
        outcomes: [{ intent: intent(), action: "placed" }] as never,
      }),
    ],
    banker: [pass({ at: NOW - 45_000 })],
  };
  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      hub: { getState: () => ({ participants: PARTICIPANTS }) },
      memberFollows: store,
      readDecisions: async (id: string) => decisions[id] ?? [],
      readBotsStanding: () => STANDING,
      ...over,
    }) as unknown as DashboardServerConfig;
  const call = async (
    path: string,
    req: IncomingMessage,
    who: unknown = member,
    cfg = config(),
  ) => {
    const { res, out } = fakeRes();
    const handled = await serveBotsApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };

  it("reads the list past the gate without a session, and refuses to exist for a follow without one", async () => {
    const read = await call("/api/bots", get(), null);
    expect(read.status).toBe(200);
    expect(read.body.bots.every((b: { followed: boolean }) => !b.followed)).toBe(true);
    expect(read.body.canFollow).toBe(false);
    expect((await call("/api/bots", get())).body.canFollow).toBe(true);
    expect((await call("/api/bots/follow", post({ id: "sauron" }), null)).handled).toBe(false);
  });

  it("lists every bot account, one row each, with its standing words, loop and newest skip", async () => {
    const { status, body } = await call("/api/bots", get());
    expect(status).toBe(200);
    // By name, and composed from the passes and the poll alone: the config wires no broker (criterion 10).
    expect(body.bots.map((b: { id: string }) => b.id)).toEqual(["sauron", "banker"]);
    const sauron = body.bots.find((b: { id: string }) => b.id === "sauron");
    expect(sauron.persona.name).toBe("Sauron");
    expect(sauron.standing).toEqual({ placing: true, words: "placing paper orders" });
    expect(sauron.loop.lastCheckAt).toBe(new Date(NOW - 30_000).toISOString());
    expect(sauron.skip.reason).toBe("NVDA: blocked by S2 (flat through the print)");
    const banker = body.bots.find((b: { id: string }) => b.id === "banker");
    expect(banker.standing.words).toBe("watching: not cleared by its readiness gate");
    // A quiet check records no reason, so none is written (criterion 3).
    expect(banker.skip.reason).toBeUndefined();
    expect(body.houseMode).toBe("live");
    expect(body.note).toBe(BOTS_ONLY_NOTE);
  });

  it("names each bot's playbooks to a signed-in member, and none before sign-in (#8254 PR 2)", async () => {
    const verdicts = [{ playbookId: "CRWV-WHEEL", mode: "standard", state: "flat" }];
    const named = config({
      auth: {},
      readDecisions: async () => [
        pass({
          playbookVerdicts: verdicts as never,
          refusals: [
            { intent: intent({ reason: "CRWV-WHEEL window shut", playbookId: "CRWV-WHEEL" }) },
          ] as never,
        }),
      ],
    });
    const { body } = await call("/api/bots", get(), member, named);
    expect(body.bots[0].playbooks).toEqual(verdicts);
    expect(body.bots[0].skip.reason).toBe("NVDA: CRWV-WHEEL window shut");
    const outside = await call("/api/bots", get(), null, named);
    expect(outside.body.bots[0].playbooks).toBeNull();
    expect(outside.body.bots[0].skip.reason).toBe("NVDA: a playbook window shut");
  });

  it("lists every persona with no bot account as not running, name and thesis only (criterion 7)", async () => {
    const { body } = await call("/api/bots", get());
    const ids = body.notRunning.map((p: { personaId: string }) => p.personaId);
    expect(ids).toContain("futurist");
    expect(ids).not.toContain("sauron");
    expect(Object.keys(body.notRunning[0]).sort()).toEqual(["name", "personaId", "thesis"]);
  });

  it("says the house mode when it is observe, and never infers one it wasn't told (criterion 2)", async () => {
    const observe = config({ readBotsStanding: () => ({ ...STANDING, processMode: "observe" }) });
    const { body } = await call("/api/bots", get(), member, observe);
    expect(body.houseMode).toBe("observe");
    expect(body.bots[0].standing.placing).toBe(false);
    const silent = await call("/api/bots", get(), member, config({ readBotsStanding: undefined }));
    expect(silent.body.houseMode).toBeNull();
    expect(silent.body.bots.every((b: { standing: unknown }) => b.standing === null)).toBe(true);
  });

  it("stores a follow per member, lists it first, and removes it on unfollow (criterion 5)", async () => {
    expect((await call("/api/bots/follow", post({ id: "banker" }))).body).toEqual({ ok: true });
    const mine = await call("/api/bots", get());
    expect(mine.body.bots[0]).toMatchObject({ id: "banker", followed: true });
    // Another member's list is theirs: the follow is keyed to the member who made it.
    const theirs = await call("/api/bots", get(), other);
    expect(theirs.body.bots.some((b: { followed: boolean }) => b.followed)).toBe(false);
    await call("/api/bots/unfollow", post({ id: "banker" }));
    expect(
      (await call("/api/bots", get())).body.bots.some((b: { followed: boolean }) => b.followed),
    ).toBe(false);
  });

  it("refuses to follow an id that is not a bot account with 400", async () => {
    expect((await call("/api/bots/follow", post({ id: "human-1" }))).status).toBe(400);
    expect((await call("/api/bots/follow", post({ id: "nobody" }))).status).toBe(400);
    expect((await call("/api/bots/unfollow", post({}))).status).toBe(400);
    expect(store.list("anyone")).toEqual([]);
  });
});

describe("a follow is a pin, not a subscription (criterion 6)", () => {
  /** Every ts file under the code that trades, subscribes, or runs a bot. */
  const TRADING_CODE = [
    "src/engine",
    "src/autonomous",
    "src/trading",
    "src/playbooks",
    "src/subscriptions",
  ];
  const filesUnder = (root: string): string[] =>
    readdirSync(root).flatMap((name) => {
      const path = join(root, name);
      return statSync(path).isDirectory() ? filesUnder(path) : path.endsWith(".ts") ? [path] : [];
    });

  it("is read by no code that trades, subscribes or runs a bot", () => {
    const readers = [
      ...TRADING_CODE.flatMap(filesUnder),
      "src/server/subscriptions-api-routes.ts",
      "src/server/trade-api-routes.ts",
      "src/server/trade-orders-routes.ts",
    ].filter((file) => /member-follow-store|bots-api-routes/.test(readFileSync(file, "utf8")));
    expect(readers).toEqual([]);
  });
});
