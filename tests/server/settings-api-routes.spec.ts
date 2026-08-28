import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSettingsApi } from "../../src/server/settings-api-routes.js";

/**
 * The settings API's contract: strict shape gate, session-only identity fed to the account
 * service exactly as the `/account` form route feeds it, owned-accounts-only listing, and the
 * honest unwired refusal. The SERVICE owns authorization; this layer must never widen it.
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

function post(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

function get(): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.headers = {};
  return req;
}

const eric = { id: "human-eric", displayName: "Eric", kind: "human" as const };
const sauron = { id: "sauron", displayName: "Sauron", kind: "bot" as const };

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: {
      getState: () => ({ generatedAt: "t", participants: [eric, sauron], collisions: [] }),
    },
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => ["human-eric"],
    rosterIds: () => new Set(["sauron"]),
    accountAdmin: {
      updateProfile: async (input: unknown) => ({ ok: true, captured: input }),
      removeAccount: async (input: unknown) => ({ ok: true, captured: input }),
      profileFor: (id: string) =>
        id === "human-eric" ? { displayName: "Eric", timezone: "America/Denver" } : undefined,
    },
    ...over,
  } as unknown as DashboardServerConfig;
}

const session = { email: "eric@example.com", name: "Eric Clark" } as never;
const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

describe("serveSettingsApi", () => {
  it("claims only its paths", async () => {
    const { res } = fakeRes();
    expect(await serveSettingsApi(get(), res, "/api/board", configWith(), session)).toBe(false);
  });

  it("lists ONLY the session's owned accounts, with profile or the host-configured marker", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(get(), res, "/api/settings", configWith(), session);
    const body = answered(out);
    expect(body.authConfigured).toBe(true);
    const accounts = body.accounts as Record<string, unknown>[];
    expect(accounts.map((a) => a.id)).toEqual(["human-eric"]); // never the whole board
    expect(accounts[0]?.profile).toMatchObject({ displayName: "Eric" });
    expect(Array.isArray(body.timezones)).toBe(true);
  });

  it("refuses non-JSON posts with 415 and malformed shapes with 400 — never coerces", async () => {
    const wrongType = fakeRes();
    await serveSettingsApi(
      post("id=human-eric", "application/x-www-form-urlencoded"),
      wrongType.res,
      "/api/settings/profile",
      configWith(),
      session,
    );
    expect(wrongType.out.status).toBe(415);

    const badShape = fakeRes();
    await serveSettingsApi(
      post({ id: "", displayName: 42 }),
      badShape.res,
      "/api/settings/profile",
      configWith(),
      session,
    );
    expect(badShape.out.status).toBe(400);
  });

  it("feeds the service the SESSION's identity — the browser supplies none of it", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      post({ id: "human-eric", displayName: "Eric C", requesterId: "someone-else" }),
      res,
      "/api/settings/profile",
      configWith(),
      session,
    );
    const captured = (answered(out) as { captured: Record<string, unknown> }).captured;
    expect(captured.requesterId).toBe("human-eric"); // session-resolved, body's claim dropped
    expect(captured.requesterEmail).toBe("eric@example.com");
    expect(captured.sessionNames).toEqual(["eric clark", "eric"]);
    expect(captured.authConfigured).toBe(true);
    expect(captured.displayName).toBe("Eric C");
  });

  it("passes the typed confirmation through for the SERVICE to verify", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      post({ id: "human-eric", confirmName: "Eric" }),
      res,
      "/api/settings/remove",
      configWith(),
      session,
    );
    const captured = (answered(out) as { captured: Record<string, unknown> }).captured;
    expect(captured.confirmName).toBe("Eric");
    expect(captured.requesterId).toBe("human-eric");
  });

  it("feeds rotation the /rotate route's requester assembly and drops the body's claims", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      post({ id: "human-eric", apiKey: "AK-new", apiSecret: "SK-new", requesterId: "attacker" }),
      res,
      "/api/settings/rotate",
      configWith({
        resolveOwnerId: () => "human-eric",
        rotateCredentials: async (input: unknown) => ({ ok: true, captured: input }),
      }),
      session,
    );
    const captured = (answered(out) as { captured: Record<string, unknown> }).captured;
    expect(captured.requesterId).toBe("human-eric"); // session-resolved, body's claim dropped
    expect(captured.requesterEmail).toBe("eric@example.com");
    expect(captured.apiKey).toBe("AK-new"); // the pasted key reaches the service untouched
  });

  it("says when rotation isn't wired — an honest sentence, not an error", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      post({ id: "x", apiKey: "a", apiSecret: "b" }),
      res,
      "/api/settings/rotate",
      configWith(),
      session,
    );
    expect(answered(out)).toMatchObject({ ok: false });
  });

  it("says when account management isn't wired — an honest sentence, not an error", async () => {
    const { res, out } = fakeRes();
    await serveSettingsApi(
      post({ id: "x", displayName: "y" }),
      res,
      "/api/settings/profile",
      configWith({ accountAdmin: undefined }),
      session,
    );
    expect(answered(out)).toMatchObject({ ok: false });
  });
});
