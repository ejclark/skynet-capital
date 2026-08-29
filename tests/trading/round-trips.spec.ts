import { matchRoundTrips, type TradeFill, totalRealized } from "../../src/trading/round-trips.js";

const fill = (
  over: Partial<TradeFill> & Pick<TradeFill, "side" | "quantity" | "at">,
): TradeFill => ({
  symbol: "AAPL",
  price: 100,
  ...over,
});

describe("matchRoundTrips — FIFO matching", () => {
  it("pairs a buy with a later sell into one closed trip", () => {
    const ledger = matchRoundTrips([
      fill({ side: "buy", quantity: 10, price: 100, at: "2026-08-01T14:00:00.000Z" }),
      fill({ side: "sell", quantity: 10, price: 110, at: "2026-08-03T14:00:00.000Z" }),
    ]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.realized).toBe(100);
    expect(ledger.trips[0]?.returnPct).toBeCloseTo(10, 6);
    expect(ledger.trips[0]?.holdMs).toBe(2 * 24 * 60 * 60 * 1000);
    expect(ledger.open).toHaveLength(0);
  });

  it("consumes the OLDEST lot first when lots were bought at different prices", () => {
    const ledger = matchRoundTrips([
      fill({ side: "buy", quantity: 5, price: 100, at: "2026-08-01T14:00:00.000Z" }),
      fill({ side: "buy", quantity: 5, price: 200, at: "2026-08-02T14:00:00.000Z" }),
      fill({ side: "sell", quantity: 5, price: 150, at: "2026-08-03T14:00:00.000Z" }),
    ]);
    // FIFO closes the $100 lot (a $250 win), leaving the $200 lot open — not an averaged $150 wash.
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.entryPrice).toBe(100);
    expect(ledger.trips[0]?.realized).toBe(250);
    expect(ledger.open).toEqual([
      { symbol: "AAPL", quantity: 5, price: 200, at: "2026-08-02T14:00:00.000Z" },
    ]);
  });

  it("splits one sell across several lots into separate trips", () => {
    const ledger = matchRoundTrips([
      fill({ side: "buy", quantity: 3, price: 10, at: "2026-08-01T14:00:00.000Z" }),
      fill({ side: "buy", quantity: 3, price: 20, at: "2026-08-02T14:00:00.000Z" }),
      fill({ side: "sell", quantity: 6, price: 30, at: "2026-08-03T14:00:00.000Z" }),
    ]);
    expect(ledger.trips).toHaveLength(2);
    expect(totalRealized(ledger.trips)).toBe(3 * 20 + 3 * 10);
  });

  it("keeps symbols independent — a winner in one never closes a lot in another", () => {
    const ledger = matchRoundTrips([
      fill({ symbol: "MSFT", side: "buy", quantity: 1, price: 300, at: "2026-08-01T14:00:00Z" }),
      fill({ symbol: "AAPL", side: "buy", quantity: 1, price: 100, at: "2026-08-01T15:00:00Z" }),
      fill({ symbol: "AAPL", side: "sell", quantity: 1, price: 120, at: "2026-08-02T15:00:00Z" }),
    ]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.symbol).toBe("AAPL");
    expect(ledger.open.map((lot) => lot.symbol)).toEqual(["MSFT"]);
  });

  it("sorts newest-first broker payloads before matching", () => {
    const ledger = matchRoundTrips([
      fill({ side: "sell", quantity: 1, price: 120, at: "2026-08-05T14:00:00.000Z" }),
      fill({ side: "buy", quantity: 1, price: 100, at: "2026-08-01T14:00:00.000Z" }),
    ]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.realized).toBe(20);
  });
});

