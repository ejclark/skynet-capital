import type { Bar } from "../../src/live/bars";
import {
  bollingerPoints,
  computeStudies,
  EMA_PERIOD,
  indexStudiesByDay,
  linePoints,
  STUDY_GLOSS,
  studyCell,
  toggleStudy,
} from "../../src/shell/chart-studies";

/**
 * The studies' pure layer (#2017 Phase 1 chart build-out, the studies slice) — specced WITHOUT
 * mounting a chart, per `docs/ENGINEERING.md`'s gotcha: bars → the four indicator series, the
 * sparse points a line series draws (no point where the window isn't full — never a placeholder),
 * the day-keyed readings the legend looks up, and the `—` the legend prints for an absent one.
 */

const bar = (t: string, c: number): Bar => ({ t, o: c - 1, h: c + 1, l: c - 2, c, v: 1000 });

/** 25 trading days, closes climbing by 1 — enough for a 20-window to fill on the last six. */
const bars: Bar[] = Array.from({ length: 25 }, (_, i) =>
  bar(`2026-08-${String(1 + i).padStart(2, "0")}T00:00:00Z`, 100 + i),
);

describe("computeStudies", () => {
  const studies = computeStudies(bars);

  it("hands back one entry per bar for every study, in bar order", () => {
    expect(studies.sma).toHaveLength(bars.length);
    expect(studies.ema).toHaveLength(bars.length);
    expect(studies.bollinger).toHaveLength(bars.length);
    expect(studies.rsi).toHaveLength(bars.length);
  });

  it("leaves the early bars absent exactly where each window isn't full yet", () => {
    expect(studies.sma[18]).toBeUndefined();
    expect(studies.sma[19]).toBeCloseTo(109.5);
    expect(studies.ema[EMA_PERIOD - 2]).toBeUndefined();
    expect(studies.ema[EMA_PERIOD - 1]).toBeDefined();
    expect(studies.bollinger[18]).toBeUndefined();
    expect(studies.bollinger[19]?.middle).toBeCloseTo(109.5);
    expect(studies.rsi[13]).toBeUndefined();
    // Every delta is an up-move, so RSI's "no losses" branch answers 100 — a real value, not a fill.
    expect(studies.rsi[14]).toBe(100);
  });
});

describe("linePoints", () => {
  const three = [bar("2026-09-01", 10), bar("2026-09-02", 11), bar("2026-09-03T00:00:00Z", 12)];

  it("skips every index whose value is absent, never emitting a placeholder point", () => {
    expect(linePoints(three, [undefined, 5.5, undefined])).toEqual([
      { time: "2026-09-02", value: 5.5 },
    ]);
  });

  it("keys each point by business day, folding a timestamp to its date", () => {
    expect(linePoints(three, [1, 2, 3])).toEqual([
      { time: "2026-09-01", value: 1 },
      { time: "2026-09-02", value: 2 },
      { time: "2026-09-03", value: 3 },
    ]);
  });

  it("maps a fully-absent series to no points at all", () => {
    expect(linePoints(three, [undefined, undefined, undefined])).toEqual([]);
  });
});

describe("bollingerPoints", () => {
  it("splits the bands into three sparse lines on the same skip rule", () => {
    const two = [bar("2026-09-01", 10), bar("2026-09-02", 11)];
    const points = bollingerPoints(two, [undefined, { upper: 13, middle: 11, lower: 9 }]);
    expect(points.upper).toEqual([{ time: "2026-09-02", value: 13 }]);
    expect(points.middle).toEqual([{ time: "2026-09-02", value: 11 }]);
    expect(points.lower).toEqual([{ time: "2026-09-02", value: 9 }]);
  });
});

describe("indexStudiesByDay / studyCell", () => {
  const studies = computeStudies(bars);
  const readings = indexStudiesByDay(bars, studies);

  it("finds a day's readings by the same key the bar index uses", () => {
    const last = readings.get("2026-08-25");
    expect(last?.sma).toBeCloseTo(114.5);
    expect(last?.bollinger?.middle).toBeCloseTo(114.5);
    expect(last?.rsi).toBe(100);
    expect(readings.get("2026-08-26")).toBeUndefined();
  });

  it("prints `—` for an absent reading rather than a number nobody computed", () => {
    const early = readings.get("2026-08-01");
    expect(studyCell("sma", early)).toBe("—");
    expect(studyCell("ema", early)).toBe("—");
    expect(studyCell("bollinger", early)).toBe("—");
    expect(studyCell("rsi", early)).toBe("—");
    expect(studyCell("sma", undefined)).toBe("—");
  });

  it("formats a present reading per study: cents for prices, one decimal for RSI, three bands", () => {
    const reading = {
      sma: 181.2,
      ema: 180.951,
      bollinger: { upper: 183.1, middle: 181, lower: 178.9 },
      rsi: 58.333,
    };
    expect(studyCell("sma", reading)).toBe("181.20");
    expect(studyCell("ema", reading)).toBe("180.95");
    expect(studyCell("bollinger", reading)).toBe("183.10 / 181.00 / 178.90");
    expect(studyCell("rsi", reading)).toBe("58.3");
  });
});

describe("toggleStudy", () => {
  it("adds, then removes, handing back a new set each time", () => {
    const none = new Set<never>();
    const one = toggleStudy(none, "sma");
    expect([...one]).toEqual(["sma"]);
    expect(one).not.toBe(none);
    const two = toggleStudy(one, "rsi");
    expect([...two].sort()).toEqual(["rsi", "sma"]);
    expect([...toggleStudy(two, "sma")]).toEqual(["rsi"]);
    expect([...one]).toEqual(["sma"]);
  });
});

describe("STUDY_GLOSS", () => {
  it("is the indicators' own copy, verbatim", () => {
    expect(STUDY_GLOSS.rsi).toMatch(/^momentum on a 0-100 scale/);
    expect(STUDY_GLOSS.bollinger).toMatch(/normal recent range/);
  });
});
