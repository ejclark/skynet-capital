import {
  type Bar,
  dropDays,
  episodes,
  exitGrid,
  exitTrade,
  independentWindows,
  isPrintReaction,
  matchedDownDays,
  ruleLabel,
  summarize,
} from "../../scripts/research/drop-exit-math.mjs";

/**
 * The drop-exit study's pure half (#6950). The failures these exist to prevent: a daily bar that
 * touches both levels read as a win, a gap through the stop filled at the stop instead of the
 * open, five days of one sell-off counted as five observations, and a control that quietly
 * includes the drops it is meant to be compared against.
 */

const bar = (date: string, open: number, high: number, low: number, close: number): Bar => ({
  date,
  open,
  high,
  low,
  close,
});

describe("dropDays", () => {
  it("keeps a close down at least the threshold, and nothing shallower", () => {
    const px = [
      bar("2026-11-02", 100, 100, 100, 100),
      bar("2026-11-03", 100, 100, 92, 93), // −7%
      bar("2026-11-04", 93, 93, 87, 87.5), // −5.9%
      bar("2026-11-05", 87.5, 88, 80, 81), // −7.4%
    ];
    expect(dropDays(px, 0.07)).toEqual([1, 3]);
    expect(dropDays(px, 0.05)).toEqual([1, 2, 3]);
  });
});

describe("episodes", () => {
  it("chains drops within the gap of the previous drop into one episode", () => {
    expect(episodes([5, 9, 18, 40], 10)).toEqual([
      { first: 5, members: [5, 9, 18] },
      { first: 40, members: [40] },
    ]);
  });

  it("starts a new episode one session past the gap", () => {
    expect(episodes([5, 16], 10).map((e) => e.first)).toEqual([5, 16]);
  });
});

describe("exitTrade", () => {
  const entry = bar("2026-11-05", 100, 100, 90, 100);

  it("takes profit at the level when the high reaches it", () => {
    const px = [entry, bar("2026-11-06", 101, 106, 99, 102)];
    expect(exitTrade(px, 0, { tp: 0.05, stop: null, hold: 1 })).toEqual({
      exit: "tp",
      ret: expect.closeTo(5, 9),
      at: 1,
    });
  });

  it("fills a gap up through the take-profit at the open, above the level", () => {
    const px = [entry, bar("2026-11-06", 107, 108, 104, 105)];
    expect(exitTrade(px, 0, { tp: 0.05, stop: null, hold: 1 })?.ret).toBeCloseTo(7, 9);
  });

  it("fills a gap down through the stop at the open, below the level", () => {
    const px = [entry, bar("2026-11-06", 90, 96, 89, 95)];
    expect(exitTrade(px, 0, { tp: 0.05, stop: 0.05, hold: 5 })).toEqual({
      exit: "stop",
      ret: expect.closeTo(-10, 9),
      at: 1,
    });
  });

  it("counts a session touching both levels as the stop", () => {
    const px = [entry, bar("2026-11-06", 100, 106, 94, 101)];
    expect(exitTrade(px, 0, { tp: 0.05, stop: 0.05, hold: 5 })?.exit).toBe("stop");
  });

  it("exits at the last session's close when no level is hit", () => {
    const px = [entry, bar("2026-11-06", 100, 102, 98, 101), bar("2026-11-09", 101, 103, 99, 102)];
    expect(exitTrade(px, 0, { tp: 0.05, stop: 0.05, hold: 2 })).toEqual({
      exit: "time",
      ret: expect.closeTo(2, 9),
      at: 2,
    });
  });

  it("returns null when the series ends before the hold does", () => {
    const px = [entry, bar("2026-11-06", 100, 102, 98, 101)];
    expect(exitTrade(px, 0, { tp: null, stop: null, hold: 5 })).toBeNull();
  });
});

describe("summarize", () => {
  it("reports how often it paid, the median, the worst decile and the order levels hit", () => {
    const s = summarize([
      { exit: "tp", ret: 5 },
      { exit: "stop", ret: -8 },
      { exit: "time", ret: 1 },
      { exit: "time", ret: -1 },
    ]);
    expect(s.n).toBe(4);
    expect(s.hit).toBe(0.5);
    expect(s.median).toBe(0);
    expect(s.p10).toBeCloseTo(-5.9, 9);
    expect([s.tp, s.stop, s.time]).toEqual([0.25, 0.25, 0.5]);
  });

  it("is NaN, not a throw, on no trades", () => {
    expect(summarize([]).median).toBeNaN();
  });
});

describe("matchedDownDays", () => {
  it("takes the same month's down days and never a qualifying drop or the day itself", () => {
    const px = [
      bar("2026-10-30", 100, 100, 100, 100),
      bar("2026-11-02", 100, 100, 99, 99), // down, same month → kept
      bar("2026-11-03", 99, 101, 99, 100), // up → not a down day
      bar("2026-11-04", 100, 100, 90, 92), // the drop itself
      bar("2026-11-05", 92, 92, 80, 84), // another qualifying drop → excluded
      bar("2026-12-01", 84, 84, 83, 83), // down, other month → excluded
    ];
    expect(matchedDownDays(px, 3, new Set([3, 4]))).toEqual([1]);
  });
});

describe("isPrintReaction", () => {
  const px = [
    bar("2026-11-09", 1, 1, 1, 1),
    bar("2026-11-10", 1, 1, 1, 1),
    bar("2026-11-11", 1, 1, 1, 1),
  ];

  it("flags the session of a pre-open filing and the one after an after-close filing", () => {
    expect(isPrintReaction(px, 1, ["2026-11-10"])).toBe(true);
    expect(isPrintReaction(px, 2, ["2026-11-10"])).toBe(true);
  });

  it("leaves a session two away from the filing alone", () => {
    expect(isPrintReaction(px, 2, ["2026-11-09"])).toBe(false);
  });
});

describe("independentWindows", () => {
  it("counts an entry only once the previous hold has run out", () => {
    expect(independentWindows([0, 30, 70, 130], 63)).toBe(2);
    expect(independentWindows([0, 30, 70, 130], 1)).toBe(4);
  });
});

describe("the grid", () => {
  it("is every take-profit × stop × hold, 48 rules", () => {
    const grid = exitGrid();
    expect(grid).toHaveLength(48);
    expect(grid.map(ruleLabel)[0]).toBe("no TP / no stop / 1d");
    expect(ruleLabel({ tp: 0.05, stop: 0.08, hold: 63 })).toBe("+5% / −8% / 63d");
  });
});
