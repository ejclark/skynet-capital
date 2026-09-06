import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { DELEGATION_LOCKED_NOTE, DELEGATION_RUNG } from "../../src/domain/playbook-delegation.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * The Playbook Store API's contract: strict body gate, session-only ownership (never the body's
 * own claimed id), no cross-account visibility, and the honest unwired refusal.
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

function get(url: string): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

const session = { email: "eric@example.com", name: "Eric Clark" } as never;

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => ["acct-mine"],
    ...over,
  } as unknown as DashboardServerConfig;
}

function storeWith(calls: unknown[] = []) {
  return {
    load: () => ({ "acct-mine": [] }),
    subscribe: (id: string, sub: unknown) => calls.push({ op: "subscribe", id, sub }),
    unsubscribe: (id: string, playbookId: string) =>
      calls.push({ op: "unsubscribe", id, playbookId }),
    setEnabled: (id: string, playbookId: string, enabled: boolean) =>
      calls.push({ op: "setEnabled", id, playbookId, enabled }),
  } as never;
}

const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

describe("serveSubscriptionsApi", () => {
  it("claims only its paths", async () => {
    const { res } = fakeRes();
    expect(
      await serveSubscriptionsApi(get("/api/board"), res, "/api/board", configWith(), session),
    ).toBe(false);
  });

  it("GET index: an owner sees their own subscriptions merged into the catalog", async () => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      get("/api/playbook-store?id=acct-mine"),
      res,
      "/api/playbook-store",
      configWith({ subscriptions: storeWith() }),
      session,
    );
    const body = answered(out);
    expect(body.canManage).toBe(true);
  });

  it("GET index: a non-owner gets the bare catalog — no cross-account visibility", async () => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      get("/api/playbook-store?id=someone-elses"),
      res,
      "/api/playbook-store",
      configWith({ subscriptions: storeWith() }),
      session,
    );
    const body = answered(out);
    expect(body.canManage).toBe(false);
  });

  it("subscribe: refuses malformed bodies with 400", async () => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "bogus", capitalAllocated: 100 }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: storeWith() }),
      session,
    );
    expect(out.status).toBe(400);
    expect(answered(out).error).toBeDefined();
  });

  it("subscribe: refuses a body claiming an account the session doesn't own", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({
        id: "someone-elses",
        playbookId: "S1-NVDA",
        mode: "standard",
        capitalAllocated: 1_000,
      }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([]);
    expect(answered(out)).toMatchObject({ ok: false });
  });

  it("subscribe: writes to the store for an owned account", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000 }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([
      {
        op: "subscribe",
        id: "acct-mine",
        sub: { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000, enabled: true },
      },
    ]);
    expect(answered(out)).toEqual({ ok: true });
  });

  it("subscribe: carries a well-formed symbol-targeting filter (#885) through to the store", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({
        id: "acct-mine",
        playbookId: "S1-NVDA",
        mode: "standard",
        capitalAllocated: 1_000,
        symbols: ["eem", "aapl"],
      }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([
      {
        op: "subscribe",
        id: "acct-mine",
        sub: {
          playbookId: "S1-NVDA",
          mode: "standard",
          capitalAllocated: 1_000,
          enabled: true,
          symbols: ["EEM", "AAPL"],
        },
      },
    ]);
    expect(answered(out)).toEqual({ ok: true });
  });

  it("subscribe: drops a malformed symbols value rather than refusing the whole request", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({
        id: "acct-mine",
        playbookId: "S1-NVDA",
        mode: "standard",
        capitalAllocated: 1_000,
        symbols: ["EEM", 42],
      }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([
      {
        op: "subscribe",
        id: "acct-mine",
        sub: { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000, enabled: true },
      },
    ]);
    expect(answered(out)).toEqual({ ok: true });
  });

  it("unsubscribe: refuses an unowned account and never touches the store", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "someone-elses", playbookId: "S1-NVDA" }),
      res,
      "/api/playbook-store/unsubscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([]);
    expect(answered(out)).toMatchObject({ ok: false });
  });

  it("unsubscribe: writes to the store for an owned account", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA" }),
      res,
      "/api/playbook-store/unsubscribe",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([{ op: "unsubscribe", id: "acct-mine", playbookId: "S1-NVDA" }]);
    expect(answered(out)).toEqual({ ok: true });
  });

  it("set-enabled: refuses malformed bodies with 400", async () => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA", enabled: "yes" }),
      res,
      "/api/playbook-store/set-enabled",
      configWith({ subscriptions: storeWith() }),
      session,
    );
    expect(out.status).toBe(400);
  });

  it("set-enabled: writes to the store for an owned account", async () => {
    const calls: unknown[] = [];
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA", enabled: false }),
      res,
      "/api/playbook-store/set-enabled",
      configWith({ subscriptions: storeWith(calls) }),
      session,
    );
    expect(calls).toEqual([
      { op: "setEnabled", id: "acct-mine", playbookId: "S1-NVDA", enabled: false },
    ]);
    expect(answered(out)).toEqual({ ok: true });
  });

  describe("the delegation fog (#1707)", () => {
    /** A viewer whose own ladder is at `wheels`, having earned `earned`. */
    const fogged = (wheels: boolean, earned: readonly string[]) => ({
      resolveOwnerId: () => "acct-mine",
      progression: {
        view: () =>
          Promise.resolve({
            wheels,
            earnedByCode: new Map(earned.map((code) => [code, { code }])),
          }),
      },
    });

    it("GET index: reports the door locked, named, while the rung is unearned", async () => {
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        get("/api/playbook-store?id=acct-mine"),
        res,
        "/api/playbook-store",
        configWith({ subscriptions: storeWith(), ...fogged(true, []) }),
        session,
      );
      const delegation = answered(out).delegation as Record<string, unknown>;
      expect(delegation).toMatchObject({
        locked: true,
        unlocksAfter: DELEGATION_RUNG,
        note: DELEGATION_LOCKED_NOTE,
      });
      // The playbooks themselves are never fogged — only the delegation is.
      expect((answered(out).cards as unknown[]).length).toBeGreaterThan(0);
    });

    it("GET index: opens once the rung is earned", async () => {
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        get("/api/playbook-store?id=acct-mine"),
        res,
        "/api/playbook-store",
        configWith({ subscriptions: storeWith(), ...fogged(true, [DELEGATION_RUNG]) }),
        session,
      );
      expect(answered(out).delegation).toMatchObject({ locked: false });
    });

    it("subscribe: refuses with the same sentence the disabled control shows", async () => {
      const calls: unknown[] = [];
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000 }),
        res,
        "/api/playbook-store/subscribe",
        configWith({ subscriptions: storeWith(calls), ...fogged(true, []) }),
        session,
      );
      expect(calls).toEqual([]);
      expect(answered(out)).toEqual({ ok: false, error: DELEGATION_LOCKED_NOTE });
    });

    it("subscribe: behaves as today once the rung is earned", async () => {
      const calls: unknown[] = [];
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000 }),
        res,
        "/api/playbook-store/subscribe",
        configWith({ subscriptions: storeWith(calls), ...fogged(true, [DELEGATION_RUNG]) }),
        session,
      );
      expect(calls).toHaveLength(1);
      expect(answered(out)).toEqual({ ok: true });
    });

    it("subscribe: never fogs a member with the wheels off", async () => {
      const calls: unknown[] = [];
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000 }),
        res,
        "/api/playbook-store/subscribe",
        configWith({ subscriptions: storeWith(calls), ...fogged(false, []) }),
        session,
      );
      expect(calls).toHaveLength(1);
      expect(answered(out)).toEqual({ ok: true });
    });

    it("unsubscribe and pause stay open while the fog is on — an exit is never gated", async () => {
      const calls: unknown[] = [];
      const config = configWith({ subscriptions: storeWith(calls), ...fogged(true, []) });
      for (const [path, body] of [
        ["/api/playbook-store/unsubscribe", { id: "acct-mine", playbookId: "S1-NVDA" }],
        [
          "/api/playbook-store/set-enabled",
          { id: "acct-mine", playbookId: "S1-NVDA", enabled: false },
        ],
      ] as const) {
        const { res, out } = fakeRes();
        await serveSubscriptionsApi(post(body), res, path, config, session);
        expect(answered(out)).toEqual({ ok: true });
      }
      expect(calls).toEqual([
        { op: "unsubscribe", id: "acct-mine", playbookId: "S1-NVDA" },
        { op: "setEnabled", id: "acct-mine", playbookId: "S1-NVDA", enabled: false },
      ]);
    });

    it("no progression service wired: nothing is restricted", async () => {
      const calls: unknown[] = [];
      const { res, out } = fakeRes();
      await serveSubscriptionsApi(
        post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1_000 }),
        res,
        "/api/playbook-store/subscribe",
        configWith({ subscriptions: storeWith(calls), resolveOwnerId: () => "acct-mine" }),
        session,
      );
      expect(calls).toHaveLength(1);
      expect(answered(out)).toEqual({ ok: true });
    });
  });

  it("says when the Playbook Store isn't wired — an honest sentence, not an error", async () => {
    const { res, out } = fakeRes();
    await serveSubscriptionsApi(
      post({ id: "acct-mine", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 1 }),
      res,
      "/api/playbook-store/subscribe",
      configWith({ subscriptions: undefined }),
      session,
    );
    expect(answered(out)).toMatchObject({ ok: false });
  });
});
