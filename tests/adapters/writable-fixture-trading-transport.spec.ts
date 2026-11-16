import { WritableFixtureTradingTransport } from "../../src/adapters/writable-fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaApiError, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";

// The offline paper account a change scenario can actually change: every write lands and reads
// back through the same client the server uses, in Alpaca's own shapes and refusals.

const NOW = new Date("2026-11-16T15:00:00.000Z");
const fixture = () => ({
  account: { id: "sim", cash: "10000.00", portfolio_value: "14200.00", status: "ACTIVE" },
  positions: [{ symbol: "EEM", qty: "100", avg_entry_price: "40", market_value: "4200" }],
  orders: [
    {
      id: "o1",
      symbol: "EEM",
      qty: "100",
      side: "buy",
      status: "filled",
      submitted_at: "2026-11-01T15:00:00Z",
    },
  ],
});
const marks = new Map([
  ["AAPL", 150],
  ["NVDA250117C00150000", 5],
]);
const setup = () => {
  const transport = new WritableFixtureTradingTransport(fixture(), {
    marks,
    now: () => NOW,
    idPrefix: "t",
  });
  return { transport, client: new AlpacaTradingClient(transport) };
};

describe("WritableFixtureTradingTransport — a member's order lands", () => {
  it("fills a market buy at the mark: the order reads back filled, the position and cash move", async () => {
    const { client } = setup();
    const order = await client.placeOrder({ symbol: "AAPL", qty: 10, side: "buy" });
    expect(order).toMatchObject({
      symbol: "AAPL",
      qty: "10",
      side: "buy",
      type: "market",
      status: "filled",
      filled_avg_price: "150",
    });
    const positions = await client.getPositions();
    expect(positions.find((p) => p.symbol === "AAPL")).toMatchObject({
      qty: "10",
      avg_entry_price: "150",
      side: "long",
    });
    expect((await client.getAccount()).cash).toBe("8500.00");
  });

  it("rests a limit below the market as an open order, then a replace supersedes it", async () => {
    const { client } = setup();
    const order = await client.placeOrder({
      symbol: "AAPL",
      qty: 5,
      side: "buy",
      type: "limit",
      limit_price: 140,
    });
    expect(order).toMatchObject({ status: "new", limit_price: "140", time_in_force: "gtc" });
    expect((await client.listOrders({ status: "open" })).map((o) => o.id)).toEqual([order.id]);

    const next = await client.replaceOrder(order.id, { limit_price: 142 });
    expect(next).toMatchObject({ replaces: order.id, limit_price: "142", status: "new" });
    expect(await client.getOrder(order.id)).toMatchObject({
      status: "replaced",
      replaced_by: next.id,
    });
  });

  it("cancels an open order, and refuses to cancel one already filled", async () => {
    const { client } = setup();
    const resting = await client.placeOrder({
      symbol: "AAPL",
      qty: 1,
      side: "buy",
      type: "limit",
      limit_price: 100,
    });
    await client.cancelOrder(resting.id);
    expect(await client.getOrder(resting.id)).toMatchObject({ status: "canceled" });
    expect(await client.listOrders({ status: "open" })).toEqual([]);
    await expect(client.cancelOrder("o1")).rejects.toBeInstanceOf(AlpacaApiError);
  });

  it("answers a buy past cash with Alpaca's 403 — the wall a guardrail scenario must meet", async () => {
    const { client } = setup();
    await expect(
      client.placeOrder({ symbol: "AAPL", qty: 1000, side: "buy" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(await client.listOrders({ status: "all" })).toHaveLength(1);
  });

  it("sells part of a holding at its own derived mark and keeps the cost basis", async () => {
    const { client } = setup();
    await client.placeOrder({ symbol: "EEM", qty: 40, side: "sell" });
    const eem = (await client.getPositions()).find((p) => p.symbol === "EEM");
    expect(eem).toMatchObject({ qty: "60", avg_entry_price: "40" });
    expect((await client.getAccount()).cash).toBe("11680.00"); // 10,000 + 40 × $42
  });

  it("never invents a price: a market order on an unmarked symbol stays accepted, unfilled", async () => {
    const { client } = setup();
    const order = await client.placeOrder({ symbol: "ZZZZ", qty: 1, side: "buy" });
    expect(order).toMatchObject({ status: "accepted", filled_qty: "0" });
  });

  it("opens and closes an option position with the 100× multiplier", async () => {
    const { transport, client } = setup();
    const options = new AlpacaOptionsClient(transport);
    await options.placeOptionOrder({
      occSymbol: "NVDA250117C00150000",
      contracts: 2,
      side: "buy",
      type: "market",
      positionIntent: "buy_to_open",
    });
    expect((await client.getAccount()).cash).toBe("9000.00"); // 2 × $5 × 100
    expect(
      (await client.getPositions()).find((p) => p.symbol === "NVDA250117C00150000"),
    ).toMatchObject({ qty: "2", asset_class: "us_option" });
    await options.placeOptionOrder({
      occSymbol: "NVDA250117C00150000",
      contracts: 2,
      side: "sell",
      type: "market",
      positionIntent: "sell_to_close",
    });
    expect((await client.getPositions()).some((p) => p.symbol === "NVDA250117C00150000")).toBe(
      false,
    );
    expect((await client.getAccount()).cash).toBe("10000.00");
  });

  it("closes a whole position through DELETE /v2/positions/:symbol", async () => {
    const { transport, client } = setup();
    const res = await transport.delete("/v2/positions/EEM");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ symbol: "EEM", side: "sell", qty: "100", status: "filled" });
    expect(await client.getPositions()).toEqual([]);
  });

  it("refuses malformed orders in Alpaca's words, landing nothing", async () => {
    const { transport, client } = setup();
    expect(
      (await transport.post("/v2/orders", { symbol: "AAPL", qty: 0, side: "buy", type: "market" }))
        .status,
    ).toBe(422);
    expect(
      (await transport.post("/v2/orders", { symbol: "AAPL", qty: 1, side: "buy", type: "limit" }))
        .status,
    ).toBe(422);
    expect(await client.listOrders({ status: "all" })).toHaveLength(1);
  });

  it("cancels every open order at once with a 207 per order", async () => {
    const { transport, client } = setup();
    await client.placeOrder({
      symbol: "AAPL",
      qty: 1,
      side: "buy",
      type: "limit",
      limit_price: 100,
    });
    await client.placeOrder({ symbol: "AAPL", qty: 1, side: "buy", type: "stop", stop_price: 160 });
    const res = await transport.delete("/v2/orders");
    expect(res.status).toBe(207);
    expect(res.body).toHaveLength(2);
    expect(await client.listOrders({ status: "open" })).toEqual([]);
  });

  it("queues a market order after hours, unfilled, as a paper account would", async () => {
    const transport = new WritableFixtureTradingTransport(fixture(), {
      marks,
      now: () => NOW,
      clock: () => ({ is_open: false, next_open: "2026-11-17T14:30:00Z" }),
    });
    const client = new AlpacaTradingClient(transport);
    const order = await client.placeOrder({ symbol: "AAPL", qty: 1, side: "buy" });
    expect(order).toMatchObject({ status: "accepted", filled_qty: "0" });
    expect(await client.isMarketOpen()).toBe(false);
    expect((await client.getPositions()).some((p) => p.symbol === "AAPL")).toBe(false);
  });
});
