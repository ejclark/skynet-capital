import type { DeskActivityEvent } from "../../src/live/desk";
import { type PivotLine, pivotLine, pivotScale, spreadLabels } from "../../src/live/order-pivots";
import { orderPlay } from "../../src/live/order-play";

/** #5262 (#5160 rounds 8–16): the opened order's line names the levels a strategy turns on, what
 *  each stretch of the bar is, and the outcome at expiry either side of the strike — for every kind
 *  of order that has a play, from the contract's arithmetic alone. */

const NOW = new Date("2026-10-08T19:00:00Z");

const order = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "o1",
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
  status: "filled",
  at: "2026-10-06T14:31:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const lineOf = (event: DeskActivityEvent): PivotLine => {
  const play = orderPlay(event, NOW);
  if (!play) throw new Error("expected a play");
  return pivotLine(play);
};

describe("a sold put — the worked example", () => {
  const line = lineOf(order());

  it("pivots on breakeven and the strike, the strike dividing the outcome", () => {
    expect(line.pivots).toEqual([
      { name: "Breakeven", at: 77.45 },
      { name: "Strike", at: 80, divides: true },
    ]);
  });

  it("is a loss below breakeven, the premium up to the strike, and OTM past it", () => {
    expect(line.zones).toEqual([
      { kind: "loss", to: 77.45 },
      { kind: "premium", from: 77.45, to: 80 },
      { kind: "otm", from: 80 },
    ]);
    expect(line.lossGrows).toBe(true);
  });

  it("says what expiry does either side — assigned below, the cash freed above", () => {
    expect(line.atExpiry).toEqual({
      when: "Nov 6",
      below: {
        side: "ITM",
        when: "below $80",
        lines: ["assigned:", "$8,000 buys", "100 CRWV shares"],
      },
      above: { side: "OTM", when: "above $80", lines: ["expires:", "the $8,000", "is freed"] },
    });
  });

  it("scales the cash with the contracts", () => {
    const two = lineOf(order({ quantity: 2, filled: 2 }));
    expect(two.atExpiry?.below.lines).toEqual(["assigned:", "$16,000 buys", "200 CRWV shares"]);
  });
});

describe("the other kinds, on the same rules", () => {
  it("a sold call: OTM below, the premium up to breakeven, the loss past it — ITM on the right", () => {
    const line = lineOf(
      order({ symbol: "NVDA261113C00200000", display: "NVDA $200 CALL", price: "$3.35" }),
    );
    expect(line.zones.map((z) => z.kind)).toEqual(["otm", "premium", "loss"]);
    expect(line.atExpiry?.below).toEqual({
      side: "OTM",
      when: "below $200",
      lines: ["expires:", "no shares", "are sold"],
    });
    expect(line.atExpiry?.above).toEqual({
      side: "ITM",
      when: "above $200",
      lines: ["assigned:", "100 NVDA shares", "sell for $20,000"],
    });
  });

  it("a bought call: a capped loss up to breakeven, profit past it, never a premium", () => {
    const line = lineOf(
      order({ symbol: "NVDA261113C00200000", side: "buy", price: "$3.35", display: "NVDA" }),
    );
    expect(line.zones).toEqual([
      { kind: "loss", to: 203.35 },
      { kind: "profit", from: 203.35 },
    ]);
    expect(line.lossGrows).toBe(false);
    expect(line.atExpiry?.below.lines).toEqual(["expires:", "the $335 paid", "is lost"]);
    expect(line.atExpiry?.above.lines).toEqual(["exercised:", "$20,000 buys", "100 NVDA shares"]);
  });

  it("a bought put: profit below breakeven, a capped loss above it", () => {
    const line = lineOf(order({ side: "buy" }));
    expect(line.zones.map((z) => z.kind)).toEqual(["profit", "loss"]);
    expect(line.atExpiry?.below).toMatchObject({ side: "ITM", when: "below $80" });
    expect(line.atExpiry?.above.lines).toEqual(["expires:", "the $255 paid", "is lost"]);
  });

  it("shares: the fill is the one pivot, and there is no expiry to split", () => {
    const line = lineOf(order({ symbol: "NVDA", display: "NVDA", side: "buy", price: "$226.10" }));
    expect(line.pivots).toEqual([{ name: "Filled", at: 226.1 }]);
    expect(line.zones.map((z) => z.kind)).toEqual(["loss", "profit"]);
    expect(line.atExpiry).toBeUndefined();
  });
});

describe("the axis and its labels", () => {
  it("centres on the strike, wherever now has gone, with every level on the line", () => {
    const line = lineOf(order());
    for (const now of [82.6, 120, 60]) {
      const x = pivotScale(line, now);
      expect(x(80)).toBe(50);
      for (const v of [77.45, now]) {
        expect(x(v)).toBeGreaterThan(0);
        expect(x(v)).toBeLessThan(100);
      }
    }
  });

  it("spreads labels that would touch, keeping their order and the edges", () => {
    expect(spreadLabels([50, 52], 20, 10)).toEqual([41, 61]);
    expect(spreadLabels([5, 50, 95], 20, 10)).toEqual([10, 50, 90]);
    const [a, b, c] = spreadLabels([48, 50, 52], 20, 10) as [number, number, number];
    expect(b - a).toBeGreaterThanOrEqual(19.9);
    expect(c - b).toBeGreaterThanOrEqual(19.9);
  });
});
