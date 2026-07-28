import type { IncomingMessage, ServerResponse } from "node:http";
import {
  completeOAuthCallback,
  type OAuthCallbackDeps,
} from "../../../src/server/auth/oauth-callback.js";
import type { FetchFn, OAuthProvider } from "../../../src/server/auth/providers.js";
import { verifySession } from "../../../src/server/auth/session.js";

class FakeRes {
  statusCode?: number;
  headers: Record<string, string> = {};
  body = "";
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
const asRes = (r: FakeRes) => r as unknown as ServerResponse;

const BASE = "https://app";
const SECRET = "sess-secret";
const TTL = 60_000;
const NOW = 1_000_000;

/** Fake fetch that hands back the given identity as the provider's JSON response. */
function identityFetch(identity: Record<string, unknown>): FetchFn {
  return (() =>
    Promise.resolve({ json: () => Promise.resolve(identity) } as Response)) as unknown as FetchFn;
}

/** Fake provider whose exchange flows through the injected fetch — no real OAuth round-trip. */
function fakeProvider(overrides?: Partial<OAuthProvider>): OAuthProvider {
  return {
    id: "google",
    label: "Google",
    authorizeUrl: () => "https://example.test/authorize",
    async exchange(_code, _redirectUri, fetchFn) {
      const response = await fetchFn("https://example.test/token");
      return (await response.json()) as { email?: string; login?: string; name?: string };
    },
    ...overrides,
  };
}

function makeDeps(overrides?: Partial<OAuthCallbackDeps>): OAuthCallbackDeps {
  return {
    provider: fakeProvider(),
    redirectUri: `${BASE}/auth/google/callback`,
    secure: true,
    stateCookieName: "skynet_oauth_state",
    sessionTtlMs: TTL,
    secret: SECRET,
    fetchFn: identityFetch({ email: "eric@gmail.com", name: "Eric" }),
    now: () => NOW,
    isAllowed: (email) => email === "eric@gmail.com",
    loginPage: (error) => `<main>${error ?? ""}</main>`,
    ...overrides,
  };
}

const callback = (r: FakeRes, deps: OAuthCallbackDeps, url: string, cookie?: string) =>
  completeOAuthCallback(req(url, cookie), asRes(r), BASE, deps);

describe("completeOAuthCallback", () => {
  describe("when the state parameter does not match the state cookie", () => {
    it("rejects with 400 and re-renders the login page, issuing no session", async () => {
      const r = new FakeRes();
      await callback(
        r,
        makeDeps(),
        "/auth/google/callback?code=c&state=forged",
        "skynet_oauth_state=real",
      );
      expect(r.statusCode).toBe(400);
      expect(r.body).toContain("expired or was tampered with");
      expect(r.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("when the code or state cookie is missing entirely", () => {
    it("rejects with 400 rather than attempting an exchange", async () => {
      const r = new FakeRes();
      await callback(r, makeDeps(), "/auth/google/callback?state=s", "skynet_oauth_state=s");
      expect(r.statusCode).toBe(400);
      expect(r.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("when the code exchange with the provider fails", () => {
    it("answers 502 and names the provider in the login-page error", async () => {
      const provider = fakeProvider({
        exchange: () => Promise.reject(new Error("upstream down")),
      });
      const r = new FakeRes();
      await callback(
        r,
        makeDeps({ provider }),
        "/auth/google/callback?code=c&state=s",
        "skynet_oauth_state=s",
      );
      expect(r.statusCode).toBe(502);
      expect(r.body).toContain("Google sign-in");
      expect(r.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("when the identity is not on the guest list", () => {
    it("refuses with 403, names the account, and sets no session cookie", async () => {
      const deps = makeDeps({ fetchFn: identityFetch({ email: "stranger@gmail.com" }) });
      const r = new FakeRes();
      await callback(r, deps, "/auth/google/callback?code=c&state=s", "skynet_oauth_state=s");
      expect(r.statusCode).toBe(403);
      expect(r.body).toContain("stranger@gmail.com");
      expect(r.body).toContain("guest list");
      expect(r.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("when an allowlisted identity completes the exchange", () => {
    it("sets a verifiable session cookie and redirects home", async () => {
      const r = new FakeRes();
      await callback(r, makeDeps(), "/auth/google/callback?code=c&state=s", "skynet_oauth_state=s");
      expect(r.statusCode).toBe(302);
      expect(r.headers.location).toBe("/");
      const cookieHeader = r.headers["set-cookie"] ?? "";
      expect(cookieHeader).toContain("skynet_session=");
      expect(cookieHeader).toContain("HttpOnly");
      expect(cookieHeader).toContain("Secure");

      // The issued cookie is a real signed session that expires exactly one TTL out.
      const token = decodeURIComponent(/skynet_session=([^;]+)/.exec(cookieHeader)?.[1] ?? "");
      const session = verifySession(token, SECRET, NOW);
      expect(session).toMatchObject({
        email: "eric@gmail.com",
        provider: "google",
        name: "Eric",
        exp: NOW + TTL,
      });
    });

    it("falls back to the lowercased login when the provider returns no email", async () => {
      const deps = makeDeps({
        provider: fakeProvider({ id: "github", label: "GitHub" }),
        fetchFn: identityFetch({ login: "EricClark" }),
        isAllowed: (_email, login) => login === "EricClark",
      });
      const r = new FakeRes();
      await callback(r, deps, "/auth/github/callback?code=c&state=s", "skynet_oauth_state=s");
      expect(r.statusCode).toBe(302);
      const token = decodeURIComponent(
        /skynet_session=([^;]+)/.exec(r.headers["set-cookie"] ?? "")?.[1] ?? "",
      );
      expect(verifySession(token, SECRET, NOW)).toMatchObject({
        email: "ericclark",
        provider: "github",
      });
    });
  });
});
