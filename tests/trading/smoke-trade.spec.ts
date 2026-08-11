import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import {
  MAX_SMOKE_QUANTITY,
  runSmokeTrade,
  SmokeTradeRefused,
} from "../../src/trading/smoke-trade.js";

type Order = { id: string; status: string; filled_qty?: string; filled_avg_price?: string };

const client = (opts: { open?: boolean; orders?: Order[] } = {}) => {
  const queue = [...(opts.orders ?? [])];
  const placed: Array<{ symbol: string; qty: number; side: string }> = [];
  const fake = {
    isMarketOpen: () => Promise.resolve(opts.open ?? true),
    placeOrder: (p: { symbol: string; qty: number; side: "buy" | "sell" }) => {
      placed.push(p);
      return Promise.resolve(
        (queue.shift() ?? {
          id: `o${placed.length}`,
          status: "filled",
          filled_qty: String(p.qty),
          filled_avg_price: "100",
        }) as never,
      );
    },
  } as unknown as AlpacaTradingClient;
  return { fake, placed };
};

describe("when the market is open and a round trip is requested", () => {
  it("buys then sells the same share, reporting both legs", async () => {
    const { fake, placed } = client();

    const result = await runSmokeTrade(fake, { symbol: "NVDA" });

    expect(placed).toEqual([
      { symbol: "NVDA", qty: 1, side: "buy" },
      { symbol: "NVDA", qty: 1, side: "sell" },
    ]);
    expect(result.legs.map((l) => l.side)).toEqual(["buy", "sell"]);
  });

  it("reports realized P/L from the two fill prices", async () => {
    const { fake } = client({
      orders: [
        { id: "a", status: "filled", filled_qty: "1", filled_avg_price: "100" },
        { id: "b", status: "filled", filled_qty: "1", filled_avg_price: "101.5" },
      ],
    });

    const result = await runSmokeTrade(fake, { symbol: "NVDA" });

    expect(result.realized).toBeCloseTo(1.5);
  });

  it("says P/L is unknown rather than assuming zero when a fill price is missing", async () => {
    const { fake } = client({
      orders: [
        { id: "a", status: "filled", filled_qty: "1" },
        { id: "b", status: "filled", filled_qty: "1" },
      ],
    });

    const result = await runSmokeTrade(fake, { symbol: "NVDA" });

    expect(result.realized).toBeUndefined();
    expect(result.notes.join(" ")).toContain("unknown rather than assumed");
  });

  it("leaves the position open when asked to hold", async () => {
    const { fake, placed } = client();

    const result = await runSmokeTrade(fake, { symbol: "NVDA", holdOpen: true });

    expect(placed.map((p) => p.side)).toEqual(["buy"]);
    expect(result.legs).toHaveLength(1);
  });
});

describe("when a leg does not fill as asked", () => {
  it("closes only what actually filled — never opening a short", async () => {
    const { fake, placed } = client({
      orders: [
        { id: "a", status: "partially_filled", filled_qty: "2", filled_avg_price: "100" },
        { id: "b", status: "filled", filled_qty: "2", filled_avg_price: "100" },
      ],
    });

    await runSmokeTrade(fake, { symbol: "NVDA", quantity: 3 });

    expect(placed[1]).toEqual({ symbol: "NVDA", qty: 2, side: "sell" });
  });

  it("sends no sell leg at all when nothing filled", async () => {
    const { fake, placed } = client({
      orders: [{ id: "a", status: "rejected", filled_qty: "0" }],
    });

    const result = await runSmokeTrade(fake, { symbol: "NVDA" });

    expect(placed.map((p) => p.side)).toEqual(["buy"]);
    expect(result.notes.join(" ")).toContain("nothing to close");
  });
});

describe("when a precondition is unmet", () => {
  it("refuses when the market is closed rather than queueing an order that proves nothing", async () => {
    const { fake, placed } = client({ open: false });

    await expect(runSmokeTrade(fake, { symbol: "NVDA" })).rejects.toBeInstanceOf(SmokeTradeRefused);
    expect(placed).toEqual([]);
  });

  it("refuses a size beyond the smoke-test ceiling", async () => {
    const { fake } = client();

    await expect(
      runSmokeTrade(fake, { symbol: "NVDA", quantity: MAX_SMOKE_QUANTITY + 1 }),
    ).rejects.toBeInstanceOf(SmokeTradeRefused);
  });

  it("refuses a fractional or zero size", async () => {
    const { fake } = client();

    await expect(runSmokeTrade(fake, { symbol: "NVDA", quantity: 0 })).rejects.toBeInstanceOf(
      SmokeTradeRefused,
    );
    await expect(runSmokeTrade(fake, { symbol: "NVDA", quantity: 1.5 })).rejects.toBeInstanceOf(
      SmokeTradeRefused,
    );
  });
});
