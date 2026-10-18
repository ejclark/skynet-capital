import type { DeskActivityEvent, DeskPosition } from "../../src/live/desk";
import type { OptionPositionRow } from "../../src/live/options";
import {
  positionDates,
  positionFills,
  profitChart,
  waysToPlay,
} from "../../src/live/position-page";
import { priceStrip, waitingStrip } from "../../src/live/position-picture";
import { positionPageFromSearch } from "../../src/shell/use-position-page";

/**
 * A POSITION'S FULL PAGE (#5070 slice 6; round 2 of #5037, R2's depth ladder step 4, "Full page ›").
 * Its sections are Picture · Three ways to play it · Fills · Dates. The book is Sauron's from the
 * round's frames: a sold CRWV $80 put to Nov 6, 29 days left, collected $255, buy-back $550,
 * breakeven $77.45, CRWV $82.60, priced at 75% volatility.
 */

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "SPY",
  display: "SPY",
  detail: "",
  isOption: false,
  quantity: "10",
  costPerShare: "$1.00",
  price: "$1.00",
  costBasis: "$1",
  value: "$1",
  dayPl: "+$0",
  dayPct: "+0.0%",
  dayTone: "flat",
  totalPl: "+$0",
  totalPlRaw: 0,
  returnPct: "+0.0%",
  totalTone: "flat",
  weightPct: 1,
  ...over,
});

const PUT = pos({
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  isOption: true,
  quantity: "-1",
  costBasis: "-$255",
  breakeven: "$77.45",
  value: "-$550",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  expiresIn: "29 days",
  expiresInDays: 29,
  nextEvent: {
    label: "Earnings Nov 3",
    at: "2026-11-03",
    beforeExpiry: true,
    scope: "stock",
  },
});

const PUT_ROW: OptionPositionRow = {
  symbol: PUT.symbol,
  display: PUT.display,
  underlying: "CRWV",
  type: "put",
  strike: 80,
  expiration: "2026-11-06",
  daysToExpiry: 29,
  contracts: -1,
  spot: 82.6,
  impliedVol: 0.75,
} as OptionPositionRow;

const NVDA = pos({
  symbol: "NVDA",
  display: "NVDA",
  quantity: "130",
  price: "$232.10",
  costBasis: "$29,117",
  breakeven: "$223.98",
  value: "$30,173",
  totalPl: "+$1,056",
  totalPlRaw: 1056,
});

const SHORT_TSLA = pos({ symbol: "TSLA", display: "TSLA", quantity: "-10", value: "-$2,500" });

const fill = (over: Partial<DeskActivityEvent>): DeskActivityEvent => ({
  orderId: "o1",
  symbol: PUT.symbol,
  display: PUT.display,
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
  status: "filled",
  at: "2026-10-08T14:31:00.000Z",
  backfilled: false,
  origin: "desk",
  ...over,
});

describe("the full page's profit-at-price chart", () => {
  const wait = waitingStrip(PUT, PUT_ROW);
  const axis = priceStrip(PUT, 82.6)?.axis;
  const chart = profitChart(PUT, wait, axis);

  it("draws a curve per date, today first and expiry last", () => {
    expect(chart?.curves.map((c) => c.label)).toEqual([
      "today",
      "14 days left",
      "7 days left",
      "at expiry",
    ]);
  });

  it("passes today's curve through today's P/L at today's price", () => {
    const today = chart?.curves[0];
    const near = today?.points.reduce((a, b) =>
      Math.abs(b.price - 82.6) < Math.abs(a.price - 82.6) ? b : a,
    );
    // The nearest sample sits within a few cents of $82.60; the P/L there is within a few dollars.
    expect(near?.total).toBeGreaterThan(-310);
    expect(near?.total).toBeLessThan(-280);
  });

  it("is the contract's intrinsic value alone at expiry: the $255 kept above the strike", () => {
    const expiry = chart?.curves[chart.curves.length - 1];
    const above = expiry?.points.filter((p) => p.price >= 80) ?? [];
    expect(above.length).toBeGreaterThan(0);
    for (const p of above) expect(p.total).toBeCloseTo(255, 6);
    const below = expiry?.points.find((p) => p.price < 76);
    // Below the strike the put is worth (80 − price) × 100 to its buyer.
    if (below) expect(below.total).toBeCloseTo(255 - (80 - below.price) * 100, 6);
  });

  it("keeps $0 inside the drawn range", () => {
    expect(chart?.low).toBeLessThan(0);
    expect(chart?.high).toBeGreaterThan(0);
  });

  it("draws no chart for shares, or for a contract the feed did not price", () => {
    expect(profitChart(NVDA, undefined, priceStrip(NVDA, 232.1)?.axis)).toBeUndefined();
    expect(profitChart(PUT, waitingStrip(PUT, { ...PUT_ROW, spot: undefined }), axis)).toBe(
      undefined,
    );
  });
});

