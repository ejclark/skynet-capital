import { WritableFixtureTradingTransport } from "../../src/adapters/writable-fixture-trading-transport.js";
import {
  AlpacaApiError,
  type AlpacaOrder,
  AlpacaTradingClient,
} from "../../src/alpaca/alpaca-trading-client.js";

// #8249: the offline paper account models an Alpaca bracket — the entry plus a take-profit and a
// stop it holds. The exits read `held` until the entry fills, then `new`; one exit filling cancels
// the other; cancelling the entry cancels both; and Alpaca's walls stand (no extended hours, each
// exit a cent on its side of the base price).

const NOW = new Date("2026-11-16T15:00:00.000Z");

function setup(open = true) {
  const clock = { is_open: open };
  const transport = new WritableFixtureTradingTransport(
    {
      account: { id: "sim", cash: "10000.00", portfolio_value: "14200.00", status: "ACTIVE" },
      positions: [{ symbol: "EEM", qty: "100", avg_entry_price: "40", market_value: "4200" }],
    },
    { marks: new Map([["AAPL", 150]]), now: () => NOW, idPrefix: "t", clock: () => clock },
  );
  return { transport, clock, client: new AlpacaTradingClient(transport) };
}

const bracketBuy = (limit: number) => ({
  symbol: "AAPL",
  qty: 10,
  side: "buy" as const,
  type: "limit" as const,
  limit_price: limit,
  bracket: { takeProfit: 160, stop: 145 },
});

const byId = (orders: AlpacaOrder[]) => new Map(orders.map((o) => [o.id, o]));

async function statuses(client: AlpacaTradingClient, id: string) {
  const rows = byId(await client.listOrders({ status: "all", limit: 50 }));
  return {
    entry: rows.get(id)?.status,
    takeProfit: rows.get(`${id}-tp`)?.status,
    stop: rows.get(`${id}-sl`)?.status,
  };
}

describe("WritableFixtureTradingTransport — a bracket order (#8249)", () => {
  it("fills a marketable entry and puts both exits to work, each its own row in a flat read", async () => {
    const { client } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    expect(entry).toMatchObject({ status: "filled", order_class: "bracket" });
    expect(await statuses(client, entry.id)).toEqual({
      entry: "filled",
      takeProfit: "new",
      stop: "new",
    });
    const rows = byId(await client.listOrders({ status: "open", limit: 50 }));
    expect(rows.get(`${entry.id}-tp`)).toMatchObject({
      side: "sell",
      type: "limit",
      limit_price: "160",
      qty: "10",
      time_in_force: "gtc",
    });
    expect(rows.get(`${entry.id}-sl`)).toMatchObject({
      side: "sell",
      type: "stop",
      stop_price: "145",
    });
  });

  it("rolls the exits up under the entry in a nested read", async () => {
    const { client } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    const nested = await client.listOrders({ status: "all", limit: 50, nested: true });
    const parent = nested.find((o) => o.id === entry.id) as AlpacaOrder & { legs: AlpacaOrder[] };
    expect(nested.some((o) => o.id === `${entry.id}-tp`)).toBe(false);
    expect(parent.legs.map((l) => l.id)).toEqual([`${entry.id}-tp`, `${entry.id}-sl`]);
  });

  it("holds the exits while the entry rests, and cancels both with the entry", async () => {
    const { client, transport } = setup();
    const entry = await client.placeOrder(bracketBuy(148));
    expect(await statuses(client, entry.id)).toEqual({
      entry: "new",
      takeProfit: "held",
      stop: "held",
    });
    await transport.delete(`/v2/orders/${entry.id}`);
    expect(await statuses(client, entry.id)).toEqual({
      entry: "canceled",
      takeProfit: "canceled",
      stop: "canceled",
    });
  });

  it("fills the take-profit when the price reaches it, and cancels the stop", async () => {
    const { client, transport } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    transport.mark("AAPL", 161);
    expect(await statuses(client, entry.id)).toEqual({
      entry: "filled",
      takeProfit: "filled",
      stop: "canceled",
    });
    expect((await client.getPositions()).some((p) => p.symbol === "AAPL")).toBe(false);
    // Bought 10 at 150, sold 10 at 161: the account is $110 up.
    expect(Number((await client.getAccount()).cash)).toBe(10_110);
  });

  it("triggers the stop when the price falls through it, sells at the market, and cancels the take-profit", async () => {
    const { client, transport } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    transport.mark("AAPL", 140);
    expect(await statuses(client, entry.id)).toEqual({
      entry: "filled",
      takeProfit: "canceled",
      stop: "filled",
    });
    const rows = byId(await client.listOrders({ status: "all", limit: 50 }));
    expect(rows.get(`${entry.id}-sl`)?.filled_avg_price).toBe("140");
  });

  it("placed while the market is shut, waits for the open, then puts the exits to work", async () => {
    const { client, clock } = setup(false);
    const entry = await client.placeOrder(bracketBuy(151));
    expect(await statuses(client, entry.id)).toEqual({
      entry: "new",
      takeProfit: "held",
      stop: "held",
    });
    clock.is_open = true;
    expect(await statuses(client, entry.id)).toEqual({
      entry: "filled",
      takeProfit: "new",
      stop: "new",
    });
  });

  it("refuses a bracket in extended hours, and exits that sit too close to the base price", async () => {
    const { transport } = setup();
    const base = {
      symbol: "AAPL",
      qty: 1,
      side: "buy",
      type: "limit",
      time_in_force: "gtc",
      limit_price: 150,
      order_class: "bracket",
      take_profit: { limit_price: 160 },
      stop_loss: { stop_price: 145 },
    };
    const answers = await Promise.all([
      transport.post("/v2/orders", { ...base, extended_hours: true }),
      transport.post("/v2/orders", { ...base, take_profit: { limit_price: 150 } }),
      transport.post("/v2/orders", { ...base, stop_loss: { stop_price: 150 } }),
    ]);
    expect(answers.map((a) => a.status)).toEqual([422, 422, 422]);
    expect(answers.map((a) => (a.body as { message: string }).message)).toEqual([
      "bracket orders are not allowed in extended hours",
      "take_profit.limit_price must be >= base_price + 0.01",
      "stop_loss.stop_price must be <= base_price - 0.01",
    ]);
  });

  it("refuses to replace a bracket piece rather than cut the link between its exits", async () => {
    const { client } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    await expect(
      client.replaceOrder(`${entry.id}-tp`, { limit_price: 170 }),
    ).rejects.toBeInstanceOf(AlpacaApiError);
  });

  it("leaves a simple stop resting exactly as before, even past its price", async () => {
    const { client } = setup();
    const stop = await client.placeOrder({
      symbol: "EEM",
      qty: 10,
      side: "sell",
      type: "stop",
      stop_price: 50,
    });
    await client.listOrders({ status: "all" });
    expect(byId(await client.listOrders({ status: "all", limit: 50 })).get(stop.id)?.status).toBe(
      "new",
    );
  });
});

