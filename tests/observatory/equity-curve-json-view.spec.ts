import { equityCurveView } from "../../src/observatory/equity-curve-json-view.js";

describe("equityCurveView", () => {
  it("normalizes equity to a % return series from base_value", () => {
    const view = equityCurveView({
      timestamp: [1_700_000_000, 1_700_086_400, 1_700_172_800],
      equity: [100_000, 105_000, 98_000],
      profit_loss: [0, 5_000, -2_000],
      profit_loss_pct: [0, 0.05, -0.02],
      base_value: 100_000,
    });

    expect(view.points).toHaveLength(3);
    expect(view.points[0]).toMatchObject({ value: 0 });
    expect(view.points[1]?.value).toBeCloseTo(0.05, 10);
    expect(view.points[2]?.value).toBeCloseTo(-0.02, 10);
  });

  it("converts each Alpaca epoch-seconds timestamp to an ISO instant", () => {
    const view = equityCurveView({
      timestamp: [1_700_000_000],
      equity: [100_000],
      profit_loss: [0],
      profit_loss_pct: [0],
      base_value: 100_000,
    });

    expect(view.points[0]?.t).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("skips a null equity entry rather than zero-filling a gap", () => {
    const view = equityCurveView({
      timestamp: [1, 2, 3],
      equity: [100_000, null, 102_000],
      profit_loss: [0, 0, 2_000],
      profit_loss_pct: [0, 0, 0.02],
      base_value: 100_000,
    });

    expect(view.points).toHaveLength(2);
    expect(view.points.map((p) => p.t)).not.toContain(new Date(2000).toISOString());
  });

  it("returns no points when base_value is absent — never a divide-by-nothing guess", () => {
    expect(
      equityCurveView({
        timestamp: [1],
        equity: [100_000],
        profit_loss: [0],
        profit_loss_pct: [0],
        base_value: null,
      }).points,
    ).toEqual([]);
  });

  it("returns no points for an undefined history — the honest empty, not a throw", () => {
    expect(equityCurveView(undefined).points).toEqual([]);
  });
});
