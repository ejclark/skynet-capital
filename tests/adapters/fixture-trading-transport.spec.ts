import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";

const fixture = {
  account: { id: "sim", cash: "1000", portfolio_value: "1200", status: "ACTIVE" },
  positions: [{ symbol: "EEM", qty: "10", avg_entry_price: "40", market_value: "420" }],
  orders: [{ id: "o1", symbol: "EEM", qty: "10", side: "buy", status: "filled" }],
};

describe("FixtureTradingTransport", () => {
  it("routes account/positions/orders/clock by path", async () => {
    const transport = new FixtureTradingTransport(fixture);
    expect((await transport.get("/v2/account")).body).toEqual(fixture.account);
    expect((await transport.get("/v2/positions")).body).toEqual(fixture.positions);
    expect((await transport.get("/v2/orders?status=all")).body).toEqual(fixture.orders);
    expect((await transport.get("/v2/clock")).body).toEqual({ is_open: true });
  });

  it("defaults missing collections to empty and unknown paths to 404", async () => {
    const transport = new FixtureTradingTransport({ account: fixture.account });
    expect((await transport.get("/v2/positions")).body).toEqual([]);
    expect((await transport.get("/v2/orders")).body).toEqual([]);
    expect((await transport.get("/v2/nope")).status).toBe(404);
  });

  it("accepts writes as no-op 200s (never rejects an offline order)", async () => {
    const transport = new FixtureTradingTransport(fixture);
    expect((await transport.post("/v2/orders", {})).status).toBe(200);
  });
});
