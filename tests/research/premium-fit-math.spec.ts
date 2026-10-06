import {
  addDays,
  annualizedVol,
  daysBetween,
  forwardReturns,
  forwardVols,
  logReturns,
  percentileRank,
  printCadence,
  printMoves,
  quantile,
  shareBelow,
  straddlesPrint,
  trailingVol,
  volPersistence,
} from "../../scripts/research/premium-fit-math.mjs";

/**
 * The reducers behind the premium-fit instrument (#4469 slice 1) — the study that decides whether
 * a symbol belongs on a premium-selling playbook and on what settings.
 *
 * These are specified against CONSTRUCTED series with known answers rather than market fixtures,
 * because the properties that matter are arithmetic ones: a constant series has zero volatility, a
 * doubling drift must not be booked AS volatility, an unsorted sample must not be reordered under
 * the caller. The one failure these exist to prevent is a confident-looking fit verdict computed
 * off a reducer that was quietly wrong — a stand-aside wrongly rendered as "fits" is a symbol a
 * subscriber then sells premium on.
 */

/** A bar series from a list of closes, dated consecutively (dates are labels here, not inputs). */
const barsOf = (closes: number[]) =>
  closes.map((close, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, close }));

describe("logReturns", () => {
  it("returns one fewer value than bars, as log ratios", () => {
    const r = logReturns(barsOf([100, 110, 99]));
    expect(r).toHaveLength(2);
    expect(r[0]).toBeCloseTo(Math.log(1.1), 12);
    expect(r[1]).toBeCloseTo(Math.log(0.9), 12);
  });

  it("refuses a non-positive close rather than emitting NaN", () => {
    expect(() => logReturns(barsOf([100, 0]))).toThrow(/non-positive close/);
  });
});

describe("annualizedVol", () => {
  it("is zero for a perfectly steady compounder", () => {
    // A series rising exactly 1% a day has constant log returns: motion, but no dispersion.
    const closes = Array.from({ length: 30 }, (_, i) => 100 * 1.01 ** i);
    expect(annualizedVol(logReturns(barsOf(closes)))).toBeCloseTo(0, 10);
  });

  it("scales a known daily dispersion by sqrt(252), with Bessel's correction", () => {
    // Alternating ±1% log moves about a zero mean. The sample sd (n−1) is 1% × sqrt(n/(n−1)), so
    // the annualized figure carries that correction — pinned here so the n−1 denominator can't be
    // silently swapped for n, which would under-report volatility on every short window.
    const n = 50;
    const returns = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0.01 : -0.01));
    expect(annualizedVol(returns)).toBeCloseTo(0.01 * Math.sqrt(n / (n - 1)) * Math.sqrt(252), 6);
  });

  it("does not book drift as volatility", () => {
    const drifting = Array.from({ length: 50 }, () => 0.02);
    expect(annualizedVol(drifting)).toBeCloseTo(0, 10);
  });

  it("refuses a sample too short to have dispersion", () => {
    expect(() => annualizedVol([0.01])).toThrow(/need ≥2 returns/);
  });
});

describe("trailingVol", () => {
  it("reads only the last `window` returns", () => {
    // A violent first half followed by a dead-flat second half: a 10-day trailing read sees calm.
    const returns = [
      ...Array.from({ length: 20 }, (_, i) => (i % 2 ? 0.1 : -0.1)),
      ...Array(10).fill(0.005),
    ];
    expect(trailingVol(returns, 10)).toBeCloseTo(0, 10);
    expect(trailingVol(returns, 30)).toBeGreaterThan(1);
  });

  it("refuses a window longer than the history", () => {
    expect(() => trailingVol([0.01, 0.02], 10)).toThrow(/history too short/);
  });
});

describe("forwardVols", () => {
  it("emits one overlapping window per possible start", () => {
    expect(forwardVols(Array(10).fill(0.01), 4)).toHaveLength(7);
  });

  it("refuses a horizon with no dispersion to measure", () => {
    expect(() => forwardVols([0.01, 0.02], 1)).toThrow(/horizon must be ≥2/);
  });
});

describe("forwardReturns", () => {
  it("measures close-to-close over the horizon, not day to day", () => {
    const r = forwardReturns(barsOf([100, 110, 121, 133.1]), 2);
    expect(r).toHaveLength(2);
    expect(r[0]).toBeCloseTo(0.21, 10);
  });
});

describe("percentileRank and shareBelow", () => {
  it("rank is the share strictly below", () => {
    expect(percentileRank([1, 2, 3, 4], 3)).toBeCloseTo(0.5, 10);
  });

  it("shareBelow includes the boundary — a strike touched is a strike assigned", () => {
    expect(shareBelow([1, 2, 3, 4], 3)).toBeCloseTo(0.75, 10);
  });

  it("refuses an empty sample rather than returning zero", () => {
    expect(() => percentileRank([], 1)).toThrow(/empty sample/);
    expect(() => shareBelow([], 1)).toThrow(/empty sample/);
  });
});

describe("quantile", () => {
  it("interpolates between neighbours", () => {
    expect(quantile([0, 10], 0.5)).toBeCloseTo(5, 10);
    expect(quantile([0, 10, 20, 30], 0.1)).toBeCloseTo(3, 10);
  });

  it("does not reorder the caller's array", () => {
    const values = [3, 1, 2];
    quantile(values, 0.5);
    expect(values).toEqual([3, 1, 2]);
  });

  it("refuses a q outside [0,1]", () => {
    expect(() => quantile([1, 2], 1.5)).toThrow(/must be in \[0,1\]/);
  });
});

