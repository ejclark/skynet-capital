import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { serveTargetSplitApi } from "../../src/server/target-split-api-routes.js";
import { TargetSplitStore } from "../../src/server/target-split-store.js";

/**
 * The target split API (#4607): identity from the session only (a member reads and writes their own
 * target, never another's), a split that breaks a rule answered with the member's sentence and no
 * write, and a deployment without the store answering "not wired" rather than crashing.
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

function request(method: string, body: unknown): IncomingMessage {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  const req = Readable.from([text]) as unknown as IncomingMessage;
  req.method = method;
  req.headers = method === "POST" ? { "content-type": "application/json" } : {};
  return req;
}

const post = (body: unknown): IncomingMessage => request("POST", body);
const get = (): IncomingMessage => request("GET", "");

const ada = { email: "ada@example.com", name: "Ada" } as never;
const grace = { email: "grace@example.com", name: "Grace" } as never;
const ADA = opaqueMemberId("ada@example.com");
const SPLIT = { sharesPct: 60, optionsPct: 10, cashPct: 30, tolerancePct: 5 };

describe("serveTargetSplitApi", () => {
  let dir: string;
  let store: TargetSplitStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-target-split-api-"));
    store = new TargetSplitStore(join(dir, "target-splits.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (withStore = true): DashboardServerConfig =>
    ({ ...(withStore ? { targetSplits: store } : {}) }) as unknown as DashboardServerConfig;

  async function call(
    req: IncomingMessage,
    path: string,
    session: unknown = ada,
    cfg: DashboardServerConfig = config(),
  ): Promise<{ handled: boolean; status?: number; json: unknown }> {
    const { res, out } = fakeRes();
    const handled = await serveTargetSplitApi(req, res, path, cfg, session as never);
    let json: unknown;
    try {
      json = out.body ? JSON.parse(out.body) : undefined;
    } catch {
      json = out.body; // a 405 answers in plain text
    }
    return { handled, status: out.status, json };
  }

  it("does not exist for a caller who is not signed in", async () => {
    expect((await call(get(), "/api/target-split", null)).handled).toBe(false);
    expect((await call(post(SPLIT), "/api/target-split/save", null)).handled).toBe(false);
    expect(store.get(ADA)).toBeUndefined();
  });

  it("answers false for a near-miss path", async () => {
    expect((await call(post(SPLIT), "/api/target-split/save/extra")).handled).toBe(false);
  });

  it("reads null before a target is set", async () => {
    expect((await call(get(), "/api/target-split")).json).toEqual({ wired: true, target: null });
  });

  it("saves the signed-in member's target and reads it back", async () => {
    const saved = await call(post(SPLIT), "/api/target-split/save");
    expect(saved.json).toMatchObject({ ok: true, target: SPLIT });
    expect((await call(get(), "/api/target-split")).json).toMatchObject({ target: SPLIT });
  });

  it("never shows one member's target to another", async () => {
    await call(post(SPLIT), "/api/target-split/save");
    expect((await call(get(), "/api/target-split", grace)).json).toEqual({
      wired: true,
      target: null,
    });
  });

  it("ignores any member id in the body — identity is the session's", async () => {
    await call(
      post({ ...SPLIT, member: opaqueMemberId("grace@example.com") }),
      "/api/target-split/save",
    );
    expect(store.get(ADA)).toMatchObject(SPLIT);
    expect(store.get(opaqueMemberId("grace@example.com"))).toBeUndefined();
  });

  it("answers a split that breaks a rule with the member's sentence, writing nothing", async () => {
    const res = await call(post({ ...SPLIT, cashPct: 20 }), "/api/target-split/save");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({
      ok: false,
      error: "The three slices add to 90% — they need to add to 100%.",
    });
    expect(store.get(ADA)).toBeUndefined();
  });

  it("answers 400 to a body that is not a JSON object", async () => {
    expect((await call(post("not json"), "/api/target-split/save")).status).toBe(400);
  });

  it("refuses a GET on a write path and a POST on the read path", async () => {
    expect((await call(get(), "/api/target-split/save")).status).toBe(405);
    expect((await call(post({}), "/api/target-split")).status).toBe(405);
  });

  it("clears the member's target", async () => {
    await call(post(SPLIT), "/api/target-split/save");
    expect((await call(post({}), "/api/target-split/clear")).json).toEqual({ ok: true });
    expect(store.get(ADA)).toBeUndefined();
  });

  it("says it is not wired when the deployment has no store", async () => {
    const off = config(false);
    expect((await call(get(), "/api/target-split", ada, off)).json).toEqual({
      wired: false,
      target: null,
    });
    expect((await call(post(SPLIT), "/api/target-split/save", ada, off)).json).toEqual({
      ok: false,
      error: "A target split isn't wired in this deployment.",
    });
  });
});
