import {
  heldShares,
  payoff,
  SHARES_PER_CONTRACT,
  validateAffordability,
} from "../../src/trading/option-economics.js";
import type { OptionTicketContext } from "../../src/trading/option-ticket.js";

const context = (over: Partial<OptionTicketContext> = {}): OptionTicketContext => ({
  cash: 100_000,
  positions: [],
  tradingEnabled: true,
  isSelf: true,
  ...over,
});

describe("SHARES_PER_CONTRACT", () => {
  it("is the standard equity-option multiplier", () => {
    expect(SHARES_PER_CONTRACT).toBe(100);
  });
});

describe("heldShares", () => {
  it("is zero when the underlying isn't held at all", () => {
    expect(heldShares(context({ positions: [] }), "MSFT")).toBe(0);
  });

  it("reads the held quantity for the matching symbol", () => {
    const held = heldShares(
      context({
        positions: [{ symbol: "MSFT", quantity: 200, avgPrice: 400, marketValue: 85_000 }],
      }),
      "MSFT",
    );
    expect(held).toBe(200);
  });

  it("never reports a negative count — a short position covers nothing", () => {
    const held = heldShares(
      context({
        positions: [{ symbol: "MSFT", quantity: -50, avgPrice: 400, marketValue: -21_000 }],
      }),
      "MSFT",
    );
    expect(held).toBe(0);
  });
});

describe("payoff — the textbook arithmetic per play", () => {
  it("reports nothing when there's no premium to price it from", () => {
    expect(payoff("201", 420, undefined, undefined, 200)).toEqual({});
  });

  it("a cash-secured put: keep the premium above strike, own the stock below it", () => {
    const result = payoff("201", 420, 10.7, undefined, 200);
    expect(result.maxProfit).toBeCloseTo(2_140); // premium × 200 shares
    expect(result.maxLoss).toBeCloseTo(81_860); // (strike − premium) × 200
    expect(result.breakeven).toBeCloseTo(409.3);
  });

  it("a covered call without a known spot still prices the premium as the floor of maxProfit", () => {
    const result = payoff("202", 420, 5, undefined, 100);
    expect(result.maxProfit).toBeCloseTo(500);
    expect(result.maxLoss).toBeUndefined();
    expect(result.breakeven).toBeUndefined();
  });

  it("a covered call with a known spot prices the full upside/downside and breakeven", () => {
    const result = payoff("202", 420, 5, 400, 100);
    expect(result.maxProfit).toBeCloseTo(2_500); // (strike − spot + premium) × 100
    expect(result.maxLoss).toBeCloseTo(39_500); // (spot − premium) × 100
    expect(result.breakeven).toBeCloseTo(395);
  });

  it("a long put pays the most at zero; the premium is the whole downside", () => {
    const result = payoff("301", 400, 6, undefined, 100);
    expect(result.maxProfit).toBeCloseTo(39_400);
    expect(result.maxLoss).toBeCloseTo(600);
    expect(result.breakeven).toBeCloseTo(394);
  });

  it("a long call is uncapped above breakeven; the premium is the whole downside", () => {
    const result = payoff("302", 430, 8, undefined, 100);
    expect(result.maxProfit).toBe("uncapped");
    expect(result.maxLoss).toBeCloseTo(800);
    expect(result.breakeven).toBeCloseTo(438);
  });
});

describe("validateAffordability — no naked premium from this desk", () => {
  const request = {
    code: "201" as const,
    underlying: "MSFT",
    contracts: 2,
    strike: 420,
    expiration: "2026-09-18",
    orderType: "limit" as const,
    limitPrice: 10.7,
  };

  it("refuses a cash-secured put when the collateral isn't fully set aside", () => {
    const refusals: string[] = [];
    const warnings: string[] = [];
    validateAffordability(request, context({ cash: 50_000 }), 10.7, refusals, warnings);
    expect(refusals.join(" ")).toContain("Cash-secured means the cash is there");
  });

  it("passes a cash-secured put once the collateral is covered", () => {
    const refusals: string[] = [];
    const warnings: string[] = [];
    validateAffordability(request, context({ cash: 84_000 }), 10.7, refusals, warnings);
    expect(refusals).toHaveLength(0);
  });

  it("refuses a covered call without 100 held shares per contract", () => {
    const refusals: string[] = [];
    const warnings: string[] = [];
    validateAffordability(
      { ...request, code: "202" as const },
      context({
        positions: [{ symbol: "MSFT", quantity: 150, avgPrice: 400, marketValue: 64_000 }],
      }),
      10.7,
      refusals,
      warnings,
    );
    expect(refusals.join(" ")).toContain("needs 200 shares");
  });

  it("warns instead of refusing a bought option when no indicative premium is known", () => {
    const refusals: string[] = [];
    const warnings: string[] = [];
    validateAffordability(
      { ...request, code: "302" as const },
      context(),
      undefined,
      refusals,
      warnings,
    );
    expect(refusals).toHaveLength(0);
    expect(warnings.join(" ")).toContain("No indicative premium");
  });

  it("refuses a bought option that costs more than the cash on hand", () => {
    const refusals: string[] = [];
    const warnings: string[] = [];
    validateAffordability(
      { ...request, code: "302" as const, contracts: 5, limitPrice: 12 },
      context({ cash: 5_000 }),
      12,
      refusals,
      warnings,
    );
    expect(refusals.join(" ")).toContain("more than your available cash");
  });
});
