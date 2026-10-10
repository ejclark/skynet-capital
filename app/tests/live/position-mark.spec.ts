import type { DeskPosition } from "../../src/live/desk";
import { MARK_GLYPH, MARK_WORD, markOf, pastLine } from "../../src/live/position-mark";

/**
 * THE FACT BADGE (#5070, round 2 of #5037): every position row carries one mark that says a verb
 * and a fact, never a verdict (Eric, 3a77c6db: "Needs a decision" / "At risk" projected too much).
 *  - Review: a fact puts the position off its plan (below breakeven; a sold option near or past
 *    its strike; a sold option costing more to close than it brought in).
 *  - Consider: on plan with a target met (the decision engine's own lock-in bars: 50% on an
 *    option, 25% on shares).
 *  - On plan: anything else, and the line shows the position's next date.
 * Glyph plus word, so hue never carries the mark alone.
 */

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "SPY",
  display: "SPY",
  detail: "",
  isOption: false,
  quantity: "10",
  costPerShare: "$500.00",
  price: "$505.00",
  costBasis: "$5,000",
  value: "$5,050",
  dayPl: "+$50",
  dayPct: "+1.0%",
  dayTone: "pos",
  totalPl: "+$50",
  totalPlRaw: 50,
  returnPct: "+1.0%",
  totalTone: "pos",
  weightPct: 50,
  ...over,
});

/** Sauron's book in the profile world (scripts/study/worlds/inputs/profile-today.json), as
 *  `/api/desk/sauron` formats it on the pinned Thursday, 2026-10-08. */
const NVDA = pos({
  symbol: "NVDA",
  display: "NVDA",
  quantity: "130",
  price: "$232.10",
  breakeven: "$223.98",
  totalPl: "+$1,056",
  totalPlRaw: 1055.6,
  returnPct: "+3.63%",
  nextPrint: { status: "estimate", at: "2026-11-18", label: "Earnings Nov 18 (estimated)" },
  nextEvent: { label: "Earnings Nov 18", at: "2026-11-18", beforeExpiry: false, scope: "stock" },
});
const CRWV = pos({
  symbol: "CRWV",
  display: "CRWV",
  quantity: "55",
  price: "$82.60",
  breakeven: "$90.10",
  totalPl: "-$412",
  totalPlRaw: -412.5,
  returnPct: "-8.32%",
  totalTone: "neg",
});
const PUT = "CRWV261106P00080000";
const CRWV_PUT = pos({
  symbol: PUT,
  display: "CRWV $80 PUT · 6 NOV 26",
  isOption: true,
  quantity: "-1",
  price: "$550.00",
  breakeven: "$77.45",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  expiresInDays: 29,
  nextEvent: { label: "CPI report Oct 14", at: "2026-10-14", beforeExpiry: true, scope: "market" },
});

describe("markOf — the profile world's book", () => {
  it("marks the sold put Review with how far CRWV sits above its strike, and watches the strike", () => {
    expect(markOf(CRWV_PUT, 82.6)).toEqual({
      kind: "review",
      fact: "$2.60 above strike",
      watch: { symbol: "CRWV", price: 80, side: "below" },
    });
  });

  it("marks the losing shares Review · below breakeven", () => {
    expect(markOf(CRWV)).toEqual({ kind: "review", fact: "below breakeven" });
  });

  it("marks NVDA On plan with its next date, an estimate said as one", () => {
    expect(markOf(NVDA)).toMatchObject({
      kind: "onplan",
      fact: "earnings est. Nov 18",
      said: "earnings estimated for Nov 18",
    });
  });
});

