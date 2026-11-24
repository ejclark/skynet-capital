import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { WritableFixtureTradingTransport } from "../../src/adapters/writable-fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { Participant } from "../../src/participants/participant.js";
import { resolveDeskTrading } from "../../src/server/account-identity-gate.js";
import { echoedExits, exitRoles } from "../../src/server/bracket-legs.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { servePlaysApi } from "../../src/server/plays-api-routes.js";
import { serveTradeOrdersApi } from "../../src/server/trade-orders-routes.js";

// #8249, PR 2's server half: what the form learns and what it shows comes from the broker.
//  - /api/trade/plays says `exitAtEntry: true` only to an admitted session, and nothing otherwise.
//  - A submitted bracket's receipt names the exits the BROKER echoed.
//  - The orders list names each exit "take-profit" or "stop" from a nested read, made only when a
//    bracket is on the book: every other list costs the one read it cost before.

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

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

const member: Participant = {
  id: "member",
  displayName: "Member",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

function paper() {
  const transport = new WritableFixtureTradingTransport(
    { account: { id: "sim", cash: "10000.00", status: "ACTIVE" }, positions: [] },
    { marks: new Map([["XLE", 90]]), idPrefix: "t" },
  );
  const reads: string[] = [];
  const counted: AlpacaTradingTransport = {
    get: (path) => {
      if (path.startsWith("/v2/orders?")) reads.push(path);
      return transport.get(path);
    },
    post: (path, body) => transport.post(path, body),
    delete: (path) => transport.delete(path),
  };
  return { client: new AlpacaTradingClient(counted), transport, reads };
}

describe("/api/trade/plays — the form learns admission (#8249)", () => {
  const config = (exitAtEntry?: "off" | "members") =>
    ({
      auth: {},
      resolveOwnerId: () => "human-ann",
      ...(exitAtEntry ? { exitAtEntry } : {}),
    }) as unknown as DashboardServerConfig;
  const read = async (cfg: DashboardServerConfig) => {
    const { res, out } = fakeRes();
    await servePlaysApi(get("/api/trade/plays"), res, "/api/trade/plays", cfg, {
      email: "ann@example.test",
    } as never);
    return JSON.parse(out.body ?? "{}");
  };

  it("carries no exitAtEntry key at all with the setting off", async () => {
    expect("exitAtEntry" in (await read(config()))).toBe(false);
    expect("exitAtEntry" in (await read(config("off")))).toBe(false);
  });

  it("says exitAtEntry: true to an admitted session", async () => {
    expect((await read(config("members"))).exitAtEntry).toBe(true);
  });
});

describe("a bracket's exits as the broker echoes them (#8249)", () => {
  it("returns the broker's exit prices on the submit result", async () => {
    const { client } = paper();
    const desk = resolveDeskTrading({
      findParticipant: (id) => (id === "member" ? member : undefined),
      clientFactory: () => client,
      optionsClientFactory: () => new AlpacaOptionsClient(client as never),
      authConfigured: true,
    });
    const result = await desk.submit(
      {
        participantId: "member",
        symbol: "XLE",
        quantity: 3,
        action: "buy",
        orderType: "limit",
        limitPrice: 91,
        exit: { takeProfit: 95, stop: 85 },
      },
      "member",
    );
    expect(result).toMatchObject({ ok: true, exits: { takeProfit: 95, stop: 85 } });
  });

  it("returns no exits on an order without a bracket", () => {
    expect(echoedExits({ id: "o", symbol: "XLE", qty: "1", side: "buy", status: "new" })).toBe(
      undefined,
    );
    expect(exitRoles([{ id: "o", symbol: "XLE", qty: "1", side: "buy", status: "new" }]).size).toBe(
      0,
    );
  });

  it("names each exit row in the orders list, and reads nested only when a bracket is there", async () => {
    const { client, reads } = paper();
    const config = { tradingClientFor: () => client } as unknown as DashboardServerConfig;
    const list = async () => {
      const { res, out } = fakeRes();
      const url = "/api/trade/orders?participantId=member";
      await serveTradeOrdersApi(get(url), res, "/api/trade/orders", config, undefined as never);
      return JSON.parse(out.body ?? "{}") as {
        working: { id: string; exitRole?: string; replaceable: boolean }[];
      };
    };

    await client.placeOrder({ symbol: "XLE", qty: 1, side: "buy", type: "limit", limit_price: 80 });
    await list();
    expect(reads.filter((r) => r.includes("nested=true"))).toEqual([]);

    const entry = await client.placeOrder({
      symbol: "XLE",
      qty: 3,
      side: "buy",
      type: "limit",
      limit_price: 91,
      bracket: { takeProfit: 95, stop: 85 },
    });
    const { working } = await list();
    const byId = new Map(working.map((r) => [r.id, r]));
    expect(byId.get(`${entry.id}-tp`)).toMatchObject({
      exitRole: "take-profit",
      replaceable: false,
    });
    expect(byId.get(`${entry.id}-sl`)).toMatchObject({ exitRole: "stop", replaceable: false });
    expect(
      working.filter((r) => r.exitRole === undefined).every((r) => !r.id.startsWith(entry.id)),
    ).toBe(true);
  });

  it("keeps the list when the naming read fails: the exits read as plain order types", async () => {
    const { client } = paper();
    const entry = await client.placeOrder({
      symbol: "XLE",
      qty: 3,
      side: "buy",
      type: "limit",
      limit_price: 91,
      bracket: { takeProfit: 95, stop: 85 },
    });
    const flaky = {
      listOrders: (params: { nested?: boolean }) =>
        params.nested ? Promise.reject(new Error("429")) : client.listOrders(params),
    };
    const config = { tradingClientFor: () => flaky } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    const url = "/api/trade/orders?participantId=member";
    await serveTradeOrdersApi(get(url), res, "/api/trade/orders", config, undefined as never);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.available).toBe(true);
    const tp = body.working.find((r: { id: string }) => r.id === `${entry.id}-tp`);
    expect(tp).toMatchObject({ orderType: "limit" });
    expect(tp.exitRole).toBeUndefined();
  });

  it("costs one read once the bracket has finished", async () => {
    const { client, transport, reads } = paper();
    const entry = await client.placeOrder({
      symbol: "XLE",
      qty: 3,
      side: "buy",
      type: "limit",
      limit_price: 91,
      bracket: { takeProfit: 95, stop: 85 },
    });
    await transport.delete(`/v2/orders/${entry.id}-tp`);
    await transport.delete(`/v2/orders/${entry.id}-sl`);
    reads.length = 0;
    const config = { tradingClientFor: () => client } as unknown as DashboardServerConfig;
    const { res } = fakeRes();
    const url = "/api/trade/orders?participantId=member";
    await serveTradeOrdersApi(get(url), res, "/api/trade/orders", config, undefined as never);
    expect(reads).toHaveLength(1);
  });
});
