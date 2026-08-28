import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveJoinApi } from "../../src/server/join-api-routes.js";

/**
 * Join-the-board's twin: ownership is stamped from the SESSION (#466 — never a form field),
 * the pasted key pair reaches the service untouched and is never echoed, and refusals are the
 * service's own sentences.
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

function post(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

function get(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

const session = { email: "eric@example.com" } as never;

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [] }) },
    auth: { providerIds: ["google"] },
    ...over,
  } as unknown as DashboardServerConfig;
}

describe("serveJoinApi", () => {
  it("ignores other paths", async () => {
    const { res } = fakeRes();
    expect(await serveJoinApi(get(), res, "/api/settings", configWith(), session)).toBe(false);
  });

  it("serves the classes and timezones on GET — data, never decisions", async () => {
    const { res, out } = fakeRes();
    await serveJoinApi(
      get(),
      res,
      "/api/join",
      configWith({ addParticipant: () => undefined }),
      session,
    );
    const body = JSON.parse(out.body ?? "{}");
    expect(body.wired).toBe(true);
    expect(Array.isArray(body.classes)).toBe(true);
    expect(body.classes.length).toBeGreaterThan(0);
    expect(body.classes[0]).toHaveProperty("thesis");
    expect(Array.isArray(body.timezones)).toBe(true);
  });

  it("stamps the SESSION's email as owner — a body-supplied ownerEmail is dropped", async () => {
    const seen: unknown[] = [];
    const config = configWith({
      addParticipant: (input: unknown) => {
        seen.push(input);
        return Promise.resolve({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
      },
    });
    const { res, out } = fakeRes();
    const body = {
      displayName: "Uncle Joe",
      apiKey: "PK-NEW",
      apiSecret: "SECRET",
      kind: "human",
      ownerEmail: "attacker@example.com",
    };
    await serveJoinApi(post(body), res, "/api/join", config, session);
    expect(seen[0]).toEqual({
      displayName: "Uncle Joe",
      apiKey: "PK-NEW",
      apiSecret: "SECRET",
      kind: "human",
      ownerEmail: "eric@example.com",
    });
    expect(JSON.parse(out.body ?? "{}").ok).toBe(true);
  });

  it("carries a bot's persona and timezone through the shape gate", async () => {
    const seen: { personaId?: string; timezone?: string }[] = [];
    const config = configWith({
      addParticipant: (input: { personaId?: string; timezone?: string }) => {
        seen.push(input);
        return Promise.resolve({ ok: true, id: "bot-x", displayName: "X" });
      },
    });
    const { res } = fakeRes();
    const body = {
      displayName: "X",
      apiKey: "PK",
      apiSecret: "S",
      kind: "bot",
      personaId: "sauron",
      timezone: "America/New_York",
    };
    await serveJoinApi(post(body), res, "/api/join", config, session);
    expect(seen[0]?.personaId).toBe("sauron");
    expect(seen[0]?.timezone).toBe("America/New_York");
  });

  it("refuses malformed shapes with 400, never coercing", async () => {
    const called: unknown[] = [];
    const config = configWith({ addParticipant: (i: unknown) => called.push(i) });
    const { res, out } = fakeRes();
    await serveJoinApi(
      post({ displayName: "x", apiKey: "k", apiSecret: "s", kind: "wizard" }),
      res,
      "/api/join",
      config,
      session,
    );
    expect(out.status).toBe(400);
    expect(called).toEqual([]);
  });

  it("requires application/json — the CSRF seam", async () => {
    const { res, out } = fakeRes();
    const req = post({ displayName: "x" }, "application/x-www-form-urlencoded");
    await serveJoinApi(
      req,
      res,
      "/api/join",
      configWith({ addParticipant: () => undefined }),
      session,
    );
    expect(out.status).toBe(415);
  });

  it("answers an unwired deployment honestly", async () => {
    const { res, out } = fakeRes();
    await serveJoinApi(
      post({ displayName: "x", apiKey: "k", apiSecret: "s", kind: "human" }),
      res,
      "/api/join",
      configWith(),
      session,
    );
    expect(JSON.parse(out.body ?? "{}").error).toContain("isn't wired");
  });

  it("relays the service's refusal verbatim — no secret ever rides an error", async () => {
    const config = configWith({
      addParticipant: () =>
        Promise.resolve({
          ok: false,
          error: "That account is already on the board — rotate its key instead.",
        }),
    });
    const { res, out } = fakeRes();
    const body = { displayName: "Dup", apiKey: "PK-SECRET", apiSecret: "SSH", kind: "human" };
    await serveJoinApi(post(body), res, "/api/join", config, session);
    const answer = out.body ?? "";
    expect(JSON.parse(answer).error).toContain("already on the board");
    expect(answer.includes("PK-SECRET")).toBe(false);
    expect(answer.includes("SSH")).toBe(false);
  });
});
