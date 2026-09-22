import {
  type OptionTicketContext,
  previewOptionClose,
  previewOptionOrder,
} from "../../src/trading/option-ticket.js";

const context = (over: Partial<OptionTicketContext> = {}): OptionTicketContext => ({
  cash: 100_000,
  positions: [],
  tradingEnabled: true,
  isSelf: true,
  ...over,
});

const csp = {
  code: "201" as const,
  underlying: "MSFT",
  contracts: 2,
  strike: 420,
  expiration: "2026-09-18",
  orderType: "limit" as const,
  limitPrice: 10.7,
};

describe("previewOptionOrder — the discipline rules", () => {
  it("a cash-secured put is refused when the cash isn't there to secure it", () => {
    // 2 contracts × $420 × 100 = $84,000 collateral against $50,000 cash.
    const preview = previewOptionOrder(csp, context({ cash: 50_000 }));
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("Cash-secured means the cash is there");
  });

  it("a cash-secured put with the cash set aside previews with honest payoff numbers", () => {
    const preview = previewOptionOrder(csp, context({ underlyingPrice: 428.6 }));
    expect(preview.ok).toBe(true);
    expect(preview.occSymbol).toBe("MSFT260918P00420000");
    expect(preview.positionIntent).toBe("sell_to_open");
    expect(preview.collateral).toBe(84_000);
    expect(preview.estNotional).toBeCloseTo(2_140); // $10.70 × 200 shares
    expect(preview.maxProfit).toBeCloseTo(2_140);
    expect(preview.maxLoss).toBeCloseTo(81_860); // strike − premium, per share, × 200
    expect(preview.breakeven).toBeCloseTo(409.3);
  });

  it("a covered call is refused without 100 held shares per contract — never naked", () => {
    const request = { ...csp, code: "202" as const, contracts: 2 };
    const short = previewOptionOrder(
      request,
      context({
        positions: [{ symbol: "MSFT", quantity: 150, avgPrice: 400, marketValue: 64_000 }],
      }),
    );
    expect(short.ok).toBe(false);
    expect(short.refusals.join(" ")).toContain("needs 200 shares");

    const covered = previewOptionOrder(
      request,
      context({
        positions: [{ symbol: "MSFT", quantity: 200, avgPrice: 400, marketValue: 85_000 }],
      }),
    );
    expect(covered.ok).toBe(true);
    expect(covered.sharesCommitted).toBe(200);
  });

  it("a long option must be payable from cash at its limit", () => {
    const request = { ...csp, code: "302" as const, contracts: 5, limitPrice: 12 };
    // 5 × $12 × 100 = $6,000 against $5,000.
    const preview = previewOptionOrder(request, context({ cash: 5_000 }));
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("more than your available cash");
  });

  it("a long call's payoff is uncapped up, premium-capped down", () => {
    const preview = previewOptionOrder(
      { ...csp, code: "302", contracts: 1, strike: 430, limitPrice: 8 },
      context(),
    );
    expect(preview.ok).toBe(true);
    expect(preview.positionIntent).toBe("buy_to_open");
    expect(preview.maxProfit).toBe("uncapped");
    expect(preview.maxLoss).toBeCloseTo(800);
    expect(preview.breakeven).toBeCloseTo(438);
  });

  it("a long put pays the most at zero", () => {
    const preview = previewOptionOrder(
      { ...csp, code: "301", contracts: 1, strike: 400, limitPrice: 6 },
      context(),
    );
    expect(preview.maxProfit).toBeCloseTo(39_400); // (400 − 6) × 100
    expect(preview.maxLoss).toBeCloseTo(600);
  });

  it("market orders warn about the spread and lean on the indicative premium", () => {
    const request = { ...csp, orderType: "market" as const };
    const { limitPrice: _drop, ...noLimit } = request;
    const preview = previewOptionOrder(noLimit, context({ premium: 10.5 }));
    expect(preview.ok).toBe(true);
    expect(preview.estPremium).toBe(10.5);
    expect(preview.warnings.join(" ")).toContain("Market orders on options");
  });

  it("refuses a play the account's options level doesn't cover (#468 criterion 7)", () => {
    // 301/302 need level 2; the account here is only approved to level 1.
    const preview = previewOptionOrder(
      { ...csp, code: "302", contracts: 1, strike: 430, limitPrice: 8 },
      context({ optionsTradingLevel: 1 }),
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("options trading level (1)");
    expect(preview.refusals.join(" ")).toContain("needs level 2");
  });

  it("allows a play the account's level covers, and a higher level than required", () => {
    const atLevel = previewOptionOrder(csp, context({ optionsTradingLevel: 1 }));
    expect(atLevel.ok).toBe(true);
    const aboveLevel = previewOptionOrder(
      { ...csp, code: "302", contracts: 1, strike: 430, limitPrice: 8 },
      context({ optionsTradingLevel: 3 }),
    );
    expect(aboveLevel.ok).toBe(true);
  });

  it("skips the level check entirely when the level hasn't been read — never a false refusal", () => {
    // No `optionsTradingLevel` set at all (the browser-side preview before a live re-fetch).
    const preview = previewOptionOrder(
      { ...csp, code: "302", contracts: 1, strike: 430, limitPrice: 8 },
      context(),
    );
    expect(preview.ok).toBe(true);
  });

  it("refuses when trading is off, when not self, and on malformed shape", () => {
    expect(previewOptionOrder(csp, context({ tradingEnabled: false })).ok).toBe(false);
    expect(previewOptionOrder(csp, context({ isSelf: false })).ok).toBe(false);
    expect(previewOptionOrder({ ...csp, contracts: 1.5 }, context()).ok).toBe(false);
    expect(previewOptionOrder({ ...csp, expiration: "sept 18" }, context()).ok).toBe(false);
    expect(
      previewOptionOrder({ ...csp, orderType: "limit", limitPrice: undefined }, context()).ok,
    ).toBe(false);
  });
});

describe("odds and greeks on the order screen (#3407 P2 slice 2)", () => {
  it("carries the feed's greeks and the solved IV through, and the odds when every input is real", () => {
    const preview = previewOptionOrder(
      csp,
      context({
        underlyingPrice: 428.6,
        greeks: { delta: -0.42, theta: -0.19 },
        impliedVol: 0.31,
        daysToExpiry: 30,
      }),
    );
    expect(preview.ok).toBe(true);
    expect(preview.greeks).toEqual({ delta: -0.42, theta: -0.19 });
    expect(preview.impliedVol).toBe(0.31);
    expect(preview.chanceOfProfit).toBeGreaterThan(0.5);
    expect(preview.chanceOfProfit).toBeLessThan(1);
    expect(typeof preview.expectedValue).toBe("number");
  });

  it("prints no odds without an IV, a spot or a clock — never a guessed number", () => {
    const noIv = previewOptionOrder(csp, context({ underlyingPrice: 428.6, daysToExpiry: 30 }));
    expect(noIv.chanceOfProfit).toBeUndefined();
    expect(noIv.expectedValue).toBeUndefined();
    const noSpot = previewOptionOrder(csp, context({ impliedVol: 0.3, daysToExpiry: 30 }));
    expect(noSpot.chanceOfProfit).toBeUndefined();
  });

  it("prints no odds on a refused order", () => {
    const refused = previewOptionOrder(
      csp,
      context({ cash: 1, underlyingPrice: 428.6, impliedVol: 0.3, daysToExpiry: 30 }),
    );
    expect(refused.ok).toBe(false);
    expect(refused.chanceOfProfit).toBeUndefined();
  });
});

describe("the payoff curve on the order screen (#3407 — the single-leg diagram)", () => {
  it("samples a sold put through its strike: flat at the credit above, falling below", () => {
    const preview = previewOptionOrder(csp, context({ underlyingPrice: 428.6 }));
    expect(preview.payoff).toBeDefined();
    if (!preview.payoff) return;
    expect(preview.payoff.from).toBeCloseTo(336); // 420 × 0.8
    expect(preview.payoff.to).toBeCloseTo(504);
    expect(preview.payoff.breakevens).toEqual([409.3]); // the grid's breakeven
    expect(preview.payoff.points.at(-1)?.pnl).toBeCloseTo(2_140); // the whole credit
    // Still falling at the window's edge — the chart labels that, the max loss is the grid's.
    expect(preview.payoff.points[0]?.pnl).toBeCloseTo((10.7 - 84) * 200);
  });

  it("a covered call carries its shares: the curve tops out at strike − spot + premium", () => {
    const request = { ...csp, code: "202" as const, contracts: 2 };
    const held = { symbol: "MSFT", quantity: 200, avgPrice: 400, marketValue: 85_000 };
    const covered = previewOptionOrder(
      request,
      context({ positions: [held], underlyingPrice: 410 }),
    );
    expect(covered.payoff).toBeDefined();
    if (!covered.payoff) return;
    // Above the strike the shares are called away: (420 − 410 + 10.70) × 200.
    expect(covered.payoff.points.at(-1)?.pnl).toBeCloseTo(4_140);
    expect(covered.maxProfit).toBeCloseTo(4_140);
    expect(covered.payoff.breakevens).toEqual([399.3]); // spot − premium, the grid's number
    // Without a spot there is no basis for the shares, so no curve — as there is no max loss.
    const noSpot = previewOptionOrder(request, context({ positions: [held] }));
    expect(noSpot.maxLoss).toBeUndefined();
    expect(noSpot.payoff).toBeUndefined();
  });

  it("a long option's curve needs no spot, and a refused order carries none", () => {
    const call = previewOptionOrder(
      { ...csp, code: "302", contracts: 1, strike: 430, limitPrice: 8 },
      context(),
    );
    expect(call.payoff?.breakevens).toEqual([438]);
    expect(call.payoff?.points[0]?.pnl).toBeCloseTo(-800);
    const refused = previewOptionOrder(csp, context({ cash: 10 }));
    expect(refused.ok).toBe(false);
    expect(refused.payoff).toBeUndefined();
  });
});

describe("time in force on option orders (#3407 P1 slice 4)", () => {
  it("always states the TIF it will send — day unless the member picked gtc", () => {
    expect(previewOptionOrder(csp, context()).timeInForce).toBe("day");
    expect(previewOptionOrder({ ...csp, timeInForce: "gtc" }, context()).timeInForce).toBe("gtc");
  });

  it("carries the pick on a close too, defaulting to day", () => {
    const longPut = {
      symbol: "MSFT260918P00420000",
      quantity: 2,
      avgPrice: 1_070,
      marketValue: 2_400,
    };
    expect(
      previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] })).timeInForce,
    ).toBe("day");
    expect(
      previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] }), undefined, {
        timeInForce: "gtc",
      }).timeInForce,
    ).toBe("gtc");
  });
});

