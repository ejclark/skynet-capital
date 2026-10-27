import {
  CELLS,
  candidateEvents,
  cellClusters,
  decide,
  everyNth,
  judgeCell,
  nearReport,
  POWER,
  sampleSd,
  surgeSeries,
  yearBefore,
} from "../../scripts/research/optvol-bollinger-math.mjs";
import { CANDIDATES } from "../../src/playbooks/candidates.js";

/**
 * Candidate 1's pre-registered back-test (#4808 slice 3 part 2). What these hold in place: the run
 * cannot read a thin or noisy sample as a kill, an earnings print cannot sit inside either group,
 * and the numbers the script judges by are the ones the candidate declared.
 */

const [first] = CANDIDATES;
const day = (i: number) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
/** 25 quiet sessions around 100, a spike to `spike` on session 25, then `after` sessions back at 100. */
const barsAround = (spike: number, after: number) =>
  Array.from({ length: 25 + 1 + after }, (_, i) => ({
    date: day(i),
    close: i < 25 ? 100 + (i % 2) * 0.1 : i === 25 ? spike : 100,
  }));
const flatQqq = (n: number) => Array.from({ length: n }, (_, i) => ({ date: day(i), close: 100 }));

describe("the numbers the script judges by", () => {
  it("are the ones candidates.ts declared", () => {
    expect(POWER).toEqual(first?.steps.power);
  });
});

describe("nearReport", () => {
  const dates = Array.from({ length: 40 }, (_, i) => day(i));
  it("catches a report within 5 sessions either side of the touch, and the session after it", () => {
    expect(nearReport(dates, 20, [day(20)])).toBe(true);
    expect(nearReport(dates, 20, [day(25)])).toBe(true);
    expect(nearReport(dates, 20, [day(14)])).toBe(true); // reported day 14, priced day 15
    expect(nearReport(dates, 20, [day(26)])).toBe(false);
    expect(nearReport(dates, 20, [day(13)])).toBe(false);
  });

  it("ignores a report past the last session", () => {
    expect(nearReport(dates, 20, ["2030-01-01"])).toBe(false);
  });
});

describe("surgeSeries", () => {
  it("is today's volume over the prior 20 sessions' mean, undefined until they exist", () => {
    const totals = [...Array(20).fill(100), 300, 100];
    const surge = surgeSeries(totals);
    expect(surge[19]).toBeUndefined();
    expect(surge[20]).toBe(3);
  });

  it("never turns a missing day into a zero: a hole in the baseline leaves no surge", () => {
    const totals: (number | undefined)[] = [...Array(21).fill(100), 300];
    totals[5] = undefined;
    expect(surgeSeries(totals)[21]).toBeUndefined();
    expect(surgeSeries(totals)[25 - 3]).toBeUndefined();
  });
});

describe("candidateEvents", () => {
  const series = barsAround(130, 6);
  const bench = flatQqq(series.length);
  const quiet = Array(20).fill(1000);
  const volume = (today: number) => [
    ...Array(5).fill(undefined),
    ...quiet,
    today,
    ...Array(6).fill(1000),
  ];

  it("labels a touch on 3× volume a signal and a touch on ordinary volume a control", () => {
    const loud = candidateEvents(series, bench, volume(3000), []);
    expect(loud.map((e) => [e.side, e.kind])).toEqual([["upper", "signal"]]);
    expect(loud[0]?.forwardPct).toBeCloseTo((100 / 130 - 1) * 100, 5);
    const calm = candidateEvents(series, bench, volume(1000), []);
    expect(calm.map((e) => e.kind)).toEqual(["control"]);
  });

  it("leaves the dead zone between 1.5× and 3× in neither group", () => {
    expect(candidateEvents(series, bench, volume(2000), [])).toEqual([]);
  });

  it("drops a touch with a report in its window, on both sides alike", () => {
    expect(candidateEvents(series, bench, volume(3000), [day(27)])).toEqual([]);
    expect(candidateEvents(series, bench, volume(1000), [day(27)])).toEqual([]);
  });
});

