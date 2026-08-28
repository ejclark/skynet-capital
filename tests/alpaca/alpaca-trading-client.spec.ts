import { AlpacaApiError, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

/** Transport double: scripts a response per path prefix and records every call — prefix
 *  matching (rather than exact) so a GET's query string or a DELETE's id in the path still
 *  resolves against a plain route like "/v2/orders". */
class FakeTradingTransport implements AlpacaTradingTransport {
  readonly gets: string[] = [];
  readonly posts: Array<{ path: string; body: unknown }> = [];
  readonly deletes: string[] = [];
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  private respond(path: string): JsonResponse {
    const hit = Object.entries(this.responses).find(([key]) => path.startsWith(key));
    return hit?.[1] ?? { status: 404, body: null };
  }
  get(path: string): Promise<JsonResponse> {
    this.gets.push(path);
    return Promise.resolve(this.respond(path));
  }
  post(path: string, body: unknown): Promise<JsonResponse> {
    this.posts.push({ path, body });
    return Promise.resolve(this.respond(path));
  }
  delete(path: string): Promise<JsonResponse> {
    this.deletes.push(path);
    return Promise.resolve(this.respond(path));
  }
}

describe("AlpacaTradingClient", () => {
  describe("getAccount", () => {
    it("returns the parsed account on 200", async () => {
      const client = new AlpacaTradingClient(
        new FakeTradingTransport({
          "/v2/account": {
            status: 200,
            body: { id: "a1", cash: "5000000", portfolio_value: "5000000", status: "ACTIVE" },
          },
        }),
      );

      const account = await client.getAccount();

      expect(account.cash).toBe("5000000");
      expect(account.status).toBe("ACTIVE");
    });

    it("throws AlpacaApiError on a non-2xx status", async () => {
      const client = new AlpacaTradingClient(
        new FakeTradingTransport({
          "/v2/account": { status: 401, body: { message: "forbidden" } },
        }),
      );

      await expect(client.getAccount()).rejects.toBeInstanceOf(AlpacaApiError);
    });
  });

  describe("placeOrder", () => {
    it("POSTs a market/day order and returns the created order", async () => {
      const transport = new FakeTradingTransport({
        "/v2/orders": {
          status: 200,
          body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
        },
      });
      const client = new AlpacaTradingClient(transport);

      const order = await client.placeOrder({ symbol: "EEM", qty: 100, side: "buy" });

      expect(order.status).toBe("accepted");
      expect(transport.posts[0]?.body).toMatchObject({
        symbol: "EEM",
        qty: 100,
        side: "buy",
        type: "market",
        time_in_force: "day",
      });
    });

    it("POSTs a limit order GTC, with the limit price", async () => {
      const transport = new FakeTradingTransport({
        "/v2/orders": {
          status: 200,
          body: { id: "o2", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
        },
      });
      const client = new AlpacaTradingClient(transport);

      await client.placeOrder({
        symbol: "EEM",
        qty: 100,
        side: "buy",
        type: "limit",
        limit_price: 42.5,
      });

      expect(transport.posts[0]?.body).toMatchObject({
        type: "limit",
        time_in_force: "gtc",
        limit_price: 42.5,
      });
    });

    it("POSTs a stop order GTC, with the stop price", async () => {
      const transport = new FakeTradingTransport({
        "/v2/orders": {
          status: 200,
          body: { id: "o3", symbol: "EEM", qty: "100", side: "sell", status: "accepted" },
        },
      });
      const client = new AlpacaTradingClient(transport);

      await client.placeOrder({
        symbol: "EEM",
        qty: 100,
        side: "sell",
        type: "stop",
        stop_price: 30,
      });

      expect(transport.posts[0]?.body).toMatchObject({
        type: "stop",
        time_in_force: "gtc",
        stop_price: 30,
      });
    });
  });

  describe("listOrders", () => {
    it("defaults to status=all, matching today's behavior", async () => {
      const transport = new FakeTradingTransport({ "/v2/orders": { status: 200, body: [] } });
      const client = new AlpacaTradingClient(transport);

      await client.listOrders();

      expect(transport.gets[0]).toContain("status=all");
    });

    it("passes an explicit status through to the query — Open Orders reads status=open", async () => {
      const transport = new FakeTradingTransport({
        "/v2/orders": {
          status: 200,
          body: [{ id: "o1", symbol: "AAPL", qty: "1", side: "buy", status: "new" }],
        },
      });
      const client = new AlpacaTradingClient(transport);

      const orders = await client.listOrders({ status: "open" });

      expect(transport.gets[0]).toContain("status=open");
      expect(orders).toHaveLength(1);
    });
  });

  describe("cancelOrder", () => {
    it("resolves on a 204 with no body", async () => {
      const transport = new FakeTradingTransport({ "/v2/orders/o1": { status: 204, body: null } });
      const client = new AlpacaTradingClient(transport);

      await expect(client.cancelOrder("o1")).resolves.toBeUndefined();
      expect(transport.deletes).toEqual(["/v2/orders/o1"]);
    });

    it("throws AlpacaApiError when the order can't be canceled (already filled, unknown id, etc.)", async () => {
      const transport = new FakeTradingTransport({
        "/v2/orders/o1": { status: 422, body: { message: 'order is already in "filled" state' } },
      });
      const client = new AlpacaTradingClient(transport);

      await expect(client.cancelOrder("o1")).rejects.toBeInstanceOf(AlpacaApiError);
    });
  });
});
