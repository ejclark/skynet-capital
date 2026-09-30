import type { ProbeRetro } from "../../src/playbooks/cond-scout-retro.js";
import {
  hypothesisVerdicts,
  MIN_CLOSES_FOR_VERDICT,
  outlierIds,
} from "../../src/playbooks/cond-scout-verdict.js";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 8, 1, 20, 0);

/** A seeded generator so bootstrap bands are deterministic. */
function seeded(seed = 7): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function retro(i: number, roi: number, over: Partial<ProbeRetro> = {}): ProbeRetro {
  return {
    probeId: `P${i}`,
    symbol: "AMD",
    hypothesis: "oversold-rebound",
    condition: "oversold",
    reason: "horizon",
    openedAt: T0 + i * DAY,
    closedAt: T0 + (i + 5) * DAY, // one close per day, so the bootstrap sees distinct days
    daysHeld: 5,
    roi,
    roiPerDay: roi / 5,
    directionRight: roi > 0,
    bestMarkRoi: roi,
    worstMarkRoi: roi,
    snapshotCount: 0,
    earlierExits: [],
    soonerWasBetter: false,
    entryPrice: 100,
    laterExits: [],
    ...over,
  };
}

describe("hypothesisVerdicts", () => {
  it("stays unproven below the minimum sample, however good the numbers look", () => {
    const [v] = hypothesisVerdicts(
      Array.from({ length: MIN_CLOSES_FOR_VERDICT - 1 }, (_, i) => retro(i, 0.05)),
      seeded(),
    );
    expect(v?.call).toBe("unproven");
    expect(v?.winRate).toBe(1);
  });

  it("calls an edge only when the whole band clears zero", () => {
    const wins = Array.from({ length: 14 }, (_, i) => retro(i, 0.02 + (i % 3) * 0.005));
    expect(hypothesisVerdicts(wins, seeded())[0]?.call).toBe("edge");
    const mixed = Array.from({ length: 14 }, (_, i) => retro(i, i % 2 === 0 ? 0.03 : -0.03));
    expect(hypothesisVerdicts(mixed, seeded())[0]?.call).toBe("no edge shown");
    const losses = Array.from({ length: 14 }, (_, i) => retro(i, -0.02 - (i % 3) * 0.005));
    expect(hypothesisVerdicts(losses, seeded())[0]?.call).toBe("losing");
  });

  it("names an outlier and says when the edge rests on it", () => {
    const flat = Array.from({ length: 13 }, (_, i) => retro(i, i % 2 === 0 ? 0.004 : -0.003));
    const withLuck = [...flat, retro(13, 0.9)];
    expect(outlierIds(withLuck)).toEqual(["P13"]);
    const [v] = hypothesisVerdicts(withLuck, seeded());
    expect(v?.outliers).toEqual(["P13"]);
    expect(v?.callWithoutOutliers).not.toBe("edge");
  });

  it("reports excess over the market only across closes whose benchmark is filled", () => {
    const [v] = hypothesisVerdicts(
      [
        retro(0, 0.05, { market: { symbol: "SPY", roi: 0.02, excess: 0.03 } }),
        retro(1, 0.01, { market: { symbol: "SPY", roi: 0.03, excess: -0.02 } }),
        retro(2, 0.04),
      ],
      seeded(),
    );
    expect(v?.benchmarked).toBe(2);
    expect(v?.meanExcessVsMarket).toBeCloseTo(0.005, 6);
  });

  it("keeps each hypothesis separate — two different bets are never averaged together", () => {
    const verdicts = hypothesisVerdicts(
      [retro(0, 0.05), retro(1, -0.02, { hypothesis: "trend-continuation", probeId: "T1" })],
      seeded(),
    );
    expect(verdicts.map((v) => [v.hypothesis, v.closes])).toEqual([
      ["oversold-rebound", 1],
      ["trend-continuation", 1],
    ]);
  });
});
