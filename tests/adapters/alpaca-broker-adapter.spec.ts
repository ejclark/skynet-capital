import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

class FakeTradingTransport implements AlpacaTradingTransport {
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  post(path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  delete(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
}

const adapterWith = (responses: Record<string, JsonResponse>): AlpacaBrokerAdapter =>
  new AlpacaBrokerAdapter(new AlpacaTradingClient(new FakeTradingTransport(responses)));

const buy: OrderIntent = { symbol: "EEM", side: "buy", quantity: 100, type: "market", reason: "t" };

describe("AlpacaBrokerAdapter", () => {
  describe("getPortfolio", () => {
    it("maps Alpaca's string-typed account and positions into the domain Portfolio", async () => {
      const adapter = adapterWith({
        "/v2/account": {
          status: 200,
          body: { id: "a1", cash: "4000000", portfolio_value: "5000000", status: "ACTIVE" },
        },
        "/v2/positions": {
          status: 200,
          body: [{ symbol: "EEM", qty: "500", avg_entry_price: "42.10", market_value: "21050" }],
        },
      });

      const portfolio = await adapter.getPortfolio();

      expect(portfolio.cash).toBe(4_000_000);
      expect(portfolio.positions[0]).toEqual({ symbol: "EEM", quantity: 500, avgPrice: 42.1 });
    });
  });

  describe("submit", () => {
    it("reports a filled result when the order is accepted", async () => {
      const adapter = adapterWith({
        "/v2/orders": {
          status: 200,
          body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
        },
      });

      const result = await adapter.submit(buy);

      expect(result).toMatchObject({ status: "filled", filledQuantity: 100 });
    });

    it("reports a rejected result when the API errors", async () => {
      const adapter = adapterWith({
        "/v2/orders": { status: 403, body: { message: "insufficient buying power" } },
      });

      const result = await adapter.submit(buy);

      expect(result.status).toBe("rejected");
      expect(result.reason).toContain("403");
    });
  });
});
