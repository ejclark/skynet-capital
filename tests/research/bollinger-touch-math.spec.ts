import { bands, summarize, touchEvents } from "../../scripts/research/bollinger-touch-math.mjs";
import { bollingerBands } from "../../src/indicators/bollinger.js";

/** Candidate 1's price-only control (#4808 slice 3), specified on constructed series. */

const bar = (i: number, close: number) => ({
  date: `2026-01-${String(i + 1).padStart(2, "0")}`,
  close,
});
const flatThen = (tail: number[]) => [...Array(20).fill(100), ...tail].map((c, i) => bar(i, c));

describe("bands", () => {
  it("equals src/indicators/bollinger.ts, so the script's port cannot drift from it", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + 7 * Math.sin(i / 3) + i * 0.2);
    const ours = bands(closes);
    const theirs = bollingerBands(closes);
    expect(ours).toHaveLength(theirs.length);
    ours.forEach((b, i) => {
      const t = theirs[i];
      if (!t) {
        expect(b).toBeUndefined();
        return;
      }
      expect(b?.middle).toBeCloseTo(t.middle, 9);
      expect(b?.upper).toBeCloseTo(t.upper, 9);
      expect(b?.lower).toBeCloseTo(t.lower, 9);
    });
  });
});

describe("touchEvents", () => {
  it("marks a close above the upper band and reads the next horizon's return", () => {
    const events = touchEvents(flatThen([110, 120, 121]), { horizon: 2 });
    expect(events).toEqual([
      { date: "2026-01-21", side: "upper", forwardPct: expect.closeTo(10, 6) },
    ]);
  });

  it("does not count a flat window's zero-width bands as an edge", () => {
    expect(touchEvents(flatThen([100, 100, 100]), { horizon: 1 })).toEqual([]);
  });

  it("marks a close below the lower band", () => {
    const [event] = touchEvents(flatThen([90, 90, 90]), { horizon: 1 });
    expect(event?.side).toBe("lower");
  });

  it("leaves out a touch with no full horizon after it, rather than guessing", () => {
    expect(touchEvents(flatThen([110]), { horizon: 5 })).toEqual([]);
  });

  it("nets the benchmark's move over the same dates", () => {
    const series = flatThen([110, 121]);
    const benchmark = series.map((b, i) => ({ date: b.date, close: i === 21 ? 105 : 100 }));
    const [event] = touchEvents(series, { horizon: 1, benchmark });
    expect(event?.forwardPct).toBeCloseTo(10 - 5, 6);
  });
});

describe("summarize", () => {
  it("counts and averages one side, and is zero for an empty one", () => {
    const events = [
      { date: "a", side: "upper" as const, forwardPct: 2 },
      { date: "b", side: "upper" as const, forwardPct: 4 },
      { date: "c", side: "lower" as const, forwardPct: -1 },
    ];
    expect(summarize(events, "upper")).toEqual({ n: 2, meanPct: 3 });
    expect(summarize(events)).toEqual({ n: 3, meanPct: 5 / 3 });
    expect(summarize([], "lower")).toEqual({ n: 0, meanPct: 0 });
  });
});
