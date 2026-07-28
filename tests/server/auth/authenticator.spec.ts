import type { IncomingMessage, ServerResponse } from "node:http";
import { type Authenticator, resolveAuth } from "../../../src/server/auth/authenticator.js";

class FakeRes {
  statusCode?: number;
  headers: Record<string, string> = {};
  body = "";
  setHeader(key: string, value: string): void {
    this.headers[key.toLowerCase()] = value;
  }
  writeHead(status: number, headers?: Record<string, string>): this {
    this.statusCode = status;
    for (const [k, v] of Object.entries(headers ?? {})) {
      this.headers[k.toLowerCase()] = v;
    }
    return this;
  }
  end(chunk?: string): void {
    if (chunk) {
      this.body += chunk;
    }
  }
}

const req = (url: string, cookie?: string): IncomingMessage =>
  ({ url, headers: cookie ? { cookie } : {} }) as unknown as IncomingMessage;
const res = () => new FakeRes();
const asRes = (r: FakeRes) => r as unknown as ServerResponse;

const BASE = "https://app";
const ENV = {
  SKYNET_SESSION_SECRET: "sess-secret",
  SKYNET_GOOGLE_CLIENT_ID: "gid",
  SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
  SKYNET_ALLOWED_EMAILS: "eric@gmail.com",
};

function googleFetch(email: string): typeof fetch {
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  return (async (input: string | URL) => {
    const url = String(input);
    const body = url.includes("token") ? { access_token: "t" } : { email, name: "Eric" };
    return { json: async () => body } as Response;
  }) as unknown as typeof fetch;
}

/** Run start → callback and return the callback response. */
async function signIn(auth: Authenticator): Promise<FakeRes> {
  const start = res();
  await auth.handleAuthRoute(req("/auth/google"), asRes(start), "/auth/google", BASE);
  const state = /skynet_oauth_state=([^;]+)/.exec(start.headers["set-cookie"] ?? "")?.[1] ?? "";
  const cb = res();
  await auth.handleAuthRoute(
    req(`/auth/google/callback?code=c&state=${state}`, `skynet_oauth_state=${state}`),
    asRes(cb),
    "/auth/google/callback",
    BASE,
  );
  return cb;
}

describe("resolveAuth", () => {
  it("is undefined without a session secret", () => {
    expect(
      resolveAuth({ SKYNET_GOOGLE_CLIENT_ID: "x", SKYNET_GOOGLE_CLIENT_SECRET: "y" }),
    ).toBeUndefined();
  });
  it("is undefined without any provider", () => {
    expect(resolveAuth({ SKYNET_SESSION_SECRET: "s" })).toBeUndefined();
  });
  it("builds when a secret and provider are present", () => {
    const auth = resolveAuth(ENV);
    expect(auth?.providerIds).toEqual(["google"]);
  });
  it("has no side drawer — the playcall self-labels on the chart", () => {
    const html = resolveAuth(ENV)?.loginPage() ?? "";
    // The DOM playcall drawer was removed; its essentials (name/class/thesis/max P&L/live P/L) now
    // render on the chart itself so nothing covers the stage.
    expect(html).not.toContain('class="playdrawer"');
    expect(html).not.toContain('id="pdSignal"');
    expect(html).not.toContain('id="pdTab"');
    // hard constraint stays intact
    expect(html).toContain("Continue with Google");
  });
});

describe("handleAuthRoute", () => {
  it("start redirects to Google with a state cookie", async () => {
    const auth = resolveAuth(ENV);
    const r = res();
    const handled = await auth?.handleAuthRoute(
      req("/auth/google"),
      asRes(r),
      "/auth/google",
      BASE,
    );
    expect(handled).toBe(true);
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toContain("accounts.google.com");
    expect(r.headers["set-cookie"]).toContain("skynet_oauth_state=");
  });

  it("an allowlisted account gets a session cookie and is redirected in", async () => {
    const auth = resolveAuth(ENV, { fetchFn: googleFetch("eric@gmail.com") });
    if (!auth) throw new Error("auth");
    const cb = await signIn(auth);
    expect(cb.statusCode).toBe(302);
    expect(cb.headers.location).toBe("/");
    expect(cb.headers["set-cookie"]).toContain("skynet_session=");

    // The issued cookie is a valid session on a later request.
    const token = /skynet_session=([^;]+)/.exec(cb.headers["set-cookie"] ?? "")?.[1] ?? "";
    expect(auth.sessionFrom(req("/", `skynet_session=${decodeURIComponent(token)}`))?.email).toBe(
      "eric@gmail.com",
    );
  });

  it("a non-allowlisted account is refused (403, no session)", async () => {
    const auth = resolveAuth(ENV, { fetchFn: googleFetch("stranger@gmail.com") });
    if (!auth) throw new Error("auth");
    const cb = await signIn(auth);
    expect(cb.statusCode).toBe(403);
    expect(cb.headers["set-cookie"]).toBeUndefined();
    expect(cb.body).toContain("guest list");
  });

  it("rejects a callback whose state doesn't match the cookie", async () => {
    const auth = resolveAuth(ENV, { fetchFn: googleFetch("eric@gmail.com") });
    if (!auth) throw new Error("auth");
    const r = res();
    await auth.handleAuthRoute(
      req("/auth/google/callback?code=c&state=forged", "skynet_oauth_state=real"),
      asRes(r),
      "/auth/google/callback",
      BASE,
    );
    expect(r.statusCode).toBe(400);
  });

  it("ignores unrelated paths", async () => {
    const auth = resolveAuth(ENV);
    expect(await auth?.handleAuthRoute(req("/"), asRes(res()), "/", BASE)).toBe(false);
  });
});