describe("previewOptionClose — direction from the held sign", () => {
  const longPut = {
    symbol: "MSFT260918P00420000",
    quantity: 2,
    avgPrice: 1_070,
    marketValue: 2_400,
  };
  const shortCall = {
    symbol: "AAPL261218C00150000",
    quantity: -1,
    avgPrice: 300,
    marketValue: -250,
  };

  it("a long closes with a sell", () => {
    const preview = previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] }));
    expect(preview.ok).toBe(true);
    expect(preview.side).toBe("sell");
    expect(preview.positionIntent).toBe("sell_to_close");
    expect(preview.contracts).toBe(2);
    expect(preview.estPremium).toBeCloseTo(12); // $2,400 over 2 contracts × 100 shares
    expect(preview.warnings.join(" ")).toContain("closes the position completely");
  });

  it("a written (short) contract closes with a buy", () => {
    const preview = previewOptionClose("AAPL261218C00150000", context({ positions: [shortCall] }));
    expect(preview.ok).toBe(true);
    expect(preview.side).toBe("buy");
    expect(preview.positionIntent).toBe("buy_to_close");
  });

  it("closes at a limit when asked — the estimate follows the limit, not the mark (#3407)", () => {
    const preview = previewOptionClose(
      "MSFT260918P00420000",
      context({ positions: [longPut] }),
      undefined,
      { orderType: "limit", limitPrice: 13.5 },
    );
    expect(preview.ok).toBe(true);
    expect(preview.orderType).toBe("limit");
    expect(preview.limitPrice).toBe(13.5);
    expect(preview.estPremium).toBe(13.5);
    expect(preview.estNotional).toBeCloseTo(2_700); // 13.5 × 2 contracts × 100
    expect(preview.warnings.join(" ")).not.toContain("market close");
  });

  it("refuses a limit close with no price, and warns that a market close is the undisciplined habit", () => {
    const noPrice = previewOptionClose(
      "MSFT260918P00420000",
      context({ positions: [longPut] }),
      undefined,
      { orderType: "limit" },
    );
    expect(noPrice.ok).toBe(false);
    expect(noPrice.refusals.join(" ")).toContain("limit close needs a limit price");
    const market = previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] }));
    expect(market.orderType).toBe("market");
    expect(market.warnings.join(" ")).toContain("market close fills at whatever the spread says");
  });

  it("refuses closing more than is held, or a contract not held at all", () => {
    const over = previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] }), 3);
    expect(over.ok).toBe(false);
    const none = previewOptionClose("MSFT260918P00420000", context());
    expect(none.ok).toBe(false);
    expect(none.refusals.join(" ")).toContain("nothing to close");
  });
});