describe("cellClusters", () => {
  const events = [
    { date: "d1", side: "upper", kind: "signal", forwardPct: 3 },
    { date: "d1", side: "upper", kind: "control", forwardPct: 1 },
    { date: "d2", side: "upper", kind: "signal", forwardPct: 2 },
    { date: "d3", side: "lower", kind: "signal", forwardPct: 5 },
    { date: "d3", side: "lower", kind: "control", forwardPct: 1 },
  ] as const;
  const cell = (side: string, direction: string) => {
    const c = CELLS.find((x) => x.side === side && x.direction === direction);
    if (!c) throw new Error("no such cell");
    return c;
  };

  it("is signal minus control per date and side, and needs both on the date", () => {
    expect(
      cellClusters(events, cell("upper", "continuation")).map((c) => [c.date, c.value]),
    ).toEqual([["d1", 2]]);
  });

  it("signs a reversal opposite to a continuation, and the lower band opposite to the upper", () => {
    expect(cellClusters(events, cell("upper", "reversal"))[0]?.value).toBe(-2);
    expect(cellClusters(events, cell("lower", "continuation"))[0]?.value).toBe(-4);
    expect(cellClusters(events, cell("lower", "reversal"))[0]?.value).toBe(4);
  });
});

describe("judgeCell", () => {
  const dates = (n: number, value: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => ({ date: day(i), value: value(i) }));

  it("calls a clear, deep, consistent excess a pass", () => {
    const v = judgeCell(
      dates(200, (i) => 2 + (i % 2)),
      POWER,
    );
    expect(v.outcome).toBe("pass");
  });

  it("re-judges at the observed spread: noisy dates that need more days than we have are underpowered, never a kill", () => {
    // sd ≈ 20%, so 122 days at the declared 4% is nowhere near enough.
    const noisy = dates(150, (i) => (i % 2 ? 22 : -18));
    const v = judgeCell(noisy, POWER);
    expect(v.observedSd).toBeGreaterThan(POWER.sdPct);
    expect(v.sdPct).toBe(v.observedSd);
    expect(v.outcome).toBe("underpowered");
    expect(v.needed).toBeGreaterThan(150);
  });

  it("kills only a powered cell that did not beat its control", () => {
    const v = judgeCell(
      dates(200, (i) => (i % 2 ? 0.2 : -0.2)),
      POWER,
    );
    expect(v.outcome).toBe("kill");
  });

  it("refuses a pass whose newest year turned the other way", () => {
    // 200 dates four days apart (~2 years): a strong early excess, a negative final year.
    const clusters = Array.from({ length: 200 }, (_, i) => ({
      date: day(i * 4),
      value: i < 120 ? 4 + (i % 3) : -0.5 - (i % 2),
    }));
    expect(judgeCell(clusters, POWER).outcome).not.toBe("pass");
  });
});

describe("decide", () => {
  const cell = CELLS[0];
  if (!cell) throw new Error("no cells");
  const j = (outcome: "pass" | "kill" | "underpowered", clusters = 100, needed = 122) => ({
    cell,
    verdict: { outcome, clusters, needed },
  });

  it("passes when any cell passes", () => {
    expect(decide([j("kill"), j("pass"), j("underpowered")]).outcome).toBe("pass");
  });

  it("is underpowered, not a kill, while any cell is underpowered and none passed", () => {
    const d = decide([j("kill"), j("underpowered", 60), j("underpowered", 90)]);
    expect(d).toMatchObject({ outcome: "underpowered", clusters: 90, needed: 122 });
  });

  it("kills only when every cell was powered and none passed", () => {
    expect(decide([j("kill"), j("kill"), j("kill"), j("kill")]).outcome).toBe("kill");
  });
});

describe("helpers", () => {
  it("everyNth keeps dates far enough apart that their windows do not overlap", () => {
    expect(everyNth([0, 1, 2, 3, 4, 5, 6], 5, 1)).toEqual([1, 6]);
  });
  it("sampleSd is n−1, and 0 for fewer than two", () => {
    expect(sampleSd([2, 4])).toBeCloseTo(Math.SQRT2, 10);
    expect(sampleSd([5])).toBe(0);
  });
  it("yearBefore keeps the month and day", () => {
    expect(yearBefore("2026-10-18")).toBe("2025-10-18");
  });
});
