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

  it("answers 404 under a route's sub-paths — never the parent's payload as another shape", async () => {
    // `/v2/account/portfolio/history` and `/v2/account/activities` share `/v2/account`'s first
    // segment; a prefix match once answered them with the account (no `equity` series), which the
    // net-worth route walked as a history and threw on — the crawl's ninth dead end (PR #3801).
    const transport = new FixtureTradingTransport(fixture);
    expect(
      (await transport.get("/v2/account/portfolio/history?period=1W&timeframe=1D")).status,
    ).toBe(404);
    expect((await transport.get("/v2/account/activities?activity_types=OPEXP")).status).toBe(404);
    expect((await transport.get("/v2/orders/o1")).status).toBe(404);
    // The routes themselves, with or without a query string, still answer.
    expect((await transport.get("/v2/account")).body).toEqual(fixture.account);
    expect((await transport.get("/v2/account?x=1")).body).toEqual(fixture.account);
    expect((await transport.get("/v2/orders?status=all")).body).toEqual(fixture.orders);
  });

  it("accepts writes as no-op 200s (never rejects an offline order)", async () => {
    const transport = new FixtureTradingTransport(fixture);
    expect((await transport.post("/v2/orders", {})).status).toBe(200);
  });
});