describe("the full page's ways to play it", () => {
  it("names keep, roll and buy back for a sold option, each in one line of fact", () => {
    const ways = waysToPlay(PUT, [PUT, NVDA], waitingStrip(PUT, PUT_ROW));
    expect(ways.map((w) => w.way)).toEqual(["Keep", "Roll", "Buy back"]);
    expect(ways[0]?.line).toMatch(
      /^Hold to expiry, Nov 6\. If CRWV holds \$82\.60, the P\/L ends at \+\$255\.$/,
    );
    expect(ways[2]?.line).toBe("At today's mark: cash out $550 · locks in −$295 · frees $8,000.");
  });

  it("says where keeping lands needs a live price when the feed has none", () => {
    const ways = waysToPlay(PUT, [PUT], undefined);
    expect(ways[0]?.line).toContain("needs a live price");
  });

  it("names keep and sell for shares, priced at today's mark", () => {
    const ways = waysToPlay(NVDA, [NVDA], undefined);
    expect(ways.map((w) => w.way)).toEqual(["Keep", "Sell"]);
    expect(ways[0]?.line).toBe("Nothing expires: the P/L moves with NVDA's price.");
    expect(ways[1]?.line).toBe("At today's mark: cash in $30,173 · locks in +$1,056.");
  });

  it("offers no close on short shares, which this desk doesn't buy to cover", () => {
    expect(waysToPlay(SHORT_TSLA, [SHORT_TSLA], undefined).map((w) => w.way)).toEqual(["Keep"]);
  });
});

describe("the full page's fills", () => {
  it("keeps the fills of the position held now, a spread's leg among them, newest first", () => {
    const TWO = { ...PUT, quantity: "-2" };
    const events = [
      fill({ orderId: "o1", at: "2026-10-08T14:31:00.000Z" }),
      fill({ orderId: "o2", filled: 0, status: "canceled" }),
      fill({ orderId: "o3", symbol: "CRWV", display: "CRWV", side: "buy", quantity: 55 }),
      fill({
        orderId: "o4",
        symbol: "",
        display: "CRWV put spread",
        legs: [
          { ...fill({ orderId: "o4" }), symbol: PUT.symbol },
          { ...fill({ orderId: "o4" }), symbol: "CRWV261106P00075000", side: "buy" },
        ],
      }),
    ];
    expect(positionFills(events, TWO).map((f) => f.orderId)).toEqual(["o1", "o4"]);
  });

  it("stops where the holding was last flat: an earlier, closed position is not this one", () => {
    // Sold one in August, bought it back in September, sold one again in October.
    const events = [
      fill({ orderId: "oct-sell", at: "2026-10-08T14:31:00.000Z" }),
      fill({ orderId: "sep-buyback", side: "buy", at: "2026-09-15T14:00:00.000Z" }),
      fill({ orderId: "aug-sell", at: "2026-08-20T14:00:00.000Z" }),
    ];
    expect(positionFills(events, PUT).map((f) => f.orderId)).toEqual(["oct-sell"]);
  });

  it("stops at an expiry or assignment, which ended an earlier position", () => {
    const events = [
      fill({ orderId: "new-sell" }),
      fill({ orderId: "expired", lifecycle: "OPEXP", filled: 1, side: "buy" }),
      fill({ orderId: "old-sell" }),
    ];
    const ONE_MORE = { ...PUT, quantity: "-2" };
    expect(positionFills(events, ONE_MORE).map((f) => f.orderId)).toEqual(["new-sell"]);
  });

  it("shows what the window holds when it ends before the walk reaches flat", () => {
    const TEN = { ...NVDA, quantity: "130" };
    const events = [
      fill({ orderId: "b1", symbol: "NVDA", side: "buy", quantity: 30, filled: 30 }),
      fill({ orderId: "b2", symbol: "NVDA", side: "buy", quantity: 50, filled: 50 }),
    ];
    expect(positionFills(events, TEN).map((f) => f.orderId)).toEqual(["b1", "b2"]);
  });
});

describe("the full page's dates", () => {
  it("lists opened, the next event and expiry, earliest first", () => {
    const dates = positionDates(PUT, [
      fill({ at: "2026-10-08T14:31:00.000Z" }),
      fill({ at: "2026-10-01T15:00:00.000Z" }),
    ]);
    expect(dates).toEqual([
      { at: "2026-10-01", label: "Opened" },
      { at: "2026-11-03", label: "Earnings Nov 3", note: "before expiry" },
      { at: "2026-11-06", label: "Expires", note: "in 29 days" },
    ]);
  });

  it("falls back to the stock's next print, and leaves out what no read carries", () => {
    const shares = {
      ...NVDA,
      nextPrint: { status: "estimate", at: "2026-11-18", label: "Earnings Nov 18 (estimated)" },
    } as DeskPosition;
    expect(positionDates(shares, [])).toEqual([
      { at: "2026-11-18", label: "Earnings Nov 18 (estimated)" },
    ]);
    expect(positionDates(NVDA, [])).toEqual([]);
  });
});

describe("the full page's URL", () => {
  it("reads ?position= and ?open= as bounded symbols, and nothing else", () => {
    expect(positionPageFromSearch({ position: PUT.symbol, open: "nvda" })).toEqual({
      position: PUT.symbol,
      open: "NVDA",
    });
    expect(positionPageFromSearch({ position: "<script>", open: "X".repeat(40) })).toEqual({});
    expect(positionPageFromSearch({ position: 7 })).toEqual({});
  });
});
