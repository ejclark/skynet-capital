import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "../../src/server/auth/session.js";
import { gateRequest, isOwnerOf } from "../../src/server/dashboard-auth-gate.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; headers?: Record<string, string>; body: string };
} {
  const out: { status?: number; headers?: Record<string, string>; body: string } = { body: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function fakeRequest(): IncomingMessage {
  return { headers: {} } as unknown as IncomingMessage;
}

const session: Session = { email: "ann@example.com", provider: "google", exp: Date.now() + 60_000 };

describe("gateRequest — legacy shared-password mode (no auth wired)", () => {
  it("passes an unauthenticated request through when no password is configured", async () => {
    const { res } = fakeResponse();
    const gate = await gateRequest(fakeRequest(), res, "/", "/", {} as DashboardServerConfig);
    expect(gate).toEqual({ handled: false, session: undefined });
  });

  it("refuses a request missing the correct ?key= when a password is configured", async () => {
    const { res, out } = fakeResponse();
    const config = { password: "secret" } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/", "/?key=wrong", config);
    expect(gate).toEqual({ handled: true });
    expect(out.status).toBe(401);
  });

  it("passes a request carrying the correct ?key=", async () => {
    const { res } = fakeResponse();
    const config = { password: "secret" } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/", "/?key=secret", config);
    expect(gate).toEqual({ handled: false, session: undefined });
  });
});

describe("gateRequest — per-user OAuth mode", () => {
  it("serves the login page at /login without touching the session", async () => {
    const { res, out } = fakeResponse();
    const auth = {
      loginPage: () => "<html>login</html>",
      handleAuthRoute: async () => false,
      sessionFrom: () => undefined,
      clearCookie: () => "",
    };
    const config = { auth } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/login", "/login", config);
    expect(gate).toEqual({ handled: true });
    expect(out.body).toBe("<html>login</html>");
  });

  it("clears the cookie and redirects to /login on /logout", async () => {
    const { res, out } = fakeResponse();
    const auth = {
      loginPage: () => "",
      handleAuthRoute: async () => false,
      sessionFrom: () => undefined,
      clearCookie: () => "cleared-cookie",
    };
    const config = { auth } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/logout", "/logout", config);
    expect(gate).toEqual({ handled: true });
    expect(out.headers).toMatchObject({ location: "/login", "set-cookie": "cleared-cookie" });
  });

  it("redirects an unauthenticated request to /login", async () => {
    const { res, out } = fakeResponse();
    const auth = {
      loginPage: () => "",
      handleAuthRoute: async () => false,
      sessionFrom: () => undefined,
      clearCookie: () => "",
    };
    const config = { auth } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/", "/", config);
    expect(gate).toEqual({ handled: true });
    expect(out.status).toBe(302);
    expect(out.headers).toMatchObject({ location: "/login" });
  });

  it("answers an unauthenticated /events with 401 instead of a redirect (it's a stream, not a page)", async () => {
    const { res, out } = fakeResponse();
    const auth = {
      loginPage: () => "",
      handleAuthRoute: async () => false,
      sessionFrom: () => undefined,
      clearCookie: () => "",
    };
    const config = { auth } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/events", "/events", config);
    expect(gate).toEqual({ handled: true });
    expect(out.status).toBe(401);
  });

  it("passes an authenticated request through with its resolved session", async () => {
    const { res } = fakeResponse();
    const auth = {
      loginPage: () => "",
      handleAuthRoute: async () => false,
      sessionFrom: () => session,
      clearCookie: () => "",
    };
    const config = { auth } as unknown as DashboardServerConfig;
    const gate = await gateRequest(fakeRequest(), res, "/", "/", config);
    expect(gate).toEqual({ handled: false, session });
  });
});

describe("isOwnerOf", () => {
  it("is false with no session", () => {
    expect(isOwnerOf({ isOwner: () => true }, undefined)).toBe(false);
  });

  it("is false with no dep wired", () => {
    expect(isOwnerOf(undefined, session)).toBe(false);
  });

  it("asks the dep with the session's email lowercased", () => {
    const seen: string[] = [];
    const dep = {
      isOwner: (email: string) => {
        seen.push(email);
        return true;
      },
    };
    expect(isOwnerOf(dep, { ...session, email: "Ann@Example.com" })).toBe(true);
    expect(seen).toEqual(["ann@example.com"]);
  });
});
