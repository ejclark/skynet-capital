import {
  bookNeeds,
  type CoverLeg,
  coverNeeds,
  coverShortfall,
  freeCash,
  freeShares,
  heldContracts,
  marginalNeeds,
  needsAfterClose,
  opensRisk,
  optionBook,
  premiumOut,
  quoteBand,
  requiredOptionLevel,
} from "../../src/domain/option-book.js";
import type { OptionOrderIntent } from "../../src/domain/types.js";
import { anOptionIntent, anOptionQuote, aPortfolio, aPosition } from "../support/builders.js";

const NOV = "2026-11-13";
const DEC = "2026-12-18";
const call = (strike: number, contracts: number, expiration = NOV): CoverLeg => ({
  underlying: "NVDA",
  type: "call",
  strike,
  expiration,
  contracts,
});
const put = (strike: number, contracts: number, expiration = NOV): CoverLeg => ({
  ...call(strike, contracts, expiration),
  type: "put",
});
const needs = (legs: readonly CoverLeg[]) => {
  const n = coverNeeds(legs);
  return {
    cash: n.cash,
    cashByUnderlying: Object.fromEntries(n.cashByUnderlying),
    sharesByUnderlying: Object.fromEntries(n.sharesByUnderlying),
  };
};

const NVDA_240C = "NVDA261113C00240000";
const NVDA_250C = "NVDA261113C00250000";
const CRWV_85P = "CRWV261106P00085000";

const spreadOpen: OptionOrderIntent = {
  effect: "open",
  structure: "call-debit-spread",
  legs: [
    { occSymbol: NVDA_240C, side: "buy", ratio: 1 },
    { occSymbol: NVDA_250C, side: "sell", ratio: 1 },
  ],
  limitPrice: 3.4,
};

describe("coverNeeds — one-to-one cap assignment", () => {
  it("a debit spread (long the lower call) promises nothing: its short call locks no shares", () => {
    expect(needs([call(240, 1), call(250, -1)])).toEqual({
      cash: 0,
      cashByUnderlying: {},
      sharesByUnderlying: {},
    });
  });

  it("a credit call spread sets aside its width, and still locks no shares", () => {
    expect(needs([call(240, -1), call(250, 1)])).toEqual({
      cash: 1_000,
      cashByUnderlying: { NVDA: 1_000 },
      sharesByUnderlying: {},
    });
  });

  it("one long caps ONE short, never two — the second short call is bare", () => {
    // `cappingLeg` would find the 260 for both shorts and read the pair as fully capped.
    expect(needs([call(240, -1), call(250, -1), call(260, 1)])).toEqual({
      cash: 1_000, // the 260 caps the 250 (the cheapest cap); the 240 needs 100 shares
      cashByUnderlying: { NVDA: 1_000 },
      sharesByUnderlying: { NVDA: 100 },
    });
  });

  it("a long expiring before the short caps nothing", () => {
    expect(needs([call(250, 1, NOV), call(240, -1, DEC)]).sharesByUnderlying).toEqual({
      NVDA: 100,
    });
  });

  it("splits a two-contract long across two one-contract shorts", () => {
    expect(needs([call(250, -1), call(260, -1), call(240, 2)])).toEqual({
      cash: 0,
      cashByUnderlying: {},
      sharesByUnderlying: {},
    });
  });

  it("a bare put sets aside its strike; a lower long put caps it at the width; a higher one fully", () => {
    expect(needs([put(85, -1)]).cash).toBe(8_500);
    expect(needs([put(85, -1), put(80, 1)]).cash).toBe(500);
    expect(needs([put(85, -1), put(90, 1)]).cash).toBe(0);
  });

  it("nets the same contract held long and sold before assigning anything", () => {
    expect(needs([call(240, 1), call(240, -1)]).cash).toBe(0);
    expect(needs([put(85, -2), put(85, 1)]).cash).toBe(8_500);
  });

  it("keeps each underlying's promises apart", () => {
    const crwv: CoverLeg = { ...put(85, -1), underlying: "CRWV" };
    expect(needs([crwv, call(240, -1)])).toEqual({
      cash: 8_500,
      cashByUnderlying: { CRWV: 8_500 },
      sharesByUnderlying: { NVDA: 100 },
    });
  });
});