describe("markOf — a sold option", () => {
  const sold = (over: Partial<DeskPosition>) =>
    pos({ ...CRWV_PUT, totalPl: "+$60", totalPlRaw: 60, returnPct: "+24%", ...over });

  it("says how far a put is past its strike once the stock is under it", () => {
    expect(markOf(sold({}), 78.4)).toMatchObject({ kind: "review", fact: "$1.60 below strike" });
  });

  it("reads a sold call's side the other way round", () => {
    const call = sold({ symbol: "NVDA261120C00250000", display: "NVDA $250 CALL" });
    expect(markOf(call, 244)).toMatchObject({
      kind: "review",
      fact: "$6.00 below strike",
      watch: { symbol: "NVDA", price: 250, side: "above" },
    });
    expect(markOf(call, 251)).toMatchObject({ kind: "review", fact: "$1.00 above strike" });
  });

  it("leaves a put well clear of its strike alone", () => {
    expect(markOf(sold({}), 95).kind).toBe("onplan");
  });

  it("marks Consider once half the premium is kept — the decision engine's lock-in bar", () => {
    expect(markOf(sold({ returnPct: "+70%", totalPlRaw: 178 }), 95)).toEqual({
      kind: "consider",
      fact: "70% of premium kept",
    });
    expect(markOf(sold({ returnPct: "+49.6%", totalPlRaw: 126 }), 95).kind).toBe("onplan");
  });

  it("marks Review when closing costs more than it brought in, even far from the strike", () => {
    expect(markOf(sold({ returnPct: "-40%", totalPlRaw: -102 }), 95)).toEqual({
      kind: "review",
      fact: "40% of premium lost",
    });
  });

  it("without a live price for the stock, still reads the premium, never the strike", () => {
    expect(markOf(CRWV_PUT)).toEqual({ kind: "review", fact: "116% of premium lost" });
  });

  it("dates an On plan option by its expiry unless its own stock prints first", () => {
    expect(markOf(sold({}), 95)).toMatchObject({ kind: "onplan", fact: "expires Nov 6" });
    const printing = sold({
      nextEvent: { label: "Earnings Nov 3", at: "2026-11-03", beforeExpiry: true, scope: "stock" },
    });
    expect(markOf(printing, 95)).toMatchObject({ kind: "onplan", fact: "earnings Nov 3" });
  });
});

describe("markOf — bought options and shares", () => {
  const call = pos({
    symbol: "AMD261120C00180000",
    display: "AMD $180 CALL",
    isOption: true,
    quantity: "3",
  });

  it("marks a bought option down from what it cost Review, in percent", () => {
    expect(markOf({ ...call, totalPlRaw: -310, returnPct: "−12.2%" })).toEqual({
      kind: "review",
      fact: "down 12%",
    });
  });

  it("marks a bought option up 50% or more Consider", () => {
    expect(markOf({ ...call, totalPlRaw: 696, returnPct: "+55.49%" })).toEqual({
      kind: "consider",
      fact: "up 55%",
    });
  });

  it("marks shares up 25% or more Consider", () => {
    expect(markOf(pos({ totalPlRaw: 10520, returnPct: "+26.5%" }))).toEqual({
      kind: "consider",
      fact: "up 27%",
    });
  });

  it("marks a short stock position losing money above breakeven", () => {
    expect(markOf(pos({ quantity: "-20", totalPlRaw: -40, returnPct: "-2.0%" }))).toEqual({
      kind: "review",
      fact: "above breakeven",
    });
  });

  it("marks shares with nothing dated plain On plan", () => {
    expect(markOf(pos({}))).toEqual({ kind: "onplan", fact: "" });
  });

  it("names a confirmed print without the estimate words", () => {
    const aapl = pos({
      nextPrint: { status: "confirmed", at: "2026-10-29", label: "Earnings Oct 29" },
    });
    expect(markOf(aapl)).toEqual({ kind: "onplan", fact: "earnings Oct 29" });
  });
});

describe("the mark's shape and word", () => {
  it("pairs every kind with a glyph and a word, so colour is never the only signal", () => {
    expect(MARK_GLYPH).toEqual({ review: "◆", consider: "▲", onplan: "○" });
    expect(MARK_WORD).toEqual({ review: "Review", consider: "Consider", onplan: "On plan" });
  });
});

describe("pastLine — how far past its line, the order inside one mark (#5083)", () => {
  const past = (p: DeskPosition, spot?: number) => pastLine(p, markOf(p, spot), spot);

  it("measures a sold put through its strike, negative while the stock is still clear", () => {
    expect(past(CRWV_PUT, 78.4)).toBeCloseTo(2);
    expect(past(CRWV_PUT, 82.6)).toBeCloseTo(-3.25);
  });

  it("measures everything else by its return's distance from cost", () => {
    expect(past(CRWV)).toBeCloseTo(8.32);
    expect(past(CRWV_PUT)).toBeCloseTo(116);
  });

  it("gives On plan no line", () => {
    expect(past(NVDA)).toBe(0);
  });
});
