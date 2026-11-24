import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import {
  type AlpacaConnect,
  ConnectState,
  ONBOARDING_LANDING,
  serveAlpacaConnect,
} from "../../src/server/alpaca-connect-routes.js";
import type { AddConnectedInput, AddResult } from "../../src/server/participant-service.js";

/**
 * Connect with Alpaca's two routes (#8250): the start holds a one-use state tied to this browser
 * (cookie) and this member (session email); the callback refuses any mismatch with a 400 BEFORE
 * the token endpoint, and the token never leaves the server.
 */

interface Out {
  status?: number;
  body?: string;
  headers: Record<string, string>;
}

function fakeRes() {
  const out: Out = { headers: {} };
  const res = {
    setHeader: (name: string, value: string) => {
      out.headers[name.toLowerCase()] = value;
    },
    writeHead: (status: number, headers?: Record<string, string>) => {
      out.status = status;
      for (const [k, v] of Object.entries(headers ?? {})) out.headers[k.toLowerCase()] = v;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.url = "/api/connect/alpaca";
  req.headers = { "content-type": "application/json", host: "app.test" };
  return req;
}

function callback(query: string, cookie?: string): IncomingMessage {
  return {
    method: "GET",
    url: `/connect/alpaca/callback?${query}`,
    headers: { host: "app.test", ...(cookie ? { cookie } : {}) },
  } as unknown as IncomingMessage;
}

function get(): IncomingMessage {
  return { method: "GET", url: "/api/connect/alpaca", headers: {} } as unknown as IncomingMessage;
}

const me = { email: "member@example.com" } as never;
const someoneElse = { email: "other@example.com" } as never;

function harness(
  over: {
    exchange?: () => Promise<{ accessToken: string; tokenType: string }>;
    add?: (input: AddConnectedInput) => Promise<AddResult>;
    startRefusal?: { ok: false; error: string };
  } = {},
) {
  const exchanges: string[] = [];
  const adds: AddConnectedInput[] = [];
  const connect: AlpacaConnect = {
    provider: {
      authorizeUrl: (redirectUri, state) =>
        `https://app.alpaca.markets/oauth/authorize?env=paper&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
      exchange: (code) => {
        exchanges.push(code);
        return over.exchange
          ? over.exchange()
          : Promise.resolve({ accessToken: "tok-secret", tokenType: "bearer" });
      },
    },
    fetchFn: (() => {
      throw new Error("routes must use the provider, not fetch");
    }) as never,
    service: {
      refuseConnectStart: () => over.startRefusal,
      addConnectedParticipant: (input) => {
        adds.push(input);
        return over.add
          ? over.add(input)
          : Promise.resolve({ ok: true, id: "human-pat", displayName: "Pat" });
      },
    },
    state: new ConnectState(),
  };
  return { config: { alpacaConnect: connect, publicUrl: "https://app.test" }, exchanges, adds };
}

async function start(config: ReturnType<typeof harness>["config"]) {
  const { res, out } = fakeRes();
  await serveAlpacaConnect(
    post({ displayName: "Pat", timezone: "America/New_York" }),
    res,
    "/api/connect/alpaca",
    config,
    me,
  );
  const body = JSON.parse(out.body ?? "{}");
  const state = new URL(body.authorizeUrl).searchParams.get("state") ?? "";
  return { out, body, state, cookie: `skynet_alpaca_state=${state}` };
}

async function finish(
  config: ReturnType<typeof harness>["config"],
  query: string,
  cookie?: string,
  session = me,
) {
  const { res, out } = fakeRes();
  await serveAlpacaConnect(
    callback(query, cookie),
    res,
    "/connect/alpaca/callback",
    config,
    session,
  );
  return out;
}

describe("serveAlpacaConnect", () => {
  it("ignores other paths", async () => {
    const { res } = fakeRes();
    expect(await serveAlpacaConnect(get(), res, "/api/join", harness().config, me)).toBe(false);
  });

  it("reports off when Connect isn't wired, and refuses a start", async () => {
    const { res, out } = fakeRes();
    await serveAlpacaConnect(get(), res, "/api/connect/alpaca", {}, me);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ enabled: false, result: null });
    const second = fakeRes();
    await serveAlpacaConnect(
      post({ displayName: "Pat" }),
      second.res,
      "/api/connect/alpaca",
      {},
      me,
    );
    expect(second.out.status).toBe(404);
  });

  it("start: answers the paper authorize URL and sets the state as an HttpOnly Lax cookie", async () => {
    const { config } = harness();
    const { out, body, state } = await start(config);
    expect(out.status).toBe(200);
    expect(body.authorizeUrl).toContain("env=paper");
    expect(body.authorizeUrl).toContain(
      encodeURIComponent("https://app.test/connect/alpaca/callback"),
    );
    expect(state).toMatch(/^[0-9a-f]{32}$/);
    const setCookie = out.headers["set-cookie"] ?? "";
    expect(setCookie).toContain(`skynet_alpaca_state=${state}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");
  });

  it("start: says the service's refusal before the member leaves for Alpaca", async () => {
    const { config } = harness({ startRefusal: { ok: false, error: "name taken" } });
    const r = fakeRes();
    await serveAlpacaConnect(
      post({ displayName: "Pat" }),
      r.res,
      "/api/connect/alpaca",
      config,
      me,
    );
    expect(JSON.parse(r.out.body ?? "{}")).toEqual({ ok: false, error: "name taken" });
    expect(r.out.headers["set-cookie"]).toBeUndefined();
  });

  it("start: refuses a malformed body and a missing session", async () => {
    const { config } = harness();
    const bad = fakeRes();
    await serveAlpacaConnect(post({ displayName: "" }), bad.res, "/api/connect/alpaca", config, me);
    expect(bad.out.status).toBe(400);
    const anon = fakeRes();
    await serveAlpacaConnect(
      post({ displayName: "Pat" }),
      anon.res,
      "/api/connect/alpaca",
      config,
      undefined,
    );
    expect(anon.out.status).toBe(403);
  });

  it("callback: a matching state exchanges, adds as the session's own account, and lands on Onboarding", async () => {
    const h = harness();
    const { state, cookie } = await start(h.config);
    const out = await finish(h.config, `code=c1&state=${state}`, cookie);
    expect(out.status).toBe(302);
    expect(out.headers.location).toBe(ONBOARDING_LANDING);
    expect(h.exchanges).toEqual(["c1"]);
    expect(h.adds).toEqual([
      {
        displayName: "Pat",
        timezone: "America/New_York",
        ownerEmail: "member@example.com",
        accessToken: "tok-secret",
      },
    ]);
    // The token never rides back to the browser — not in the redirect, the cookie, or the body.
    expect(JSON.stringify(out)).not.toContain("tok-secret");
    // The outcome is read once, by this member only.
    const r = fakeRes();
    await serveAlpacaConnect(get(), r.res, "/api/connect/alpaca", h.config, me);
    expect(JSON.parse(r.out.body ?? "{}").result).toEqual({
      ok: true,
      id: "human-pat",
      displayName: "Pat",
    });
    expect(r.out.body).not.toContain("tok-secret");
    const again = fakeRes();
    await serveAlpacaConnect(get(), again.res, "/api/connect/alpaca", h.config, me);
    expect(JSON.parse(again.out.body ?? "{}").result).toBeNull();
  });

  type Shape = (state: string, cookie: string) => [string, string | undefined];
  const refusals: [string, Shape][] = [
    ["no state cookie", (s) => [`code=c&state=${s}`, undefined]],
    ["a state that differs from the cookie", (s, c) => [`code=c&state=${s.replace(/.$/, "x")}`, c]],
    ["no state at all", (_s, c) => ["code=c", c]],
    [
      "a cookie for a state the server never issued",
      () => ["code=c&state=ab", "skynet_alpaca_state=ab"],
    ],
  ];
  for (const [label, shape] of refusals) {
    it(`callback: ${label} → 400, nothing added, token endpoint never called`, async () => {
      const h = harness();
      const { state, cookie } = await start(h.config);
      const [query, sentCookie] = shape(state, cookie);
      const out = await finish(h.config, query, sentCookie);
      expect(out.status).toBe(400);
      expect(h.exchanges).toEqual([]);
      expect(h.adds).toEqual([]);
    });
  }

  it("callback: a different signed-in member than the one who started → 400, never exchanged", async () => {
    const h = harness();
    const { state, cookie } = await start(h.config);
    const out = await finish(h.config, `code=c&state=${state}`, cookie, someoneElse);
    expect(out.status).toBe(400);
    expect(h.exchanges).toEqual([]);
    expect(h.adds).toEqual([]);
  });

  it("callback: a state is one use — a replay is refused", async () => {
    const h = harness();
    const { state, cookie } = await start(h.config);
    await finish(h.config, `code=c&state=${state}`, cookie);
    const replay = await finish(h.config, `code=c&state=${state}`, cookie);
    expect(replay.status).toBe(400);
    expect(h.exchanges).toEqual(["c"]);
  });

  it("callback: an expired state is refused", async () => {
    let now = 0;
    const h = harness();
    const state = new ConnectState(() => now);
    const config = { ...h.config, alpacaConnect: { ...h.config.alpacaConnect, state } };
    const { state: s, cookie } = await start(config);
    now = 10 * 60 * 1000 + 1;
    const out = await finish(config, `code=c&state=${s}`, cookie);
    expect(out.status).toBe(400);
    expect(h.exchanges).toEqual([]);
  });

  it("callback: a declined consent (no code) adds nothing and says try again", async () => {
    const h = harness();
    const { state, cookie } = await start(h.config);
    const out = await finish(h.config, `error=access_denied&state=${state}`, cookie);
    expect(out.status).toBe(302);
    expect(h.exchanges).toEqual([]);
    expect(h.adds).toEqual([]);
    const r = fakeRes();
    await serveAlpacaConnect(get(), r.res, "/api/connect/alpaca", h.config, me);
    expect(JSON.parse(r.out.body ?? "{}").result).toEqual({
      ok: false,
      error: "Couldn't finish connecting with Alpaca. Try again.",
    });
  });

  it("callback: a failed exchange adds nothing and says try again — never Alpaca's error text", async () => {
    const h = harness({
      exchange: () => Promise.reject(new Error("Alpaca OAuth exchange returned no access_token")),
    });
    const { state, cookie } = await start(h.config);
    await finish(h.config, `code=c&state=${state}`, cookie);
    expect(h.adds).toEqual([]);
    const r = fakeRes();
    await serveAlpacaConnect(get(), r.res, "/api/connect/alpaca", h.config, me);
    expect(JSON.parse(r.out.body ?? "{}").result).toEqual({
      ok: false,
      error: "Couldn't finish connecting with Alpaca. Try again.",
    });
  });

  it("callback: the service's balance refusal reaches the chapter with the balance found", async () => {
    const h = harness({
      add: async () => ({
        ok: false,
        reason: "balance",
        found: 100_000,
        error: "reports $100,000.00",
      }),
    });
    const { state, cookie } = await start(h.config);
    await finish(h.config, `code=c&state=${state}`, cookie);
    const r = fakeRes();
    await serveAlpacaConnect(get(), r.res, "/api/connect/alpaca", h.config, me);
    expect(JSON.parse(r.out.body ?? "{}").result).toMatchObject({
      reason: "balance",
      found: 100_000,
    });
  });
});

describe("ConnectState", () => {
  it("caps pending records, dropping the oldest first", () => {
    const state = new ConnectState(() => 0);
    const first = state.start({ displayName: "a", email: "a@x" });
    for (let i = 0; i < 300; i += 1) state.start({ displayName: "b", email: "b@x" });
    expect(state.take(first)).toBeUndefined();
  });
});
