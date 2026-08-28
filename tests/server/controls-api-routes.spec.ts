import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveControlsApi } from "../../src/server/controls-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * Mission Control's JSON twin: the switchboard answers only to owners (and leaks nothing to
 * anyone else), actions flow through the shared authority, and the audit editor is the SESSION's
 * email — never a body field.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function getReq(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

function postReq(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

interface StoreCall {
  readonly kind: string;
  readonly editor: string;
  readonly value?: unknown;
}

function controlsWith(calls: StoreCall[], allSuspended = false) {
  return {
    store: {
      load: () => ({
        allSuspended,
        bots: { "bot-sauron": { suspended: true } },
        updatedAt: "2026-08-28T12:00:00Z",
        updatedBy: "eric@example.com",
      }),
      setAllSuspended: (value: boolean, editor: string) =>
        calls.push({ kind: "all", editor, value }),
      setBot: (id: string, patch: unknown, editor: string) =>
        calls.push({ kind: `bot:${id}`, editor, value: patch }),
    },
    isOwner: (email: string) => email === "eric@example.com",
    bots: () => [
      { id: "bot-sauron", displayName: "Sauron" },
      { id: "bot-prospector", displayName: "The Prospector" },
    ],
  };
}

function configWith(controls: unknown): DashboardServerConfig {
  return { hub: { getState: () => ({ participants: [] }) }, controls } as never;
}

const owner = { email: "eric@example.com" } as never;
const member = { email: "member@example.com" } as never;

describe("serveControlsApi", () => {
  it("ignores other paths", async () => {
    const { res } = fakeRes();
    expect(await serveControlsApi(getReq(), res, "/api/learn", configWith(undefined), owner)).toBe(
      false,
    );
  });

  it("tells a member nothing but owner:false — the switchboard leaks nothing", async () => {
    const { res, out } = fakeRes();
    await serveControlsApi(getReq(), res, "/api/controls", configWith(controlsWith([])), member);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ owner: false });
  });

  it("hands an owner the fleet — global switch, per-bot state, audit line", async () => {
    const { res, out } = fakeRes();
    await serveControlsApi(getReq(), res, "/api/controls", configWith(controlsWith([])), owner);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.owner).toBe(true);
    expect(body.fleet.allSuspended).toBe(false);
    expect(body.fleet.bots).toEqual([
      { id: "bot-sauron", displayName: "Sauron", suspended: true },
      { id: "bot-prospector", displayName: "The Prospector", suspended: false },
    ]);
    expect(body.fleet.updatedBy).toBe("eric@example.com");
  });

  it("refuses a member's POST before touching the store", async () => {
    const calls: StoreCall[] = [];
    const { res, out } = fakeRes();
    const req = postReq({ action: "suspend-all" });
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith(calls)), member);
    expect(out.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("requires application/json — a cookie-riding form post can't flip switches", async () => {
    const calls: StoreCall[] = [];
    const { res, out } = fakeRes();
    const req = postReq({ action: "suspend-all" }, "application/x-www-form-urlencoded");
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith(calls)), owner);
    expect(out.status).toBe(415);
    expect(calls).toEqual([]);
  });

  it("flips one bot's switch with the SESSION's email as the audit editor", async () => {
    const calls: StoreCall[] = [];
    const { res, out } = fakeRes();
    const req = postReq({ action: "suspend", bot: "bot-prospector", editor: "attacker" });
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith(calls)), owner);
    expect(calls).toEqual([
      { kind: "bot:bot-prospector", editor: "eric@example.com", value: { suspended: true } },
    ]);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.ok).toBe(true);
    expect(body.message).toContain("~30 seconds");
  });

  it("suspends the whole fleet through the shared authority", async () => {
    const calls: StoreCall[] = [];
    const { res, out } = fakeRes();
    const req = postReq({ action: "suspend-all" });
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith(calls)), owner);
    expect(calls).toEqual([{ kind: "all", editor: "eric@example.com", value: true }]);
    expect(JSON.parse(out.body ?? "{}").message).toContain("stands down");
  });

  it("refuses an unknown bot with the authority's own sentence — never guesses", async () => {
    const calls: StoreCall[] = [];
    const { res, out } = fakeRes();
    const req = postReq({ action: "suspend", bot: "bot-imposter" });
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith(calls)), owner);
    expect(calls).toEqual([]);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: false, message: "Unknown bot." });
  });

  it("rejects a malformed body with 400", async () => {
    const { res, out } = fakeRes();
    const req = postReq({ action: 7 });
    await serveControlsApi(req, res, "/api/controls", configWith(controlsWith([])), owner);
    expect(out.status).toBe(400);
  });
});