describe("the book read from positions", () => {
  const portfolio = aPortfolio({
    cash: 20_000,
    positions: [
      aPosition({ symbol: "CRWV", quantity: 150, avgPrice: 91 }),
      aPosition({ symbol: CRWV_85P, quantity: -1, avgPrice: 2.1 }),
      aPosition({ symbol: "CRWV261106C00100000", quantity: -1, avgPrice: 1.5 }),
      aPosition({ symbol: NVDA_240C, quantity: 0 }),
    ],
  });

  it("lists every held contract with its parts, skipping shares and zero rows", () => {
    expect(
      heldContracts(portfolio).map((c) => [c.occSymbol, c.type, c.strike, c.quantity]),
    ).toEqual([
      [CRWV_85P, "put", 85, -1],
      ["CRWV261106C00100000", "call", 100, -1],
    ]);
  });

  it("reads one underlying's shares, their cost and its contracts", () => {
    const book = optionBook(portfolio, "CRWV");
    expect(book).toMatchObject({ underlying: "CRWV", shares: 150, shareCost: 91 });
    expect(book.contracts).toHaveLength(2);
    expect(optionBook(portfolio, "NVDA")).toEqual({ underlying: "NVDA", shares: 0, contracts: [] });
  });

  it("free cash is cash less put collateral; free shares are shares less sold calls", () => {
    const book = bookNeeds(portfolio);
    expect(freeCash(portfolio, book)).toBe(11_500);
    expect(freeShares(portfolio, "CRWV", book)).toBe(50);
    expect(freeShares(portfolio, "NVDA")).toBe(0);
  });
});

describe("what an order adds", () => {
  it("opensRisk reads an option's effect, and a share's side", () => {
    expect(opensRisk(anOptionIntent())).toBe(true); // a sold put is a sell that OPENS risk
    expect(
      opensRisk(anOptionIntent({ side: "buy", option: { effect: "close", structure: "close" } })),
    ).toBe(false);
    expect(
      opensRisk({ symbol: "NVDA", side: "buy", quantity: 1, type: "market", reason: "t" }),
    ).toBe(true);
    expect(
      opensRisk({ symbol: "NVDA", side: "sell", quantity: 1, type: "market", reason: "t" }),
    ).toBe(false);
  });

  it("names the approval level each structure needs; a close needs none", () => {
    const base = anOptionIntent().option as OptionOrderIntent;
    expect(requiredOptionLevel(base)).toBe(1);
    expect(requiredOptionLevel({ ...base, structure: "covered-call" })).toBe(1);
    expect(requiredOptionLevel(spreadOpen)).toBe(3);
    expect(requiredOptionLevel({ ...base, effect: "close", structure: "close" })).toBe(0);
  });

  it("a sold put adds its strike in collateral; a covered call adds 100 shares; a spread adds neither", () => {
    const flat = aPortfolio({ cash: 10_000 });
    const sold = anOptionIntent().option as OptionOrderIntent;
    expect(marginalNeeds(flat, sold, 1).cash).toBe(8_500);
    const coveredCall: OptionOrderIntent = {
      ...sold,
      structure: "covered-call",
      legs: [{ occSymbol: "CRWV261106C00100000", side: "sell", ratio: 1 }],
    };
    expect(marginalNeeds(flat, coveredCall, 1).sharesByUnderlying.get("CRWV")).toBe(100);
    const spread = marginalNeeds(flat, spreadOpen, 1);
    expect([spread.cash, spread.sharesByUnderlying.size]).toEqual([0, 0]);
  });

  it("closing the long that caps a short call leaves that call bare", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA261113C00230000", quantity: -1 }),
        aPosition({ symbol: NVDA_250C, quantity: 1 }),
      ],
    });
    const closeLong: OptionOrderIntent = {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol: NVDA_250C, side: "sell", ratio: 1 }],
      limitPrice: 1,
    };
    expect(bookNeeds(portfolio).sharesByUnderlying.get("NVDA")).toBeUndefined();
    expect(needsAfterClose(portfolio, closeLong, 1).sharesByUnderlying.get("NVDA")).toBe(100);
  });

  it("premium out: a bought leg its limit, a vertical its net debit, a sold leg or a credit nothing", () => {
    const sold = anOptionIntent().option as OptionOrderIntent;
    expect(premiumOut(sold)).toBe(0);
    expect(premiumOut(spreadOpen)).toBeCloseTo(340);
    expect(premiumOut({ ...spreadOpen, limitPrice: -1.2 })).toBe(0);
    expect(
      premiumOut({
        ...sold,
        legs: [{ occSymbol: CRWV_85P, side: "buy", ratio: 1 }],
        limitPrice: 0.4,
      }),
    ).toBeCloseTo(40);
  });
});

