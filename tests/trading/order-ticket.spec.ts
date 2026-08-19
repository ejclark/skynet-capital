import {
  markPrice,
  previewClose,
  previewOrder,
  ROLL_UNAVAILABLE_REASON,
  type TicketContext,
} from "../../src/trading/order-ticket.js";

const context = (over: Partial<TicketContext> = {}): TicketContext => ({
  cash: 10_000,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200 }],
  tradingEnabled: true,
  isSelf: true,
  ...over,
});

describe("previewOrder — a legal buy", () => {
  const preview = previewOrder({ symbol: "aapl", quantity: 5, action: "buy" }, context());

  it("normalizes the symbol to upper case", () => {
    expect(preview.symbol).toBe("AAPL");
  });

  it("prices the order off the position's mark and shows the cash left after", () => {
    expect(preview.estPrice).toBe(120);
    expect(preview.estNotional).toBe(600);
    expect(preview.estCashAfter).toBe(9_400);
    expect(preview.positionAfter).toBe(15);
  });

  it("passes review with no refusals", () => {
    expect(preview.ok).toBe(true);
    expect(preview.refusals).toEqual([]);
  });
});

describe("previewOrder — refusals block the order", () => {
  it("refuses when the viewer is not the account holder", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 1, action: "buy" },
      context({ isSelf: false }),
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("your own account");
  });

  it("refuses when desk trading is switched off for the deployment", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 1, action: "buy" },
      context({ tradingEnabled: false }),
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("switched off");
  });

  it("refuses fractional and non-positive quantities", () => {
    expect(previewOrder({ symbol: "AAPL", quantity: 1.5, action: "buy" }, context()).ok).toBe(
      false,
    );
    expect(previewOrder({ symbol: "AAPL", quantity: 0, action: "buy" }, context()).ok).toBe(false);
    expect(previewOrder({ symbol: "AAPL", quantity: -3, action: "buy" }, context()).ok).toBe(false);
  });

  it("refuses a symbol that isn't shaped like a ticker", () => {
    const preview = previewOrder({ symbol: "not a symbol", quantity: 1, action: "buy" }, context());
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("stock symbol");
  });

  it("refuses a buy that costs more than available cash", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 100, action: "buy" },
      context({ cash: 500 }),
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("more than your available cash");
  });

  it("refuses selling a symbol that isn't held — the desk opens no shorts", () => {
    const preview = previewOrder({ symbol: "TSLA", quantity: 1, action: "sell" }, context());
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("short");
  });

  it("refuses selling more shares than are held", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 11, action: "sell" }, context());
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("You hold 10 shares");
  });
});

describe("previewOrder — warnings inform without blocking", () => {
  it("warns that a full-size sell closes the position", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 10, action: "sell" }, context());
    expect(preview.ok).toBe(true);
    expect(preview.warnings.join(" ")).toContain("closes the position completely");
    expect(preview.positionAfter).toBe(0);
  });

  it("warns when the market is closed but still allows the order to queue", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 1, action: "buy" },
      context({ marketOpen: false }),
    );
    expect(preview.ok).toBe(true);
    expect(preview.warnings.join(" ")).toContain("market is closed");
  });

  it("makes no market-hours claim when the clock wasn't checked", () => {
    const preview = previewOrder({ symbol: "AAPL", quantity: 1, action: "buy" }, context());
    expect(preview.warnings.join(" ")).not.toContain("market is closed");
  });

  it("warns when a buy spends nearly all available cash", () => {
    const preview = previewOrder(
      { symbol: "AAPL", quantity: 8, action: "buy" },
      context({ cash: 1_000 }),
    );
    expect(preview.ok).toBe(true);
    expect(preview.warnings.join(" ")).toContain("nearly all");
  });

  it("warns rather than refuses when no price is known for an unheld symbol", () => {
    const preview = previewOrder({ symbol: "MSFT", quantity: 1, action: "buy" }, context());
    expect(preview.ok).toBe(true);
    expect(preview.estNotional).toBeUndefined();
    expect(preview.warnings.join(" ")).toContain("No recent price");
  });
});

describe("previewClose", () => {
  it("defaults to the entire held quantity", () => {
    const preview = previewClose("AAPL", context());
    expect(preview.quantity).toBe(10);
    expect(preview.action).toBe("sell");
    expect(preview.ok).toBe(true);
  });

  it("accepts a partial quantity for scaling out", () => {
    const preview = previewClose("AAPL", context(), 3);
    expect(preview.quantity).toBe(3);
    expect(preview.positionAfter).toBe(7);
    expect(preview.warnings.join(" ")).not.toContain("closes the position completely");
  });

  it("refuses to close a symbol that isn't held", () => {
    expect(previewClose("NVDA", context()).ok).toBe(false);
  });
});

describe("markPrice", () => {
  it("derives price per share from market value", () => {
    expect(markPrice({ symbol: "X", quantity: 4, avgPrice: 10, marketValue: 60 })).toBe(15);
  });

  it("falls back to the entry price when market value is unusable", () => {
    expect(markPrice({ symbol: "X", quantity: 4, avgPrice: 10, marketValue: 0 })).toBe(10);
  });

  it("has no price for an empty holding", () => {
    expect(markPrice(undefined)).toBeUndefined();
    expect(markPrice({ symbol: "X", quantity: 0, avgPrice: 10, marketValue: 0 })).toBeUndefined();
  });
});

describe("rolling", () => {
  it("states plainly that the atomic close-and-reopen order isn't built yet", () => {
    expect(ROLL_UNAVAILABLE_REASON).toContain("single atomic order");
    expect(ROLL_UNAVAILABLE_REASON).toContain("isn't built yet");
  });
});