describe("WritableFixtureTradingTransport — the shares a bracket's exits hold (#8249)", () => {
  it("refuses a sell or a close of shares the exits hold, in Alpaca's words, and opens no short", async () => {
    const { client, transport } = setup();
    await client.placeOrder(bracketBuy(151));
    const sell = await transport.post("/v2/orders", {
      symbol: "AAPL",
      qty: 1,
      side: "sell",
      type: "market",
      time_in_force: "day",
    });
    const close = await transport.delete("/v2/positions/AAPL");
    expect([sell.status, close.status]).toEqual([403, 403]);
    expect((close.body as { message: string }).message).toBe(
      "insufficient qty available for order (requested: 10, available: 0)",
    );
    expect((await client.getPositions()).find((p) => p.symbol === "AAPL")?.qty).toBe("10");
  });

  it("frees the shares once the exits are done", async () => {
    const { client, transport } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    await transport.delete(`/v2/orders/${entry.id}-tp`);
    await transport.delete(`/v2/orders/${entry.id}-sl`);
    expect((await transport.delete("/v2/positions/AAPL")).status).toBe(200);
  });

  it("keeps a filled entry with a working exit in a nested open read, exits underneath", async () => {
    const { client } = setup();
    const entry = await client.placeOrder(bracketBuy(151));
    const open = await client.listOrders({ status: "open", nested: true });
    expect(open.map((o) => o.id)).toEqual([entry.id]);
    expect(open[0]?.legs?.map((l) => l.status)).toEqual(["new", "new"]);
  });

  it("stamps an exit's fill with the read it filled on, never the entry's submit time", async () => {
    let now = new Date("2026-11-16T15:00:00.000Z");
    const transport = new WritableFixtureTradingTransport(
      { account: { id: "sim", cash: "10000.00", status: "ACTIVE" }, positions: [] },
      { marks: new Map([["AAPL", 150]]), now: () => now, idPrefix: "t" },
    );
    const client = new AlpacaTradingClient(transport);
    const entry = await client.placeOrder(bracketBuy(151));
    now = new Date("2026-11-16T19:00:00.000Z");
    transport.mark("AAPL", 161);
    const tp = byId(await client.listOrders({ status: "all", limit: 50 })).get(`${entry.id}-tp`);
    expect(tp?.filled_at).toBe("2026-11-16T19:00:00.000Z");
    expect(entry.filled_at).toBe("2026-11-16T15:00:00.000Z");
  });
});
