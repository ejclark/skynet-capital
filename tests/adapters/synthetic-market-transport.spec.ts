import { SyntheticMarket } from "../../src/adapters/synthetic-market-transport.js";
import { WritableFixtureTradingTransport } from "../../src/adapters/writable-fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";

// The offline change world's simulated market: a quote, a chain and a contract a member can price
// and trade, read through the same client that reads Alpaca — and a fill at the price it showed.

const NOW = new Date("2026-11-16T15:00:00.000Z"); // a Monday
const market = () =>
  new SyntheticMarket({
    marks: new Map([
      ["AAPL", 150],
      ["CRWV", 80],
    ]),
    now: () => NOW,
  });

describe("SyntheticMarket — a simulated market the members can trade", () => {
  it("quotes a stock a cent either side and serves its snapshot", async () => {
    const options = new AlpacaOptionsClient(market(), market());
    expect(await options.getUnderlyingPrice("AAPL")).toBe(150);
    expect(await options.getUnderlyingQuote("AAPL")).toMatchObject({
      last: 150,
      bid: 149.99,
      ask: 150.01,
    });
    expect(await options.getUnderlyingPrice("ZZZZ")).toBeUndefined();
  });

  it("lists weekly and monthly expirations from today, soonest first", async () => {
    const options = new AlpacaOptionsClient(market(), market());
    const dates = await options.getExpirations("CRWV", "2026-11-16");
    expect(dates[0]).toBe("2026-11-20");
    expect(dates).toContain("2026-12-18"); // December's third Friday
    expect(dates).toContain("2027-01-15"); // January's third Friday
    expect([...dates].sort()).toEqual(dates);
  });

  it("serves a put chain around spot with quotes, greeks and puts priced below their strike", async () => {
    const options = new AlpacaOptionsClient(market(), market());
    const rows = await options.getChain("CRWV", "2026-12-18", "put");
    const strikes = rows.map((r) => r.strike);
    expect(strikes).toContain(70);
    expect(Math.min(...strikes)).toBeGreaterThanOrEqual(56);
    expect(Math.max(...strikes)).toBeLessThanOrEqual(104);
    const seventy = rows.find((r) => r.strike === 70);
    expect(seventy?.bid).toBeGreaterThan(0);
    expect((seventy?.ask ?? 0) > (seventy?.bid ?? 0)).toBe(true);
    expect(seventy?.ask ?? 99).toBeLessThan(70);
  });

  it("fills a sold put at the bid the chain showed and books the premium", async () => {
    const m = market();
    const account = new WritableFixtureTradingTransport(
      { account: { id: "a", cash: "40000.00", portfolio_value: "40000.00", status: "ACTIVE" } },
      { market: m, now: () => NOW },
    );
    const options = new AlpacaOptionsClient(account, m);
    const [row] = (await options.getChain("CRWV", "2026-12-18", "put")).filter(
      (r) => r.strike === 70,
    );
    const order = await options.placeOptionOrder({
      occSymbol: row?.occSymbol as string,
      contracts: 1,
      side: "sell",
      type: "market",
      positionIntent: "sell_to_open",
    });
    expect(order).toMatchObject({ status: "filled", filled_avg_price: String(row?.bid) });
    const cash = Number((await new AlpacaTradingClient(account).getAccount()).cash);
    expect(cash).toBeCloseTo(40000 + (row?.bid ?? 0) * 100, 2);
    const held = (await new AlpacaTradingClient(account).getPositions()).find(
      (p) => p.symbol === row?.occSymbol,
    );
    expect(held).toMatchObject({ qty: "-1", side: "short", asset_class: "us_option" });
  });

  it("answers a contract read and 404s one it does not list", async () => {
    const m = market();
    expect((await m.get("/v2/options/contracts/CRWV261218P00070000")).status).toBe(200);
    expect((await m.get("/v2/options/contracts/ZZZZ261218P00070000")).status).toBe(404);
    expect((await m.get("/v2/stocks/AAPL/bars?timeframe=1Day")).status).toBe(404);
  });
});
