import type { DeskPosition } from "../../src/live/desk";
import type { OptionPositionRow } from "../../src/live/options";
import {
  priceStrip,
  signedDollars,
  stakeFigure,
  waitingStrip,
} from "../../src/live/position-picture";

/**
 * A POSITION'S PICTURE (#5070 slice 2; round 2 of #5037, R2 "tap opens it in place"). The opened
 * guidance leads with the price strip, the waiting-earns strip and three figures. The book is
 * Sauron's from the round's frames: a sold CRWV $80 put to Nov 6, 29 days left, collected $255,
 * buy-back $550, breakeven $77.45, CRWV $82.60, priced at 75% volatility.
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
  expiresInDays: 29,
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
};

const NVDA = pos({
  symbol: "NVDA",
  display: "NVDA",
  quantity: "130",
  price: "$232.10",
  breakeven: "$223.98",
  value: "$30,173",
  totalPl: "+$1,056",
  totalPlRaw: 1055.6,
});

describe("signedDollars", () => {
  it("reads a signed figure whichever minus the server or the row used", () => {
    expect(signedDollars("-$550")).toBe(-550);
    expect(signedDollars("−$1,056.40")).toBe(-1056.4);
    expect(signedDollars("+$30,173")).toBe(30173);
    expect(signedDollars("—")).toBeUndefined();
    expect(signedDollars(undefined)).toBeUndefined();
  });
});

describe("the price strip", () => {
  it("names a sold put's zones in words, losing to keeping, left to right", () => {
    const strip = priceStrip(PUT, 82.6);
    expect(strip?.zones.map((z) => z.word)).toEqual(["loses", "keeps part", "keeps all"]);
    expect(strip?.zones.map((z) => z.kind)).toEqual(["lose", "part", "keep"]);
  });

  it("places breakeven, strike and now in price order on one axis, all inside it", () => {
    const marks = priceStrip(PUT, 82.6)?.marks ?? [];
    const at = Object.fromEntries(marks.map((m) => [m.kind, m.at]));
    expect(at.breakeven).toBeLessThan(at.strike ?? 0);
    expect(at.strike).toBeLessThan(at.now ?? 0);
    for (const m of marks) {
      expect(m.at).toBeGreaterThan(0);
      expect(m.at).toBeLessThan(100);
    }
  });

  it("says the whole strip in one sentence for a screen reader", () => {
    expect(priceStrip(PUT, 82.6)?.said).toBe(
      "At expiry: keeps all of the premium above the $80 strike, part of it down to the breakeven, $77.45, and loses past it. Now $82.60.",
    );
  });

  it("leaves out now when the feed had no price — never a made-up one", () => {
    const strip = priceStrip(PUT, undefined);
    expect(strip?.marks.map((m) => m.kind)).toEqual(["strike", "breakeven"]);
    expect(strip?.said).not.toContain("Now");
  });

  it("draws a bought call the other way: loses all below the strike, profits past breakeven", () => {
    const call = pos({
      symbol: "NVDA261218C00240000",
      isOption: true,
      quantity: "2",
      breakeven: "$251.30",
    });
    expect(priceStrip(call, 232.1)?.zones.map((z) => z.word)).toEqual([
      "loses all",
      "loses part",
      "profits",
    ]);
  });

  it("draws a sold call keeping all below its strike, part of it up to the breakeven", () => {
    const call = pos({
      symbol: "NVDA261218C00250000",
      isOption: true,
      quantity: "-1",
      breakeven: "$256.40",
    });
    const strip = priceStrip(call, 232.1);
    expect(strip?.zones.map((z) => z.word)).toEqual(["keeps all", "keeps part", "loses"]);
    expect(strip?.said).toContain(
      "keeps all of the premium below the $250 strike, part of it up to",
    );
  });

  it("gives shares one line, what they cost: loses below, profits above", () => {
    const strip = priceStrip(NVDA, 232.1);
    expect(strip?.zones.map((z) => z.word)).toEqual(["loses", "profits"]);
    expect(strip?.marks.map((m) => m.kind)).toEqual(["now", "breakeven"]);
  });

  it("draws nothing without a breakeven", () => {
    expect(priceStrip(pos({ breakeven: undefined }), 10)).toBeUndefined();
  });
});

describe("the waiting-earns strip", () => {
  const strip = waitingStrip(PUT, PUT_ROW);

  it("starts at today's P/L and ends at the premium kept if CRWV holds above the strike", () => {
    expect(strip?.points[0]).toEqual({ day: 0, total: -295 });
    const last = strip?.points.at(-1);
    expect(last?.day).toBe(29);
    expect(last?.total).toBeCloseTo(255, 6);
  });

  it("earns on an option sold, and faster toward expiry", () => {
    expect(strip?.verb).toBe("earns");
    expect(strip?.rates.map((r) => r.label)).toEqual([
      "now",
      "14 days left",
      "7 days left",
      "last day",
    ]);
    const perDay = strip?.rates.map((r) => r.perDay) ?? [];
    expect(perDay[0]).toBeGreaterThan(9);
    expect(perDay[0]).toBeLessThan(14);
    expect(perDay[1]).toBeGreaterThan(perDay[0] ?? 0);
    expect(perDay[2]).toBeGreaterThan(perDay[1] ?? 0);
  });

  it("names the day the P/L crosses $0", () => {
    expect(strip?.crosses).toMatch(/^(Oct|Nov) \d{1,2}$/);
  });

  it("costs on an option bought", () => {
    const bought = pos({
      ...PUT,
      quantity: "1",
      costBasis: "$550",
      value: "$550",
      totalPl: "+$0",
      totalPlRaw: 0,
    });
    const row = { ...PUT_ROW, contracts: 1 };
    const w = waitingStrip(bought, row);
    expect(w?.verb).toBe("costs");
    expect(w?.points.at(-1)?.total).toBeCloseTo(-550, 6);
    expect(w?.rates[0]?.perDay).toBeLessThan(0);
  });

  it("is left out for shares, an unpriced contract, and expiry day", () => {
    expect(waitingStrip(NVDA, undefined)).toBeUndefined();
    const { impliedVol: _iv, ...unpriced } = PUT_ROW;
    expect(waitingStrip(PUT, unpriced)).toBeUndefined();
    expect(waitingStrip(PUT, { ...PUT_ROW, daysToExpiry: 0 })).toBeUndefined();
  });

  it("drops the checkpoints a short-dated option has already passed", () => {
    const w = waitingStrip(PUT, { ...PUT_ROW, daysToExpiry: 10 });
    expect(w?.rates.map((r) => r.label)).toEqual(["now", "7 days left", "last day"]);
  });
});

describe("the first figure: what the position ties up", () => {
  it("says a sold put's cash set aside, strike × 100", () => {
    expect(stakeFigure(PUT, [PUT])).toEqual({
      label: "Cash set aside",
      figure: "$8,000",
      note: "buys 100 CRWV at $80 if assigned",
    });
  });

  it("says shares are worth their value, and a bought option what it cost", () => {
    expect(stakeFigure(NVDA, [NVDA]).label).toBe("Value");
    const bought = pos({ symbol: "NVDA261218C00240000", isOption: true, costBasis: "$1,230" });
    expect(stakeFigure(bought, [bought])).toMatchObject({ label: "Paid", figure: "$1,230" });
  });

  it("says a sold call is covered only when the account holds the shares", () => {
    const call = pos({ symbol: "NVDA261218C00250000", isOption: true, quantity: "-1" });
    expect(stakeFigure(call, [call, NVDA])).toMatchObject({
      label: "Shares that cover it",
      figure: "100 NVDA",
    });
    expect(stakeFigure(call, [call])).toMatchObject({ label: "Set aside", figure: "—" });
  });

  it("claims no cash or shares for a sold leg of a spread, and names its partner", () => {
    const longPut = pos({ symbol: "CRWV261106P00075000", isOption: true, quantity: "1" });
    expect(stakeFigure(PUT, [PUT, longPut])).toEqual({
      label: "Set aside",
      figure: "—",
      note: "part of a spread with your bought $75 put",
    });
  });
});
