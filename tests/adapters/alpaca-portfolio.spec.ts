import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { portfolioFromAlpaca, positionFromAlpaca } from "../../src/adapters/alpaca-portfolio.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";

// A short is negative in the engine whatever sign the payload carries (#4642 slice 5): every option
// rule reads a sold contract as a negative quantity, so a short put read as long would look like
// something to sell rather than something to secure.

const row = (over: Record<string, string>) => ({
  symbol: "CRWV261106P00085000",
  qty: "1",
  avg_entry_price: "2.10",
  market_value: "-190",
  ...over,
});

describe("positionFromAlpaca — short normalization", () => {
  it("turns a short reported with an unsigned qty negative", () => {
    expect(positionFromAlpaca(row({ side: "short" })).quantity).toBe(-1);
  });

  it("leaves a short already reported negative as it is", () => {
    expect(positionFromAlpaca(row({ side: "short", qty: "-2" })).quantity).toBe(-2);
  });

  it("leaves a long, or a row with no side at all, exactly as the payload says", () => {
    expect(positionFromAlpaca(row({ side: "long", qty: "3" })).quantity).toBe(3);
    expect(positionFromAlpaca(row({ qty: "3" })).quantity).toBe(3);
  });

  it("keeps the broker's dollar mark, and leaves an empty one off", () => {
    expect(positionFromAlpaca(row({ side: "short" })).marketValue).toBe(-190);
    expect(positionFromAlpaca(row({ market_value: "" }))).not.toHaveProperty("marketValue");
  });

  it("maps the account's cash beside the positions", () => {
    const account = { id: "a", cash: "5000", portfolio_value: "5000", status: "ACTIVE" };
    expect(portfolioFromAlpaca(account, [row({ side: "short" })])).toEqual({
      cash: 5000,
      positions: [
        { symbol: "CRWV261106P00085000", quantity: -1, avgPrice: 2.1, marketValue: -190 },
      ],
    });
  });

  it("is what AlpacaBrokerAdapter.getPortfolio reports", async () => {
    const answers: Record<string, unknown> = {
      "/v2/account": { id: "a", cash: "5000", portfolio_value: "5000", status: "ACTIVE" },
      "/v2/positions": [row({ side: "short" })],
    };
    const transport: AlpacaTradingTransport = {
      get: (path) => Promise.resolve({ status: 200, body: answers[path] }),
      post: () => Promise.resolve({ status: 404, body: null }),
      delete: () => Promise.resolve({ status: 404, body: null }),
    };
    const portfolio = await new AlpacaBrokerAdapter(
      new AlpacaTradingClient(transport),
    ).getPortfolio();
    expect(portfolio.positions[0]?.quantity).toBe(-1);
  });
});
