import { allocationOf } from "../../src/observatory/desk-allocation.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/** Where the money is (#3689 slice 5), and a sold option owned up to rather than read as $0 (#4948). */

const snapshot = (positions: ParticipantSnapshot["positions"], cash = 10_000) =>
  ({
    id: "wheel",
    displayName: "Wheel",
    kind: "bot",
    cash,
    equity: cash,
    positions,
    activity: [],
  }) satisfies ParticipantSnapshot;

// A cash-secured put: one contract written, marked at $3.10 → a $310 buy-back liability.
const soldPut = {
  symbol: "AAPL261120P00240000",
  quantity: -1,
  avgPrice: 4.2,
  marketValue: -310,
};
const heldCall = {
  symbol: "NVDA261218C00130000",
  quantity: 2,
  avgPrice: 7.85,
  marketValue: 1_800,
};

describe("allocationOf", () => {
  it("names a sold option's liability instead of reading 'Options $0'", () => {
    const allocation = allocationOf(snapshot([soldPut]));
    expect(allocation.optionsSold).toBe("-$310");
    // The bar still can't draw a negative slice: options take none of it, cash all of it.
    expect(allocation.optionsPct).toBe(0);
    expect(allocation.cashPct).toBeCloseTo(100, 10);
  });

  it("keeps held and sold options apart when the book has both", () => {
    const allocation = allocationOf(snapshot([heldCall, soldPut]));
    expect(allocation).toMatchObject({ options: "$1,800", optionsSold: "-$310" });
    expect(allocation.sharesPct + allocation.optionsPct + allocation.cashPct).toBeCloseTo(100, 10);
  });

  it("still names a written contract whose mark is 0, and never reads '-$0'", () => {
    expect(allocationOf(snapshot([{ ...soldPut, marketValue: 0 }])).optionsSold).toBe("$0");
    expect(allocationOf(snapshot([{ ...soldPut, marketValue: -0.3 }])).optionsSold).toBe("$0");
  });

  it("carries no sold line while nothing is written", () => {
    expect(allocationOf(snapshot([heldCall])).optionsSold).toBeUndefined();
    expect(allocationOf(snapshot([])).optionsSold).toBeUndefined();
  });

  it("leaves a short stock out of the sold-options line — it is not an option", () => {
    const allocation = allocationOf(
      snapshot([{ symbol: "TSLA", quantity: -10, avgPrice: 400, marketValue: -4_000 }]),
    );
    expect(allocation.optionsSold).toBeUndefined();
    expect(allocation.shareCount).toBe(-10);
  });
});