describe("matchRoundTrips — honesty invariants", () => {
  it("excludes and COUNTS fills with no recorded price rather than treating them as $0", () => {
    const ledger = matchRoundTrips([
      { symbol: "AAPL", side: "buy", quantity: 10, at: "2026-08-01T14:00:00.000Z" },
      fill({ side: "buy", quantity: 10, price: 100, at: "2026-08-02T14:00:00.000Z" }),
      fill({ side: "sell", quantity: 10, price: 110, at: "2026-08-03T14:00:00.000Z" }),
    ]);
    expect(ledger.unpricedFills).toBe(1);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.entryPrice).toBe(100);
  });

  it("ignores zero-quantity fills — a submitted-but-unfilled order is not a trade", () => {
    const ledger = matchRoundTrips([
      fill({ side: "buy", quantity: 0, at: "2026-08-01T14:00:00.000Z" }),
      fill({ side: "buy", quantity: 2, price: 50, at: "2026-08-02T14:00:00.000Z" }),
    ]);
    expect(ledger.trips).toHaveLength(0);
    expect(ledger.open).toHaveLength(1);
    expect(ledger.open[0]?.quantity).toBe(2);
  });

  it("drops a sell it cannot match and flags the window as truncated", () => {
    const ledger = matchRoundTrips([
      fill({ side: "sell", quantity: 4, price: 110, at: "2026-08-02T14:00:00.000Z" }),
      fill({ side: "buy", quantity: 4, price: 90, at: "2026-08-03T14:00:00.000Z" }),
    ]);
    // The sell closed a position opened before the window; matching it to the LATER buy would
    // invent a short that never happened.
    expect(ledger.trips).toHaveLength(0);
    expect(ledger.truncated).toBe(true);
    expect(ledger.unmatchedSellQuantity).toBe(4);
    expect(ledger.open).toEqual([
      { symbol: "AAPL", quantity: 4, price: 90, at: "2026-08-03T14:00:00.000Z" },
    ]);
  });

  it("reports an untruncated window when every sell found a lot", () => {
    const ledger = matchRoundTrips([
      fill({ side: "buy", quantity: 1, price: 10, at: "2026-08-01T14:00:00.000Z" }),
      fill({ side: "sell", quantity: 1, price: 9, at: "2026-08-02T14:00:00.000Z" }),
    ]);
    expect(ledger.truncated).toBe(false);
    expect(ledger.trips[0]?.realized).toBe(-1);
  });

  it("returns an empty ledger for no fills at all", () => {
    expect(matchRoundTrips([])).toEqual({
      trips: [],
      open: [],
      unpricedFills: 0,
      unmatchedSellQuantity: 0,
      truncated: false,
    });
  });
});

describe("matchRoundTrips — option round trips in real dollars", () => {
  // The end-to-end guard on the 100x understatement: whatever the adapter does upstream, one
  // contract bought at $4.20 and closed at $5.20 is $100 of realized P/L, not $1.
  const fill = (side: "buy" | "sell", price: number, at: string): TradeFill => ({
    symbol: "MSFT260918P00420000",
    side,
    quantity: 1,
    price,
    at,
  });

  it("realizes $100 on a one-contract dollar move, not $1", () => {
    const { trips } = matchRoundTrips([fill("buy", 420, "t1"), fill("sell", 520, "t2")]);
    expect(trips).toHaveLength(1);
    expect(trips[0]?.realized).toBe(100);
    // The percentage is a ratio, so it is scale-free and must not move with the fix.
    expect(trips[0]?.returnPct).toBeCloseTo(23.81, 2);
  });

  it("opens a short lot for a written option's opening sell, rather than flagging it truncated (#838)", () => {
    // 201/202 open with a sell. There is no long lot to match, but the symbol is option-shaped —
    // this app's only path to a bare option short is a 201/202 sell-to-open — so the premium is
    // tracked as an open short lot, not dropped and flagged.
    const ledger = matchRoundTrips([fill("sell", 420, "t1")]);
    expect(ledger.trips).toHaveLength(0);
    expect(ledger.truncated).toBe(false);
    expect(ledger.unmatchedSellQuantity).toBe(0);
    expect(ledger.open).toEqual([
      { symbol: "MSFT260918P00420000", quantity: 1, price: 420, at: "t1", direction: "short" },
    ]);
  });

  it("closes a short lot when the written option is later bought back (buy-to-close)", () => {
    const ledger = matchRoundTrips([
      fill("sell", 420, "t1"), // sell-to-open: collects $420/share premium
      fill("buy", 150, "t2"), // buy-to-close: pays $150/share to buy it back
    ]);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.direction).toBe("short");
    expect(ledger.trips[0]?.entryPrice).toBe(420);
    expect(ledger.trips[0]?.exitPrice).toBe(150);
    // Short-side math: premium collected minus price paid to close, not exit minus entry.
    expect(ledger.trips[0]?.realized).toBe(270);
    expect(ledger.open).toHaveLength(0);
    expect(ledger.truncated).toBe(false);
  });

  it("still flags a genuinely unmatched STOCK sell as truncated — the option gate never fires for equities", () => {
    const ledger = matchRoundTrips([
      { symbol: "AAPL", side: "sell", quantity: 4, price: 110, at: "2026-08-02T14:00:00.000Z" },
    ]);
    expect(ledger.trips).toHaveLength(0);
    expect(ledger.truncated).toBe(true);
    expect(ledger.unmatchedSellQuantity).toBe(4);
    expect(ledger.open).toHaveLength(0);
  });
});
