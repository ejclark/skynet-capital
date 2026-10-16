import {
  band,
  clusterCount,
  ddBucket,
  drawdowns,
  episodesOf,
  LOW_HORIZON,
  outcomeAt,
  perEpisode,
  pricePhase,
  printOverlay,
  rankQuantile,
  sectorFlag,
  vixBucket,
  WARMUP,
} from "../../scripts/research/cycle-phase-math.mjs";

/**
 * The cycle-phase detector's classifier and outcome reducers (#5482 slice 1, the swing study).
 * Specified against constructed series with known answers: the failure these exist to prevent is a
 * floor or recovery band that reads confident because a reducer quietly dropped the episodes that
 * never recovered, or a phase label that drifted from the rules written in the script header.
 */

describe("ddBucket", () => {
  it("puts a drawdown exactly on an edge in the deeper bucket", () => {
    expect(ddBucket(0)).toBe(0);
    expect(ddBucket(-0.029)).toBe(0);
    expect(ddBucket(-0.03)).toBe(1);
    expect(ddBucket(-0.1)).toBe(2); // the pullback line: ≤ −10% is a pullback, and so is its bucket
    expect(ddBucket(-0.414)).toBe(4);
    expect(ddBucket(-0.6)).toBe(5);
  });
});

describe("vixBucket", () => {
  it("splits calm / elevated / fear at 20 and 25, and refuses to guess a missing VIX", () => {
    expect(vixBucket(16.1)).toBe("calm");
    expect(vixBucket(20)).toBe("elevated");
    expect(vixBucket(25)).toBe("fear");
    expect(vixBucket(null)).toBeNull();
  });
});

describe("drawdowns", () => {
  it("has no reading before the warm-up, then measures from the trailing 60-session high", () => {
    const closes = [...Array.from({ length: WARMUP }, () => 100), 120, 90];
    const dd = drawdowns(closes);
    expect(dd[WARMUP - 1]).toBeNull();
    expect(dd[WARMUP]).toEqual({ high: 120, dd: 0, sinceHigh: 0 });
    expect(dd[WARMUP + 1]?.dd).toBeCloseTo(-0.25, 12);
    expect(dd[WARMUP + 1]?.sinceHigh).toBe(1);
  });

  it("forgets a high once it leaves the 60-session window", () => {
    const closes = [200, ...Array.from({ length: 80 }, () => 100)];
    expect(drawdowns(closes).at(-1)?.dd).toBe(0);
  });
});

describe("sectorFlag", () => {
  it("is unknown with fewer than two peers carrying data", () => {
    expect(sectorFlag([-0.3, null, undefined]).wide).toBeNull();
  });
  it("calls it sector-wide when at least half the known peers are 10% off", () => {
    expect(sectorFlag([-0.15, -0.02, null])).toEqual({ off: 1, of: 2, wide: true });
    expect(sectorFlag([-0.15, -0.02, -0.05]).wide).toBe(false);
  });
});

describe("pricePhase", () => {
  const base = { ddMinRecent: 0, ret20: 0, wide: false };
  it("names a 10% drawdown a pullback, scoped by the peers", () => {
    expect(pricePhase({ ...base, dd: -0.41, ddMinRecent: -0.41, wide: true })).toBe(
      "pullback (sector-wide)",
    );
    expect(pricePhase({ ...base, dd: -0.12, ddMinRecent: -0.12 })).toBe("pullback (single-name)");
  });
  it("names a climb back above −10% after a deeper dip a recovery", () => {
    expect(pricePhase({ ...base, dd: -0.06, ddMinRecent: -0.15 })).toBe("recovery");
  });
  it("tells a run-up from merely sitting near the high", () => {
    expect(pricePhase({ ...base, dd: -0.01, ret20: 0.12 })).toBe("run-up");
    expect(pricePhase({ ...base, dd: -0.01, ret20: 0.02 })).toBe("near high");
  });
  it("keeps the peer scope on a shallow pullback", () => {
    expect(pricePhase({ ...base, dd: -0.095, ddMinRecent: -0.095, wide: true })).toBe(
      "shallow pullback (sector-wide)",
    );
  });
});

describe("printOverlay", () => {
  it("flags the two weeks before a print and the two weeks after one", () => {
    expect(printOverlay({ toNext: 10, sinceLast: 50 })).toBe("pre-print");
    expect(printOverlay({ toNext: 40, sinceLast: 3 })).toBe("post-print drift");
    expect(printOverlay({ toNext: 16, sinceLast: 47 })).toBeNull();
  });
});

describe("outcomeAt", () => {
  /** Entry at 100, a slide to 80 at session 5, back to 100 at session 10, flat after. */
  const path = [100, 96, 92, 88, 84, 80, 84, 88, 92, 96, 100];
  const closes = [...path, ...Array.from({ length: 200 }, () => 100)];

  it("reads the further drawdown, the session of the low and the session back to entry", () => {
    const o = outcomeAt(closes, 0, 110, [5]);
    expect(o?.further).toBeCloseTo(-0.2, 12);
    expect(o?.toLow).toBe(5);
    expect(o?.backToEntry).toBe(10);
    expect(o?.at[5]).toBeCloseTo(-0.2, 12);
  });

  it("keeps a recovery that never came as Infinity rather than dropping it", () => {
    expect(outcomeAt(closes, 0, 110)?.backToHigh).toBe(Number.POSITIVE_INFINITY);
    const neverBack = [100, ...Array.from({ length: 150 }, () => 70)];
    expect(outcomeAt(neverBack, 0, 100)?.backToEntry).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns null when the window has not finished", () => {
    expect(outcomeAt(closes, closes.length - LOW_HORIZON, 100)).toBeNull();
  });
});

describe("episodesOf and clusterCount", () => {
  it("joins matching sessions closer than the gap into one episode", () => {
    expect(episodesOf([1, 2, 3, 30, 31, 80], 20)).toEqual([[1, 2, 3], [30, 31], [80]]);
  });
  it("counts one cluster for episodes on different names in the same sell-off", () => {
    const ranges = [
      { start: "2018-11-15", end: "2018-12-03" },
      { start: "2018-11-26", end: "2018-11-26" },
      { start: "2019-06-03", end: "2019-06-03" },
    ];
    expect(clusterCount(ranges)).toBe(2);
  });
});

describe("rankQuantile, band and perEpisode", () => {
  it("returns a real member of a censored sample, never NaN", () => {
    const xs = [10, 20, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    expect(rankQuantile(xs, 0.5)).toBe(20);
    expect(rankQuantile(xs, 0.75)).toBe(Number.POSITIVE_INFINITY);
  });
  it("weights a long episode the same as a short one", () => {
    const eps = [[{ v: -0.1 }, { v: -0.1 }, { v: -0.1 }, { v: -0.1 }], [{ v: -0.3 }]];
    expect(perEpisode(eps, (o) => o.v)).toEqual([-0.1, -0.3]);
    expect(band(perEpisode(eps, (o) => o.v))?.p50).toBeCloseTo(-0.2, 12);
  });
  it("has no band for an empty sample", () => {
    expect(band([])).toBeNull();
  });
});
