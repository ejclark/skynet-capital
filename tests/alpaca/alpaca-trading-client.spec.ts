import { AlpacaApiError, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

/** Transport double: scripts a response per path and records POST bodies. */
class FakeTradingTransport implements AlpacaTradingTransport {
  readonly posts: Array<{ path: string; body: unknown }> = [];
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  post(path: string, body: unknown): Promise<JsonResponse> {
    this.posts.push({ path, body });
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
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
  });
});