describe("volPersistence", () => {
  it("finds no correlation in a series whose calm carries no information", () => {
    // Deterministic alternating magnitudes: every window has the same dispersion, so a trailing
    // read predicts nothing about the next one beyond what is already constant.
    const returns = Array.from(
      { length: 200 },
      (_, i) => (i % 2 ? 0.01 : -0.01) * (1 + (i % 7) / 10),
    );
    const { correlation, pairs } = volPersistence(returns, 10, 21);
    expect(pairs).toBe(170);
    expect(Math.abs(correlation)).toBeLessThan(0.5);
  });

  it("finds a strong correlation in a series with one genuine regime change", () => {
    const calm = Array.from({ length: 150 }, (_, i) => (i % 2 ? 0.002 : -0.002));
    const wild = Array.from({ length: 150 }, (_, i) => (i % 2 ? 0.08 : -0.08));
    expect(volPersistence([...calm, ...wild], 10, 21).correlation).toBeGreaterThan(0.5);
  });

  it("refuses a series too short to form pairs", () => {
    expect(() => volPersistence(Array(12).fill(0.01), 10, 21)).toThrow(/need ≥3 overlapping pairs/);
  });
});

describe("daysBetween", () => {
  it("counts calendar days across a DST boundary without losing one", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
    expect(daysBetween("2026-10-02", "2026-11-06")).toBe(35);
  });
});

describe("addDays", () => {
  it("walks forward across a month boundary", () => {
    expect(addDays("2026-11-09", 3)).toBe("2026-11-12");
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("refuses an unparseable date rather than returning Invalid Date", () => {
    expect(() => addDays("not-a-date", 1)).toThrow(/unparseable date/);
  });
});

describe("printCadence", () => {
  const prints = ["2025-05-14", "2025-08-12", "2025-11-10", "2026-02-26"];

  it("projects the next print from the median gap, not the last one", () => {
    // A short gap in the middle must not drag the projection in with it.
    const c = printCadence(prints, "2026-03-01");
    expect(c.medianGap).toBe(90);
    expect(c.last).toBe("2026-02-26");
    expect(c.projectedNext).toBe("2026-05-27");
    expect(c.overdue).toBe(false);
  });

  it("rolls a stale projection forward rather than returning a date in the past", () => {
    // The failure this prevents: every downstream print guard filters for dates ahead of today,
    // so a past projection empties the guard and marks every expiry print-clean — which writes a
    // leg straight across a real print. A late filer must fail toward MORE caution.
    const c = printCadence(prints, "2026-09-01");
    expect(c.projectedNext > "2026-09-01").toBe(true);
    expect(c.projectedNext).toBe("2026-11-23");
    expect(c.overdue).toBe(true);
  });

  it("projects strictly ahead of today, never onto today itself", () => {
    expect(printCadence(prints, "2026-05-27").projectedNext).toBe("2026-08-25");
  });

  it("refuses to read a cadence from a single print", () => {
    expect(() => printCadence(["2026-08-11"])).toThrow(/need ≥2 prints/);
  });

  it("refuses a degenerate cadence it could never roll forward", () => {
    expect(() => printCadence(["2026-08-11", "2026-08-11"], "2026-09-01")).toThrow(
      /cannot be projected forward/,
    );
  });
});

describe("printMoves", () => {
  it("scores the first session at or after each print", () => {
    const bars = barsOf([100, 100, 120, 120]);
    const moves = printMoves(bars, ["2026-01-03"]);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ print: "2026-01-03", session: "2026-01-03" });
    expect(moves[0]?.move).toBeCloseTo(0.2, 12);
  });

  it("takes the WORST of the two candidate reaction sessions, not the filing one", () => {
    // EDGAR gives no time of day: an after-close 8-K reacts the next session. Scoring only the
    // filing session here would report +2% on a print that actually cost 20%.
    const bars = barsOf([100, 100, 102, 81.6]);
    const [m] = printMoves(bars, ["2026-01-03"]);
    expect(m?.move).toBeCloseTo(0.02, 10);
    expect(m?.nextMove).toBeCloseTo(-0.2, 10);
    expect(m?.worst).toBeCloseTo(-0.2, 10);
  });

  it("keeps the filing session when the print is the last bar — nextMove is null, not zero", () => {
    const [m] = printMoves(barsOf([100, 110]), ["2026-01-02"]);
    expect(m?.nextMove).toBeNull();
    expect(m?.worst).toBeCloseTo(0.1, 10);
  });

  it("skips a print with no session after it rather than guessing", () => {
    expect(printMoves(barsOf([100, 110]), ["2026-06-01"])).toEqual([]);
  });
});

describe("straddlesPrint", () => {
  it("is true when a print falls inside the leg's life", () => {
    expect(straddlesPrint("2026-10-02", "2026-11-13", ["2026-11-09"])).toBe(true);
  });

  it("is false for a print already behind us, and true for one on expiry day", () => {
    expect(straddlesPrint("2026-10-02", "2026-11-06", ["2026-08-11"])).toBe(false);
    expect(straddlesPrint("2026-10-02", "2026-11-09", ["2026-11-09"])).toBe(true);
  });
});
