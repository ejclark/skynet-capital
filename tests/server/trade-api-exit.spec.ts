import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { EXIT_AT_ENTRY_REFUSAL, serveTradeApi } from "../../src/server/trade-api-routes.js";

// #8249 at the API: a stop-limit or an exit is parsed only for a session the setting admits. Any
// other session gets a sentence and nothing placed — never a silently dropped exit (that would
// place the entry bare). With the setting off, every body today's form sends answers as on main.

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

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const snapshot = {
  id: "human-eric",
  displayName: "Owner",
  kind: "human" as const,
  cash: 10_000,
  equity: 20_000,
  positions: [{ symbol: "XLF", quantity: 10, avgPrice: 45, marketValue: 500 }],
  activity: [],
};

function configWith(over: Partial<DashboardServerConfig> = {}) {
  const sent: unknown[] = [];
  const config = {
    hub: { getState: () => ({ generatedAt: "t", participants: [snapshot], collisions: [] }) },
    tradingEnabled: true,
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    isOwnerEmail: (email: string) => email === "owner@example.test",
    submitTrade: (body: unknown) => {
      sent.push(body);
      return Promise.resolve({ ok: true, orderId: "o-1", status: "new", symbol: "XLF" });
    },
    ...over,
  } as unknown as DashboardServerConfig;
  return { config, sent };
}

const owner = { email: "owner@example.test" } as never;
const member = { email: "member@example.test" } as never;

const limitBuy = {
  participantId: "human-eric",
  symbol: "XLF",
  quantity: 10,
  action: "buy",
  orderType: "limit",
  limitPrice: 50,
};
const bracket = { ...limitBuy, exit: { takeProfit: 55, stop: 47.5 } };
const stopLimit = { ...limitBuy, orderType: "stop_limit", stopPrice: 52, limitPrice: 52.5 };

async function call(
  path: "/api/trade/review" | "/api/trade/submit",
  body: unknown,
  config: DashboardServerConfig,
  session: unknown,
) {
  const { res, out } = fakeRes();
  await serveTradeApi(post(body), res, path, config, session as never);
  return { status: out.status, json: JSON.parse(out.body ?? "{}") };
}

describe("the trade API with the setting off (as committed)", () => {
  it.each([
    ["an exit", bracket],
    ["a stop-limit", stopLimit],
  ])("refuses %s with a sentence and places nothing", async (_name, body) => {
    const { config, sent } = configWith();
    for (const path of ["/api/trade/review", "/api/trade/submit"] as const) {
      const answer = await call(path, body, config, owner);
      expect(answer.status).toBe(400);
      expect(answer.json.refusals).toEqual([EXIT_AT_ENTRY_REFUSAL]);
    }
    expect(sent).toEqual([]);
  });

  it("passes every body today's form sends to the seam unchanged — no exit key appears", async () => {
    const { config, sent } = configWith();
    const today = [
      { ...limitBuy, orderType: "market" },
      limitBuy,
      { ...limitBuy, orderType: "limit", timeInForce: "day" },
      { ...limitBuy, action: "sell", orderType: "stop", stopPrice: 40, limitPrice: undefined },
      // `exit: null` is no exit, as on main (which dropped it like any unknown field).
      { ...limitBuy, exit: null },
    ];
    for (const body of today) {
      const answer = await call("/api/trade/submit", body, config, owner);
      expect(answer.json.ok).toBe(true);
    }
    expect(sent).toEqual([
      { ...limitBuy, orderType: "market" },
      limitBuy,
      { ...limitBuy, timeInForce: "day" },
      {
        participantId: "human-eric",
        symbol: "XLF",
        quantity: 10,
        action: "sell",
        orderType: "stop",
        stopPrice: 40,
      },
      limitBuy,
    ]);
  });
});

describe("the trade API with the setting on", () => {
  it("previews a bracket for an admitted member: both exits, GTC, the dollars from the ticket", async () => {
    const { config } = configWith({ exitAtEntry: "members" } as never);
    const { json } = await call("/api/trade/review", bracket, config, member);
    expect(json.preview).toEqual(
      expect.objectContaining({
        ok: true,
        timeInForce: "gtc",
        exit: { takeProfit: 55, stop: 47.5, takeProfitDollars: 50, stopDollars: -25 },
      }),
    );
  });

  it("hands the exit and a stop-limit to the execution seam for an admitted member", async () => {
    const { config, sent } = configWith({ exitAtEntry: "members" } as never);
    await call("/api/trade/submit", bracket, config, member);
    await call("/api/trade/submit", stopLimit, config, member);
    expect(sent).toEqual([bracket, stopLimit]);
  });

  it("admits only the owner under `owner`", async () => {
    const { config, sent } = configWith({ exitAtEntry: "owner" } as never);
    const refused = await call("/api/trade/submit", bracket, config, member);
    expect(refused.status).toBe(400);
    expect(refused.json.refusals).toEqual([EXIT_AT_ENTRY_REFUSAL]);
    await call("/api/trade/submit", bracket, config, owner);
    expect(sent).toEqual([bracket]);
  });

  it("admits nobody without a session, whatever the setting", async () => {
    const { config, sent } = configWith({ exitAtEntry: "members" } as never);
    const answer = await call("/api/trade/submit", bracket, config, undefined);
    expect(answer.status).toBe(400);
    expect(sent).toEqual([]);
  });

  it("refuses an exit that is not an object as malformed, never dropping it", async () => {
    const { config, sent } = configWith({ exitAtEntry: "members" } as never);
    const answer = await call("/api/trade/submit", { ...limitBuy, exit: "55/47" }, config, member);
    expect(answer.status).toBe(400);
    expect(sent).toEqual([]);
  });

  it("keeps a missing exit price for the ticket to refuse in words", async () => {
    const { config } = configWith({ exitAtEntry: "members" } as never);
    const { json } = await call(
      "/api/trade/review",
      { ...limitBuy, exit: { takeProfit: 55 } },
      config,
      member,
    );
    expect(json.preview.ok).toBe(false);
    expect(json.preview.refusals).toContain("Enter a stop price greater than zero.");
  });
});
