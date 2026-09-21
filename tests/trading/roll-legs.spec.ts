import { rollLegs, rollPriceSides } from "../../src/trading/roll-legs.js";

/**
 * A roll is two legs of one draft (#3407 P3 slice 3): the held contract closed, the target
 * opened, direction from the sign of the holding, 1:1, each leg at the price the caller chose.
 */

const heldShortCall = {
  underlying: "NVDA",
  type: "call" as const,
  strike: 180,
  expiration: "2026-09-18",
  contracts: -2,
};

describe("rollLegs", () => {
  it("buys back a short and sells the target, same size, at the given prices", () => {
    const [close, open] = rollLegs(
      heldShortCall,
      { strike: 190, expiration: "2026-10-16" },
      { close: 4.3, open: 5.1 },
    );
    expect(close).toEqual({
      underlying: "NVDA",
      optionType: "call",
      strike: 180,
      expiration: "2026-09-18",
      action: "buy",
      contracts: 2,
      limitPrice: 4.3,
    });
    expect(open).toEqual({
      underlying: "NVDA",
      optionType: "call",
      strike: 190,
      expiration: "2026-10-16",
      action: "sell",
      contracts: 2,
      limitPrice: 5.1,
    });
  });

  it("sells a long to close and buys the target, leaving a leg unpriced when no price was given", () => {
    const [close, open] = rollLegs(
      { ...heldShortCall, type: "put", contracts: 1 },
      { strike: 175, expiration: "2026-10-16" },
      { open: 2.2 },
    );
    expect(close).toMatchObject({ action: "sell", contracts: 1, optionType: "put" });
    expect(close).not.toHaveProperty("limitPrice");
    expect(open).toMatchObject({ action: "buy", strike: 175, limitPrice: 2.2 });
  });

  it("names the honest side of the quote for each leg", () => {
    expect(rollPriceSides(true)).toEqual({ close: "ask", open: "bid" });
    expect(rollPriceSides(false)).toEqual({ close: "bid", open: "ask" });
  });
});
