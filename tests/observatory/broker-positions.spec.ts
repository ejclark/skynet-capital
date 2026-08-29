import type { AlpacaPosition } from "../../src/alpaca/alpaca-trading-client.js";
import { OPTION_MULTIPLIER, positionsFrom } from "../../src/observatory/broker-positions.js";

/**
 * The one conversion from Alpaca's stringly-typed position payload into real arithmetic — an
 * option's per-share broker price needs the 100x contract multiplier or the blotter and the
 * order-review screen would disagree about the same holding.
 */
function stockPosition(overrides: Partial<AlpacaPosition> = {}): AlpacaPosition {
  return {
    symbol: "NVDA",
    qty: "10",
    avg_entry_price: "100",
    market_value: "1100",
    lastday_price: "105",
    ...overrides,
  } as AlpacaPosition;
}

describe("positionsFrom", () => {
  it("converts a stock position's stringly-typed fields to numbers, unscaled", () => {
    const [position] = positionsFrom([stockPosition()]);
    expect(position).toMatchObject({
      symbol: "NVDA",
      quantity: 10,
      avgPrice: 100,
      marketValue: 1100,
      lastdayPrice: 105,
    });
  });

  it("scales an option position's per-share prices by the contract multiplier, but not market value", () => {
    const [position] = positionsFrom([
      stockPosition({ symbol: "NVDA260918P00100000", avg_entry_price: "2.5", lastday_price: "3" }),
    ]);
    expect(position?.avgPrice).toBe(2.5 * OPTION_MULTIPLIER);
    expect(position?.lastdayPrice).toBe(3 * OPTION_MULTIPLIER);
    expect(position?.marketValue).toBe(1100); // already a total-dollar figure — never rescaled
  });

  it("omits lastdayPrice when the broker didn't return one worth trusting", () => {
    const [position] = positionsFrom([stockPosition({ lastday_price: "0" })]);
    expect(position && "lastdayPrice" in position).toBe(false);
  });
});
