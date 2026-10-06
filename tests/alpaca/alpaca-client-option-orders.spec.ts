import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaApiError, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

// The client reads and writes the bots' option order flow needs (#4642 slice 5): a client order id
// on both order shapes, the feed's quote stamp on a held contract's snapshot, a GET by client order
// id that answers "no such order" as undefined, and the open-orders list with mleg legs nested.

interface Call {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
}

function transport(answer: (path: string) => JsonResponse, calls: Call[]): AlpacaTradingTransport {
  return {
    get: (path) => {
      calls.push({ method: "GET", path });
      return Promise.resolve(answer(path));
    },
    post: (path, body) => {
      calls.push({ method: "POST", path, body });
      return Promise.resolve(answer(path));
    },
    delete: (path) => {
      calls.push({ method: "DELETE", path });
      return Promise.resolve(answer(path));
    },
  };
}

const ok = (body: unknown): JsonResponse => ({ status: 200, body });

describe("AlpacaOptionsClient — a bot's option order", () => {
  it("stamps client_order_id on a single-leg order when one is given", async () => {
    const calls: Call[] = [];
    const client = new AlpacaOptionsClient(transport(() => ok({ id: "o1", status: "new" }), calls));
    await client.placeOptionOrder({
      occSymbol: "CRWV261106P00085000",
      contracts: 1,
      side: "sell",
      type: "limit",
      limitPrice: 2.1,
      positionIntent: "sell_to_open",
      timeInForce: "day",
      clientOrderId: "sk1-sauron-CRWV-mg1x2-0",
    });
    expect(calls[0]?.body).toEqual({
      symbol: "CRWV261106P00085000",
      qty: 1,
      side: "sell",
      type: "limit",
      limit_price: 2.1,
      time_in_force: "day",
      position_intent: "sell_to_open",
      client_order_id: "sk1-sauron-CRWV-mg1x2-0",
    });
  });

  it("stamps client_order_id on an mleg order, leaving the signed net limit untouched", async () => {
    const calls: Call[] = [];
    const client = new AlpacaOptionsClient(transport(() => ok({ id: "m1", status: "new" }), calls));
    await client.placeMultiLegOrder({
      quantity: 1,
      netLimitPrice: -0.85,
      timeInForce: "day",
      clientOrderId: "sk1-sauron-NVDA-mg1x2-1",
      legs: [
        {
          occSymbol: "NVDA261113C00190000",
          ratioQty: 1,
          side: "sell",
          positionIntent: "sell_to_close",
        },
        {
          occSymbol: "NVDA261113C00200000",
          ratioQty: 1,
          side: "buy",
          positionIntent: "buy_to_close",
        },
      ],
    });
    expect(calls[0]?.body).toMatchObject({
      order_class: "mleg",
      limit_price: -0.85,
      client_order_id: "sk1-sauron-NVDA-mg1x2-1",
    });
  });

  it("carries the feed's quote stamp on a held contract's snapshot, and drops a junk one", async () => {
    const calls: Call[] = [];
    const client = new AlpacaOptionsClient(
      transport(() => ok({}), calls),
      transport(
        () =>
          ok({
            snapshots: {
              CRWV261106P00085000: {
                latestQuote: { bp: 2, ap: 2.2, t: "2026-10-07T14:59:30Z" },
              },
              CRWV261106P00080000: { latestQuote: { bp: 1, ap: 1.1, t: "yesterday-ish" } },
            },
          }),
        calls,
      ),
    );
    const snaps = await client.getContractSnapshots(["CRWV261106P00085000", "CRWV261106P00080000"]);
    expect(snaps.get("CRWV261106P00085000")).toEqual({
      bid: 2,
      ask: 2.2,
      quotedAt: "2026-10-07T14:59:30Z",
    });
    expect(snaps.get("CRWV261106P00080000")).toEqual({ bid: 1, ask: 1.1 });
  });
});

describe("AlpacaTradingClient — finding and listing a bot's orders", () => {
  it("reads one order by its client order id, legs included", async () => {
    const calls: Call[] = [];
    const client = new AlpacaTradingClient(
      transport(
        () =>
          ok({
            id: "m1",
            symbol: "",
            qty: "1",
            side: "buy",
            status: "new",
            client_order_id: "sk1-sauron-NVDA-mg1x2-1",
            order_class: "mleg",
            legs: [
              { id: "l1", symbol: "NVDA261113C00190000", qty: "1", side: "buy", status: "new" },
            ],
          }),
        calls,
      ),
    );
    const order = await client.getOrderByClientOrderId("sk1-sauron-NVDA-mg1x2-1");
    expect(calls[0]?.path).toBe(
      "/v2/orders:by_client_order_id?client_order_id=sk1-sauron-NVDA-mg1x2-1",
    );
    expect(order?.legs?.[0]?.symbol).toBe("NVDA261113C00190000");
  });

  it("answers undefined for an id Alpaca has never seen (404), and throws on any other failure", async () => {
    const missing = new AlpacaTradingClient(
      transport(() => ({ status: 404, body: { message: "order not found" } }), []),
    );
    expect(await missing.getOrderByClientOrderId("sk1-x-CRWV-1-0")).toBeUndefined();

    const down = new AlpacaTradingClient(transport(() => ({ status: 500, body: null }), []));
    await expect(down.getOrderByClientOrderId("sk1-x-CRWV-1-0")).rejects.toBeInstanceOf(
      AlpacaApiError,
    );
  });

  it("nests mleg legs under their parent only when asked; every existing list stays flat", async () => {
    const calls: Call[] = [];
    const client = new AlpacaTradingClient(transport(() => ok([]), calls));
    await client.listOrders({ status: "open", nested: true, limit: 100 });
    await client.listOrders({ status: "open" });
    expect(calls[0]?.path).toContain("nested=true");
    expect(calls[0]?.path).toContain("limit=100");
    expect(calls[1]?.path).toContain("nested=false");
  });
});
