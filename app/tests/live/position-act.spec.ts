import type { DeskPosition } from "../../src/live/desk";
import {
  actFigures,
  actLine,
  actVerb,
  optionLimitSeed,
  riskAfter,
  sharesLimitSeed,
} from "../../src/live/position-act";

/**
 * ACT IN THE ROW, AS NUMBERS (#5070 slice 3; round 2 of #5037, R2 step 3). The opened guidance's
 * Buy back turns the row into a prefilled ticket whose one line says what the order does. The
 * book is the round's frames: a sold CRWV $80 put to Nov 6 that collected $255, quoted $5.30 /
 * $5.70 — "1 of 1 contract, $5.50 limit, cash out $550 · locks in −$295 · frees $8,000".
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
  value: "-$550",
});
const NVDA = pos({ symbol: "NVDA", quantity: "130", price: "$232.10", costBasis: "$29,117.40" });
const QUOTE = { strike: 80, occSymbol: PUT.symbol, bid: 5.3, ask: 5.7 };

describe("what closing a position is called", () => {
  it("buys back a sold option, and sells a bought one or shares", () => {
    expect(actVerb(PUT)).toEqual({ verb: "Buy back", noun: "buy-back", pays: true });
    expect(actVerb(NVDA)).toEqual({ verb: "Sell", noun: "sale", pays: false });
    expect(actVerb(pos({ isOption: true, symbol: "NVDA261218C00240000" }))?.verb).toBe("Sell");
  });

  it("offers no verb for short shares — a buy to cover isn't placed here", () => {
    expect(actVerb(pos({ quantity: "-20" }))).toBeUndefined();
  });
});

describe("the limit the ticket opens with", () => {
  it("is the mid of the quote, said as such", () => {
    expect(optionLimitSeed(QUOTE, true)).toEqual({ price: 5.5, source: "mid of $5.30 / $5.70" });
  });

  it("falls back to the side the order crosses, then to nothing — never a made-up price", () => {
    expect(optionLimitSeed({ ...QUOTE, bid: undefined }, true)).toEqual({
      price: 5.7,
      source: "the ask, $5.70",
    });
    expect(optionLimitSeed({ ...QUOTE, ask: undefined }, true).price).toBeUndefined();
    expect(optionLimitSeed(undefined, true)).toEqual({
      source: "the feed hasn't quoted this contract; type a limit",
    });
  });

  it("sells shares at today's last price", () => {
    expect(sharesLimitSeed(NVDA)).toEqual({ price: 232.1, source: "today's last price" });
    expect(sharesLimitSeed(pos({ price: "—" })).price).toBeUndefined();
  });
});

describe("what the order does, before it is reviewed", () => {
  it("says the round's line for the sold put: cash out, the P/L it locks in, the cash it frees", () => {
    const figures = actFigures(PUT, [PUT], 1, 5.5);
    const verb = actVerb(PUT);
    expect(figures).toEqual({ cash: 550, locksIn: -295, frees: "$8,000", left: 0 });
    if (!(figures && verb)) throw new Error("the put closes");
    expect(actLine(figures, verb)).toBe("Cash out $550 · locks in −$295 · frees $8,000");
  });

  it("takes the server's estimate for the cash when the review has one", () => {
    expect(actFigures(PUT, [PUT], 1, 5.5, 560)?.locksIn).toBe(-305);
  });

  it("frees nothing for a sold leg of a spread, and the covering shares for a covered call", () => {
    const longPut = pos({ symbol: "CRWV261106P00075000", isOption: true, quantity: "1" });
    expect(actFigures(PUT, [PUT, longPut], 1, 5.5)?.frees).toBeUndefined();
    const call = pos({
      symbol: "NVDA261218C00250000",
      isOption: true,
      quantity: "-1",
      costBasis: "-$410",
    });
    expect(actFigures(call, [call, NVDA], 1, 2)?.frees).toBe("100 NVDA shares");
  });

  it("brings cash in on a sale and locks in that part's share of the cost", () => {
    const figures = actFigures(NVDA, [NVDA], 10, 232.1);
    const verb = actVerb(NVDA);
    expect(figures).toEqual({ cash: 2321, locksIn: 81.2, left: 120 });
    if (!(figures && verb)) throw new Error("the shares close");
    expect(actLine(figures, verb)).toBe("Cash in $2,321 · locks in +$81.20");
  });

  it("refuses a count past the holding, none at all, or no limit", () => {
    expect(actFigures(PUT, [PUT], 2, 5.5)).toBeUndefined();
    expect(actFigures(PUT, [PUT], 0, 5.5)).toBeUndefined();
    expect(actFigures(PUT, [PUT], 1, 0)).toBeUndefined();
  });
});

describe("the recap's risk after", () => {
  it("says a closed sold option can't be assigned, and what a part close leaves open", () => {
    expect(riskAfter(PUT, 0)).toBe("None from this position: it closes, so it can't be assigned.");
    expect(riskAfter(NVDA, 0)).toBe("None from this position: it closes.");
    expect(riskAfter(NVDA, 120)).toBe("120 shares stay open, at the risk they carry now.");
  });
});
