import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { AlpacaApiError } from "../../src/alpaca/alpaca-api-error.js";
import type { AlpacaOrder, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { serveTradeOrdersApi } from "../../src/server/trade-orders-routes.js";

/**
 * The order lifecycle API's contract (#3407 P1): session-only identity checked against the owned
 * set, the OWN account's client and nothing else, an honest absence when no credentials are
 * linked, a rendered refusal (never an error) when the broker won't cancel, and an audit line on
 * every cancel that reached the broker.
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

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

function post(url: string, body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.url = url;
  req.headers = { "content-type": "application/json" };
  return req;
}

const json = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

function fakeClient(over: Partial<AlpacaTradingClient> = {}): {
  client: AlpacaTradingClient;
  cancelled: string[];
  replaced: Array<{ id: string; params: unknown }>;
} {
  const cancelled: string[] = [];
  const replaced: Array<{ id: string; params: unknown }> = [];
  const working: AlpacaOrder = {
    id: "o-1",
    symbol: "NVDA",
    qty: "5",
    side: "buy",
    status: "accepted",
    type: "limit",
    limit_price: "170",
    time_in_force: "gtc",
    submitted_at: new Date().toISOString(),
  };
  const client = {
    listOrders: () => Promise.resolve([working]),
    cancelOrder: (id: string) => {
      cancelled.push(id);
      return Promise.resolve();
    },
    replaceOrder: (id: string, params: unknown) => {
      replaced.push({ id, params });
      return Promise.resolve({ ...working, id: "o-9", status: "pending_replace", replaces: id });
    },
    ...over,
  } as unknown as AlpacaTradingClient;
  return { client, cancelled, replaced };
}

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [], collisions: [] }) },
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    ...over,
  } as unknown as DashboardServerConfig;
}

const session = { email: "eric@example.com" } as never;

describe("serveTradeOrdersApi — routing", () => {
  it("claims only its three paths", async () => {
    const { res } = fakeRes();
    expect(
      await serveTradeOrdersApi(
        get("/api/trade/quote"),
        res,
        "/api/trade/quote",
        configWith(),
        session,
      ),
    ).toBe(false);
  });

  it("answers a POST to the list route with 405", async () => {
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/orders", {}),
      res,
      "/api/trade/orders",
      configWith(),
      session,
    );
    expect(out.status).toBe(405);
  });
});

describe("GET /api/trade/orders", () => {
  it("lists the own account's working orders through its own client", async () => {
    const { client } = fakeClient();
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      get("/api/trade/orders?participantId=human-eric"),
      res,
      "/api/trade/orders",
      configWith({ tradingClientFor: (id) => (id === "human-eric" ? client : undefined) }),
      session,
    );
    expect(out.status).toBe(200);
    const body = json(out);
    expect(body.available).toBe(true);
    expect(typeof body.asOf).toBe("string");
    expect(body.working).toEqual([
      expect.objectContaining({
        id: "o-1",
        state: "working",
        cancelable: true,
        timeInForce: "gtc",
      }),
    ]);
  });

  it("answers 404 for an account the session does not own — it does not exist for this caller", async () => {
    const { client } = fakeClient();
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      get("/api/trade/orders?participantId=bot-sauron"),
      res,
      "/api/trade/orders",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(out.status).toBe(404);
  });

  it("says unlinked, never an empty list, when the account has no credentials wired", async () => {
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      get("/api/trade/orders?participantId=human-eric"),
      res,
      "/api/trade/orders",
      configWith({ tradingClientFor: () => undefined }),
      session,
    );
    expect(json(out)).toMatchObject({ available: false, reason: "unlinked", working: [] });
  });

  it("says unreachable when the broker read throws — no exception leaks", async () => {
    const { client } = fakeClient({ listOrders: () => Promise.reject(new Error("boom")) });
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      get("/api/trade/orders?participantId=human-eric"),
      res,
      "/api/trade/orders",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(json(out)).toMatchObject({ available: false, reason: "unreachable" });
    expect(out.body).not.toContain("boom");
  });
});

describe("POST /api/trade/cancel", () => {
  it("cancels through the own account's client and writes the audit line", async () => {
    const { client, cancelled } = fakeClient();
    const audited: OrderAuditRecord[] = [];
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "human-eric", orderId: "o-1" }),
      res,
      "/api/trade/cancel",
      configWith({
        tradingClientFor: () => client,
        recordOrderAudit: (entry) => Promise.resolve(void audited.push(entry)),
      }),
      session,
    );
    expect(json(out)).toEqual({ ok: true, orderId: "o-1" });
    expect(cancelled).toEqual(["o-1"]);
    expect(audited).toEqual([
      expect.objectContaining({
        participantId: "human-eric",
        ownerEmail: "eric@example.com",
        orderId: "o-1",
        intent: "cancel",
      }),
    ]);
  });

  it("refuses an account the session does not own before touching any client", async () => {
    const { client, cancelled } = fakeClient();
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "bot-sauron", orderId: "o-1" }),
      res,
      "/api/trade/cancel",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(json(out)).toMatchObject({
      ok: false,
      refusals: [expect.stringContaining("own account")],
    });
    expect(cancelled).toEqual([]);
  });

  it("relays only the broker's own reason when it will not cancel, and writes no audit line", async () => {
    const { client } = fakeClient({
      cancelOrder: () =>
        Promise.reject(new AlpacaApiError(422, { message: "order is already filled" })),
    });
    const audited: OrderAuditRecord[] = [];
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "human-eric", orderId: "o-1" }),
      res,
      "/api/trade/cancel",
      configWith({
        tradingClientFor: () => client,
        recordOrderAudit: (entry) => Promise.resolve(void audited.push(entry)),
      }),
      session,
    );
    expect(json(out)).toMatchObject({
      ok: false,
      refusals: ["The broker couldn't cancel this order: order is already filled"],
    });
    expect(audited).toEqual([]);
  });

  it("names a vanished order plainly on a 404 from the broker", async () => {
    const { client } = fakeClient({
      cancelOrder: () => Promise.reject(new AlpacaApiError(404, { message: "order not found" })),
    });
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "human-eric", orderId: "gone" }),
      res,
      "/api/trade/cancel",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(json(out)).toMatchObject({ refusals: ["That order isn't on the broker any more."] });
  });

  it("collapses a transport failure to a fixed sentence — no internals reach the page", async () => {
    const { client } = fakeClient({
      cancelOrder: () => Promise.reject(new Error("ECONNREFUSED proxy.internal:8443")),
    });
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "human-eric", orderId: "o-1" }),
      res,
      "/api/trade/cancel",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(out.body).not.toContain("proxy.internal");
    expect(json(out)).toMatchObject({ refusals: [expect.stringContaining("Try again shortly")] });
  });

  it("refuses a malformed body with 400, never coercing it", async () => {
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/cancel", { participantId: "human-eric", orderId: 42 }),
      res,
      "/api/trade/cancel",
      configWith(),
      session,
    );
    expect(out.status).toBe(400);
  });
});

describe("POST /api/trade/replace (P1 1b)", () => {
  const body = { participantId: "human-eric", orderId: "o-1", quantity: 8, limitPrice: 172 };

  it("replaces through the own account's client and audits the NEW id with its lineage", async () => {
    const { client, replaced } = fakeClient();
    const audited: OrderAuditRecord[] = [];
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/replace", body),
      res,
      "/api/trade/replace",
      configWith({
        tradingClientFor: () => client,
        recordOrderAudit: (entry) => Promise.resolve(void audited.push(entry)),
      }),
      session,
    );
    expect(json(out)).toEqual({
      ok: true,
      orderId: "o-9",
      replaces: "o-1",
      status: "pending_replace",
    });
    expect(replaced).toEqual([{ id: "o-1", params: { qty: 8, limit_price: 172 } }]);
    expect(audited).toEqual([
      expect.objectContaining({
        participantId: "human-eric",
        ownerEmail: "eric@example.com",
        orderId: "o-9",
        replaces: "o-1",
        intent: "replace",
        symbol: "NVDA",
        side: "buy",
      }),
    ]);
  });

  it("refuses an account the session does not own before touching any client", async () => {
    const { client, replaced } = fakeClient();
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/replace", { ...body, participantId: "human-someone" }),
      res,
      "/api/trade/replace",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(json(out)).toEqual({
      ok: false,
      refusals: ["You can only change orders on your own account."],
    });
    expect(replaced).toEqual([]);
  });

  it("relays only the broker's own reason when it will not replace, and writes no audit line", async () => {
    const { client } = fakeClient({
      replaceOrder: () =>
        Promise.reject(new AlpacaApiError(422, { message: "order is not replaceable" })),
    });
    const audited: OrderAuditRecord[] = [];
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/replace", body),
      res,
      "/api/trade/replace",
      configWith({
        tradingClientFor: () => client,
        recordOrderAudit: (entry) => Promise.resolve(void audited.push(entry)),
      }),
      session,
    );
    expect(json(out)).toEqual({
      ok: false,
      refusals: ["The broker couldn't change this order: order is not replaceable"],
    });
    expect(audited).toEqual([]);
  });

  it.each([
    ["no change at all", { participantId: "human-eric", orderId: "o-1" }],
    ["a string quantity", { ...body, quantity: "8" }],
    ["a fractional quantity", { ...body, quantity: 1.5 }],
    ["a zero price", { ...body, limitPrice: 0 }],
    ["an unknown time in force", { ...body, timeInForce: "ioc" }],
  ])("refuses %s with 400, never coercing it", async (_label, malformed) => {
    const { client, replaced } = fakeClient();
    const { res, out } = fakeRes();
    await serveTradeOrdersApi(
      post("/api/trade/replace", malformed),
      res,
      "/api/trade/replace",
      configWith({ tradingClientFor: () => client }),
      session,
    );
    expect(out.status).toBe(400);
    expect(replaced).toEqual([]);
  });
});
