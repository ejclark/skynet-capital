import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Participant } from "../../src/participants/participant.js";
import { resolveDeskTrading } from "../../src/server/account-identity-gate.js";

// #8249 at the execution seam: the exit re-reviewed against live numbers like every other field,
// then sent as ONE Alpaca bracket order built from the re-reviewed preview. And the guard on the
// trade core: an order with no exit reaches the broker byte-for-byte as it did before.

const member: Participant = {
  id: "ann",
  displayName: "Member",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

function makeDesk(quote = 50) {
  const posted: unknown[] = [];
  const inner = new FixtureTradingTransport({
    account: { id: "acct", cash: "100000", portfolio_value: "100000", status: "ACTIVE" },
    positions: [],
  });
  const t: AlpacaTradingTransport = {
    get: (path): Promise<JsonResponse> => inner.get(path),
    post: (_path, body): Promise<JsonResponse> => {
      posted.push(body);
      return Promise.resolve({
        status: 200,
        body: { id: "order-1", symbol: "XLF", status: "new", time_in_force: "gtc" },
      });
    },
    delete: (path): Promise<JsonResponse> => inner.delete(path),
  };
  const priced: AlpacaTradingTransport = {
    get: () => Promise.resolve({ status: 200, body: { trade: { p: quote } } }),
    post: () => Promise.resolve({ status: 404, body: {} }),
    delete: () => Promise.resolve({ status: 404, body: {} }),
  };
  const desk = resolveDeskTrading({
    findParticipant: (id) => (id === "ann" ? member : undefined),
    clientFactory: () => new AlpacaTradingClient(t),
    optionsClientFactory: () => new AlpacaOptionsClient(t, priced),
    authConfigured: true,
  });
  return { desk, posted };
}

const limitBuy = {
  participantId: "ann",
  symbol: "xlf",
  quantity: 10,
  action: "buy" as const,
  orderType: "limit" as const,
  limitPrice: 50,
};

describe("the desk seam — a bracket buy (#8249)", () => {
  it("sends one bracket order: limit entry, GTC, both exits, no extended hours", async () => {
    const { desk, posted } = makeDesk();
    const result = await desk.submit({ ...limitBuy, exit: { takeProfit: 55, stop: 47.5 } }, "ann");
    expect(result).toMatchObject({ ok: true, orderId: "order-1" });
    expect(posted).toEqual([
      {
        symbol: "XLF",
        qty: 10,
        side: "buy",
        type: "limit",
        time_in_force: "gtc",
        limit_price: 50,
        order_class: "bracket",
        take_profit: { limit_price: 55 },
        stop_loss: { stop_price: 47.5 },
      },
    ]);
  });

  it("re-reviews the exit and sends nothing when it fails the rules", async () => {
    const { desk, posted } = makeDesk();
    const result = await desk.submit({ ...limitBuy, exit: { takeProfit: 55, stop: 50 } }, "ann");
    expect(result).toEqual({
      ok: false,
      refusals: ["The stop ($50.00) must be at least $0.01 below the limit ($50.00)."],
    });
    expect(posted).toEqual([]);
  });

  it("sends a stop-limit with both prices", async () => {
    const { desk, posted } = makeDesk();
    await desk.submit(
      { ...limitBuy, orderType: "stop_limit", stopPrice: 52, limitPrice: 52.5 },
      "ann",
    );
    expect(posted).toEqual([
      {
        symbol: "XLF",
        qty: 10,
        side: "buy",
        type: "stop_limit",
        time_in_force: "gtc",
        limit_price: 52.5,
        stop_price: 52,
      },
    ]);
  });

  it("sends an order with no exit exactly as before: no order class, no legs", async () => {
    const { desk, posted } = makeDesk();
    await desk.submit(limitBuy, "ann");
    await desk.submit({ ...limitBuy, orderType: "market" }, "ann");
    expect(posted).toEqual([
      { symbol: "XLF", qty: 10, side: "buy", type: "limit", time_in_force: "gtc", limit_price: 50 },
      { symbol: "XLF", qty: 10, side: "buy", type: "market", time_in_force: "day" },
    ]);
  });
});
