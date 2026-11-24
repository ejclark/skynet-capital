import { stopLimitWarning } from "../../src/trading/order-exit.js";
import { previewOrder, type TicketContext } from "../../src/trading/order-ticket.js";

// #8249: a whole-share limit buy that carries its own exit (a take-profit and a stop the broker
// holds), and the stop-limit order type. The pure rules; every number a preview shows is computed
// here, never by the form.

const context: TicketContext = {
  cash: 10_000,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_500 }],
  tradingEnabled: true,
  isSelf: true,
  quotePrice: 50,
};

const bracketBuy = {
  symbol: "XLF",
  quantity: 10,
  action: "buy" as const,
  orderType: "limit" as const,
  limitPrice: 50,
  exit: { takeProfit: 55, stop: 47.5 },
};

describe("previewOrder — an exit at entry (#8249)", () => {
  it("echoes both exits, GTC, and the dollars each makes or loses against the limit", () => {
    const preview = previewOrder(bracketBuy, context);
    expect(preview.refusals).toEqual([]);
    expect(preview.ok).toBe(true);
    expect(preview.timeInForce).toBe("gtc");
    expect(preview.exit).toEqual({
      takeProfit: 55,
      stop: 47.5,
      takeProfitDollars: 50,
      stopDollars: -25,
    });
  });

  it("computes the dollars in cents, so a float never leaks a stray digit", () => {
    const preview = previewOrder(
      { ...bracketBuy, quantity: 3, limitPrice: 10.1, exit: { takeProfit: 10.3, stop: 9.9 } },
      context,
    );
    expect(preview.exit?.takeProfitDollars).toBe(0.6);
    expect(preview.exit?.stopDollars).toBe(-0.6);
  });

  it("refuses a take-profit less than a cent above the limit, naming the price at fault", () => {
    const preview = previewOrder({ ...bracketBuy, exit: { takeProfit: 50, stop: 47 } }, context);
    expect(preview.ok).toBe(false);
    expect(preview.refusals).toEqual([
      "The take-profit ($50.00) must be at least $0.01 above the limit ($50.00).",
    ]);
  });

  it("refuses a stop less than a cent below the limit, naming the price at fault", () => {
    const preview = previewOrder(
      { ...bracketBuy, exit: { takeProfit: 55, stop: 49.995 } },
      context,
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals).toEqual([
      "The stop ($50.00) must be at least $0.01 below the limit ($50.00).",
    ]);
  });

  it("accepts exits exactly one cent from the limit", () => {
    const preview = previewOrder(
      { ...bracketBuy, exit: { takeProfit: 50.01, stop: 49.99 } },
      context,
    );
    expect(preview.refusals).toEqual([]);
  });

  it("refuses an exit missing either price, in words", () => {
    const preview = previewOrder({ ...bracketBuy, exit: {} }, context);
    expect(preview.refusals).toEqual([
      "Enter a take-profit price greater than zero.",
      "Enter a stop price greater than zero.",
    ]);
    expect(preview.exit).toBeUndefined();
  });

  it("refuses an exit on a sell, with the reason", () => {
    const preview = previewOrder(
      { ...bracketBuy, symbol: "AAPL", action: "sell", exit: { takeProfit: 55, stop: 47 } },
      context,
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals).toContain("An exit rides a buy only — a sell is already the way out.");
  });

  it.each(["market", "stop", "stop_limit"] as const)(
    "refuses an exit on a %s entry, with the reason",
    (orderType) => {
      const preview = previewOrder(
        { ...bracketBuy, orderType, stopPrice: 52, exit: { takeProfit: 55, stop: 47 } },
        context,
      );
      expect(preview.ok).toBe(false);
      expect(preview.refusals.join(" ")).toContain("An exit needs a limit entry");
    },
  );

  it("refuses an exit on a fractional quantity: the whole-shares sentence says why", () => {
    const preview = previewOrder({ ...bracketBuy, quantity: 2.5 }, context);
    expect(preview.ok).toBe(false);
    expect(preview.refusals).toContain(
      "Whole shares only — fractional quantities aren't supported.",
    );
  });

  it("refuses an exit asked to expire at the close", () => {
    const preview = previewOrder({ ...bracketBuy, timeInForce: "day" }, context);
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("good-till-cancelled");
  });

  it("leaves a ticket with no exit exactly as it was — no exit field at all", () => {
    const { exit: _exit, ...plain } = bracketBuy;
    const preview = previewOrder(plain, context);
    expect("exit" in preview).toBe(false);
    expect(preview).toEqual(
      expect.objectContaining({ ok: true, orderType: "limit", limitPrice: 50, timeInForce: "gtc" }),
    );
  });
});

describe("previewOrder — a stop-limit (#8249)", () => {
  const stopLimitBuy = {
    symbol: "XLF",
    quantity: 10,
    action: "buy" as const,
    orderType: "stop_limit" as const,
    stopPrice: 52,
    limitPrice: 52.5,
  };

  it("previews with both prices, GTC by default", () => {
    const preview = previewOrder(stopLimitBuy, context);
    expect(preview).toEqual(
      expect.objectContaining({
        ok: true,
        orderType: "stop_limit",
        stopPrice: 52,
        limitPrice: 52.5,
        timeInForce: "gtc",
      }),
    );
    expect(preview.warnings).toEqual([]);
  });

  it("costs a buy at its limit when that is above the mark: the broker holds that much cash", () => {
    const preview = previewOrder(
      { ...stopLimitBuy, stopPrice: 110, limitPrice: 115 },
      { ...context, cash: 1_000, quotePrice: 90 },
    );
    expect(preview.estNotional).toBe(1_150);
    expect(preview.ok).toBe(false);
    expect(preview.refusals.join(" ")).toContain("more than your available cash");
  });

  it("requires both prices", () => {
    const preview = previewOrder(
      { symbol: "XLF", quantity: 10, action: "buy", orderType: "stop_limit" },
      context,
    );
    expect(preview.ok).toBe(false);
    expect(preview.refusals).toEqual([
      "Enter a stop price greater than zero.",
      "Enter a limit price greater than zero.",
    ]);
  });

  it("warns, never refuses, when a buy's limit sits below its stop", () => {
    const preview = previewOrder({ ...stopLimitBuy, limitPrice: 51 }, context);
    expect(preview.ok).toBe(true);
    expect(preview.warnings).toEqual([
      "The limit ($51.00) is below the stop ($52.00) — once the stop triggers, this buy may not fill.",
    ]);
  });

  it("warns, never refuses, when a sell's limit sits above its stop", () => {
    expect(stopLimitWarning("sell", 140, 141)).toBe(
      "The limit ($141.00) is above the stop ($140.00) — once the stop triggers, this sell may not fill.",
    );
    expect(stopLimitWarning("sell", 140, 139)).toBeUndefined();
    expect(stopLimitWarning("buy", 52, 52)).toBeUndefined();
  });
});
