import { freshBandProblem, freshBookProblem } from "../../src/adapters/alpaca-option-preflight.js";
import type { ContractSnapshot } from "../../src/alpaca/alpaca-options-client.js";
import type { OptionOrderIntent, OrderIntent } from "../../src/domain/types.js";
import { anOptionIntent, aPortfolio, aPosition } from "../support/builders.js";

// The order flow's last re-check before sending, on positions and quotes read moments ago. It runs
// the guards' own cover check (`worsens`) and band rule (`limitInsideBand`), so the two can never
// disagree about one order.
const PUT = "CRWV261106P00085000";
const CALL = "CRWV261106C00100000";
const C90 = "CRWV261106C00090000";
const C95 = "CRWV261106C00095000";
const C105 = "CRWV261106C00105000";
const NOW = Date.parse("2026-10-07T15:00:00Z");

const buyBack = (occSymbol: string): OrderIntent =>
  anOptionIntent({
    side: "buy",
    playbookId: undefined,
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol, side: "buy", ratio: 1 }],
      limitPrice: 1.7,
    },
  });
const optionOf = (intent: OrderIntent): OptionOrderIntent => intent.option as OptionOrderIntent;

describe("freshBookProblem — the guards' cover check on fresh positions", () => {
  it("refuses a buy-back paid out of the cash another sold put stands on", () => {
    const wheel = (cash: number) =>
      aPortfolio({
        cash,
        positions: [
          aPosition({ symbol: "CRWV", quantity: 100 }),
          aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 }),
          aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
        ],
      });
    const close = buyBack(CALL);
    expect(freshBookProblem(close, optionOf(close), wheel(8_500))).toBe(
      "that cash is set aside to secure a sold put",
    );
    expect(freshBookProblem(close, optionOf(close), wheel(8_670))).toBeUndefined();
    // Buying back the put frees its own collateral: never refused for its premium.
    const putClose = buyBack(PUT);
    expect(freshBookProblem(putClose, optionOf(putClose), wheel(8_500))).toBeUndefined();
  });

  it("refuses a covered call that would lean on a long call above it the cash cannot pay the width of", () => {
    const lot = aPortfolio({
      cash: 0,
      positions: [
        aPosition({ symbol: "CRWV", quantity: 100 }),
        aPosition({ symbol: C90, quantity: -1, avgPrice: 2 }),
        aPosition({ symbol: C105, quantity: 1, avgPrice: 1 }),
      ],
    });
    const call = anOptionIntent({
      option: {
        structure: "covered-call",
        legs: [{ occSymbol: C95, side: "sell", ratio: 1 }],
        limitPrice: 1.7,
      },
    });
    expect(freshBookProblem(call, optionOf(call), lot)).toBe("insufficient cash");
  });
});

describe("freshBandProblem — the guards' band rule on fresh quotes", () => {
  const quoted = (snapshot: ContractSnapshot) => new Map([[PUT, snapshot]]);
  const open = optionOf(anOptionIntent());
  const close = optionOf(buyBack(PUT));
  const MAX_AGE = 15 * 60_000;

  it("holds an open to the feed's stamp, never a close", () => {
    const old = quoted({ bid: 2, ask: 2.2, quotedAt: "2026-10-07T14:40:00Z" });
    expect(freshBandProblem(open, old, NOW, MAX_AGE)).toBe(`the quote on ${PUT} is stale`);
    expect(freshBandProblem({ ...close, limitPrice: 2.1 }, old, NOW, MAX_AGE)).toBeUndefined();
  });

  it("an inverted quote prices nothing", () => {
    const inverted = quoted({ bid: 2.2, ask: 2, quotedAt: "2026-10-07T14:59:00Z" });
    expect(freshBandProblem(open, inverted, NOW, MAX_AGE)).toBe(
      `no fresh two-sided quote on ${PUT}`,
    );
  });
});
