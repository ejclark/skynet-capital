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

  it("refuses closing more than is held, or a contract not held at all", () => {
    const over = previewOptionClose("MSFT260918P00420000", context({ positions: [longPut] }), 3);
    expect(over.ok).toBe(false);
    const none = previewOptionClose("MSFT260918P00420000", context());
    expect(none.ok).toBe(false);
    expect(none.refusals.join(" ")).toContain("nothing to close");
  });
});
