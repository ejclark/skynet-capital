import { mkdtempSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { filingFailedLine } from "../../app/src/live/moneypenny-filing.js";
import { serveAdminApi } from "../../src/server/admin-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { githubHeaders, useLiveGithubToken } from "../../src/server/github-api.js";
import {
  applySavedGithubToken,
  checkGithubToken,
  type GithubTokenDeps,
  GithubTokenStore,
  githubTokenStatus,
  rotateGithubToken,
  type TokenCheck,
} from "../../src/server/github-token.js";

/**
 * Rotating the app's GitHub token from Settings (Eric, 2026-10-24): replace, never reveal. A
 * token is refused before GitHub sees it unless it has a token's shape, refused before it's
 * stored unless GitHub accepts it, never stored in the clear, and swapped into every GitHub call
 * live. Members learn nothing; the status view never carries the token.
 */

const GOOD = "github_pat_11ABCDEFG0123456789_abcdefghijklmnopqrstuvwxyz";
const OLD = "github_pat_11OLDOLDOLD0123456789_oldoldoldoldoldoldold";

function tmpStore(secret: string | undefined = "s3cret"): {
  store: GithubTokenStore;
  path: string;
} {
  const path = join(mkdtempSync(join(tmpdir(), "ghtok-")), "github-token.json");
  return { store: new GithubTokenStore(path, secret), path };
}

function deps(
  overrides: Partial<GithubTokenDeps> = {},
): GithubTokenDeps & { env: Record<string, string | undefined> } {
  const env: Record<string, string | undefined> = { SKYNET_FEEDBACK_GITHUB_TOKEN: OLD };
  return {
    env,
    isOwner: (email) => email === "eric@example.com",
    store: tmpStore().store,
    repo: "ejclark/skynet-capital",
    current: () => env.SKYNET_FEEDBACK_GITHUB_TOKEN,
    check: async (): Promise<TokenCheck> => ({ ok: true, expiresAt: "2027-10-24T15:00:00.000Z" }),
    activate: (token) => {
      env.SKYNET_FEEDBACK_GITHUB_TOKEN = token;
    },
    liveAtBoot: true,
    ...overrides,
  };
}

afterEach(() => useLiveGithubToken(undefined));

describe("rotateGithubToken", () => {
  it("refuses something that isn't a token before asking GitHub", async () => {
    let asked = false;
    const d = deps({
      check: () => {
        asked = true;
        return Promise.resolve({ ok: true });
      },
    });
    const answer = await rotateGithubToken(d, "hunter2", "eric@example.com", new Date());
    expect(answer.ok).toBe(false);
    expect(asked).toBe(false);
  });

  it("refuses to store without an encryption key", async () => {
    const d = deps({ store: tmpStore("").store });
    const answer = await rotateGithubToken(d, GOOD, "eric@example.com", new Date());
    expect(answer).toMatchObject({ ok: false });
    expect(d.env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(OLD);
  });

  it("keeps the old token when GitHub refuses the new one", async () => {
    const d = deps({
      check: async () => ({ ok: false, error: "GitHub doesn't accept that token." }),
    });
    const answer = await rotateGithubToken(d, GOOD, "eric@example.com", new Date());
    expect(answer).toEqual({ ok: false, error: "Not saved: GitHub doesn't accept that token." });
    expect(d.store.read()).toBeUndefined();
    expect(d.env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(OLD);
  });

  it("seals an accepted token to disk, swaps it in, and says when it expires", async () => {
    const { store, path } = tmpStore();
    const d = deps({ store });
    const answer = await rotateGithubToken(
      d,
      ` ${GOOD} `,
      "eric@example.com",
      new Date("2026-10-24T12:00:00Z"),
    );
    expect(answer).toEqual({
      ok: true,
      message: "Saved. Moneypenny is filing with the new token now. It expires 2027-10-24.",
    });
    expect(d.env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(GOOD);
    expect(readFileSync(path, "utf8")).not.toContain(GOOD);
    expect(store.read()).toMatchObject({ token: GOOD, savedBy: "eric@example.com" });
  });

  it("is honest that a first-ever token waits for the next deploy", async () => {
    const answer = await rotateGithubToken(
      deps({ liveAtBoot: false }),
      GOOD,
      "eric@example.com",
      new Date(),
    );
    expect(answer.ok && answer.message).toContain("next deploy");
  });
});

describe("the saved token at boot", () => {
  it("beats the host secret and becomes every GitHub call's credential", () => {
    const { store } = tmpStore();
    store.save({ token: GOOD, savedAt: "2026-10-24T00:00:00Z", savedBy: "eric@example.com" });
    const env: Record<string, string | undefined> = { SKYNET_FEEDBACK_GITHUB_TOKEN: OLD };
    expect(applySavedGithubToken(env, store)).toBe(true);
    expect(env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(GOOD);
    // A module that captured the old token at boot still sends the new one.
    expect(githubHeaders(OLD).Authorization).toBe(`Bearer ${GOOD}`);
  });

  it("leaves the host secret alone when nothing is saved", () => {
    const env: Record<string, string | undefined> = { SKYNET_FEEDBACK_GITHUB_TOKEN: OLD };
    expect(applySavedGithubToken(env, tmpStore().store)).toBe(true);
    expect(env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(OLD);
    expect(githubHeaders(OLD).Authorization).toBe(`Bearer ${OLD}`);
  });
});

describe("checkGithubToken", () => {
  const res =
    (status: number, expiry: string | null = null) =>
    async () => ({
      status,
      headers: {
        get: (name: string) => (name === "github-authentication-token-expiration" ? expiry : null),
      },
    });

  it("reads GitHub's expiry header into an ISO date", async () => {
    expect(await checkGithubToken(GOOD, "o/r", res(200, "2026-11-23 10:00:00 -0600"))).toEqual({
      ok: true,
      expiresAt: "2026-11-23T16:00:00.000Z",
    });
  });

  it("names an expired token plainly", async () => {
    const check = await checkGithubToken(GOOD, "o/r", res(401));
    expect(check.ok === false && check.error).toContain("expired");
  });
});

describe("githubTokenStatus", () => {
  it("reports where the token came from and whether it works — never the token", async () => {
    const d = deps({
      check: async () => ({ ok: false, error: "GitHub doesn't accept that token." }),
    });
    const status = await githubTokenStatus(d);
    expect(status).toMatchObject({ owner: true, source: "host", working: false });
    expect(JSON.stringify(status)).not.toContain(OLD);
  });
});

describe("/api/admin/github-token", () => {
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
  const post = (body: unknown): IncomingMessage => {
    const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
    req.method = "POST";
    req.headers = { "content-type": "application/json" };
    return req;
  };
  const get = () => ({ method: "GET", headers: {} }) as unknown as IncomingMessage;
  const config = (d: GithubTokenDeps) => ({ githubToken: d }) as unknown as DashboardServerConfig;
  const member = { email: "member@example.com" } as never;
  const owner = { email: "Eric@example.com" } as never;

  it("tells a member nothing", async () => {
    const { res, out } = fakeRes();
    await serveAdminApi(get(), res, "/api/admin/github-token", config(deps()), member);
    expect(JSON.parse(out.body ?? "")).toEqual({ owner: false });
  });

  it("refuses a member's rotation flatly", async () => {
    const d = deps();
    const { res, out } = fakeRes();
    await serveAdminApi(post({ token: GOOD }), res, "/api/admin/github-token", config(d), member);
    expect(out.status).toBe(403);
    expect(d.env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(OLD);
  });

  it("rotates for the owner", async () => {
    const d = deps();
    const { res, out } = fakeRes();
    await serveAdminApi(post({ token: GOOD }), res, "/api/admin/github-token", config(d), owner);
    expect(JSON.parse(out.body ?? "")).toMatchObject({ ok: true });
    expect(d.env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe(GOOD);
  });
});

describe("Moneypenny on a failed filing", () => {
  it("says the access expired instead of inviting a retry that can't work", () => {
    const line = filingFailedLine("GitHub responded 401: Bad credentials.");
    expect(line).toContain("Settings → GitHub access");
    expect(line).not.toContain("again in a moment");
  });

  it("still offers a retry for a passing failure", () => {
    expect(filingFailedLine("GitHub responded 502.")).toContain("again in a moment");
  });
});