describe("quoteBand", () => {
  const at = "2026-10-05T14:30:00Z";
  const later = "2026-10-05T14:31:00Z";

  it("one leg: the bid and the ask, stamped with the feed's time", () => {
    const quotes = { [CRWV_85P]: anOptionQuote(CRWV_85P, { bid: 2, ask: 2.2, at }) };
    expect(quoteBand(anOptionIntent().option as OptionOrderIntent, quotes)).toEqual({
      low: 2,
      high: 2.2,
      at,
    });
  });

  it("a vertical, in Alpaca's signed net: open is a debit band, close a credit band", () => {
    const quotes = {
      [NVDA_240C]: anOptionQuote(NVDA_240C, { bid: 9, ask: 9.4, at: later }),
      [NVDA_250C]: anOptionQuote(NVDA_250C, { bid: 5.5, ask: 5.8, at }),
    };
    expect(quoteBand(spreadOpen, quotes)).toEqual({ low: 3.2, high: 3.9, at });
    const close: OptionOrderIntent = {
      effect: "close",
      structure: "close",
      legs: [
        { occSymbol: NVDA_240C, side: "sell", ratio: 1 },
        { occSymbol: NVDA_250C, side: "buy", ratio: 1 },
      ],
      limitPrice: -3.5,
    };
    expect(quoteBand(close, quotes)).toEqual({ low: -3.9, high: -3.2, at });
  });

  it("drops the stamp when any leg has none, and has no band without a two-sided quote", () => {
    const unstamped = {
      [NVDA_240C]: anOptionQuote(NVDA_240C, { quotedAt: undefined }),
      [NVDA_250C]: anOptionQuote(NVDA_250C),
    };
    expect(quoteBand(spreadOpen, unstamped)?.at).toBeUndefined();
    const oneSided = { ...unstamped, [NVDA_250C]: anOptionQuote(NVDA_250C, { bid: undefined }) };
    expect(quoteBand(spreadOpen, oneSided)).toBeUndefined();
    expect(quoteBand(spreadOpen, {})).toBeUndefined();
  });

  it("a $0.00 bid is a real quote, not a missing one", () => {
    const quotes = { [CRWV_85P]: anOptionQuote(CRWV_85P, { bid: 0, ask: 0.05 }) };
    expect(quoteBand(anOptionIntent().option as OptionOrderIntent, quotes)?.low).toBe(0);
  });
});

describe("coverShortfall — the best assignment, against the shares actually free", () => {
  const twoCallsOneHighLong = [call(240, -2), call(250, 1)];

  it("covers sold calls with free shares before paying a higher long's width in cash", () => {
    // 200 shares cover both calls: no cash, though the $250 long could cap one at $1,000.
    expect(coverShortfall(twoCallsOneHighLong, "NVDA", 200)).toEqual({
      shares: 0,
      cash: 0,
      exact: true,
    });
  });

  it("pays the width only for the call the free shares cannot cover", () => {
    expect(coverShortfall(twoCallsOneHighLong, "NVDA", 100)).toEqual({
      shares: 0,
      cash: 1_000,
      exact: true,
    });
    // No shares at all: one call capped, one short of its 100.
    expect(coverShortfall(twoCallsOneHighLong, "NVDA", 0)).toEqual({
      shares: 100,
      cash: 1_000,
      exact: true,
    });
  });

  it("a debit spread's short is capped for free, shares or not", () => {
    expect(coverShortfall([call(240, 1), call(250, -1)], "NVDA", 0)).toEqual({
      shares: 0,
      cash: 0,
      exact: true,
    });
  });

  it("finds the cheapest put caps — not the first that fits", () => {
    // The Dec $85 long must cap the Dec $90 short; spending it on the Nov $90 short (which the Nov $80
    // long can cap) would leave the Dec short bare at $9,000.
    const legs = [put(90, -1, NOV), put(90, -1, DEC), put(80, 1, NOV), put(85, 1, DEC)];
    expect(coverShortfall(legs, "NVDA", 0).cash).toBe(1_500);
  });

  it("past a dozen contracts on one side, falls back to the greedy assignment and says so", () => {
    expect(coverShortfall([put(85, -13)], "NVDA", 0)).toEqual({
      shares: 0,
      cash: 13 * 8_500,
      exact: false,
    });
  });
});
