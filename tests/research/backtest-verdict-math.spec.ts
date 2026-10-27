import {
  backtestVerdict,
  clusterByDate,
  meanT,
  requiredClusters,
} from "../../scripts/research/backtest-verdict-math.mjs";

/**
 * The reducers behind a candidate playbook's one pre-registered run (#4808 slice 3). The failure
 * they exist to prevent: a thin sample read as a kill (the sweep's candidates 1 and 6), which would
 * put a live idea on the list of things never to re-propose.
 */

const power = { sdPct: 4, effectPct: 1.5, zBar: 3.29, zPower: 0.84 };
const days = (n: number, value: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => ({ value: value(i) }));

describe("requiredClusters", () => {
  it("is ((zBar + zPower) × sd ÷ effect)², rounded up", () => {
    expect(requiredClusters(power)).toBe(122);
    expect(requiredClusters({ ...power, effectPct: 3 })).toBe(31);
  });

  it("rejects inputs that would give a meaningless number", () => {
    expect(() => requiredClusters({ ...power, sdPct: 0 })).toThrow();
    expect(() => requiredClusters({ ...power, effectPct: -1 })).toThrow();
  });
});

describe("clusterByDate", () => {
  it("averages events within their date, so forty stocks on one day are one observation", () => {
    const out = clusterByDate([
      { date: "2026-03-02", value: 2 },
      { date: "2026-03-01", value: 1 },
      { date: "2026-03-02", value: 4 },
    ]);
    expect(out).toEqual([
      { date: "2026-03-01", value: 1, events: 1 },
      { date: "2026-03-02", value: 3, events: 2 },
    ]);
  });
});

describe("meanT", () => {
  it("reports a flat sample as t = 0, not Infinity", () => {
    expect(meanT([2, 2, 2])).toEqual({ mean: 2, t: 0 });
  });
  it("needs at least two clusters", () => {
    expect(() => meanT([1])).toThrow();
  });
});

describe("backtestVerdict — power is judged before the outcome", () => {
  it("calls a thin sample underpowered even when every day is a big win", () => {
    const v = backtestVerdict(
      days(121, (i) => 5 + (i % 2)),
      power,
      true,
    );
    expect(v).toEqual({ outcome: "underpowered", clusters: 121, needed: 122 });
  });

  it("calls a thin sample underpowered even when every day loses", () => {
    expect(
      backtestVerdict(
        days(40, () => -3),
        power,
        true,
      ).outcome,
    ).toBe("underpowered");
  });

  it("passes a powered sample that clears the bar and holds in the latest era", () => {
    const v = backtestVerdict(
      days(200, (i) => 2 + (i % 2)),
      power,
      true,
    );
    expect(v.outcome).toBe("pass");
    expect(v.t).toBeGreaterThan(3.29);
  });

  it("kills a powered sample that does not clear the bar", () => {
    const v = backtestVerdict(
      days(200, (i) => (i % 2 ? 1 : -1)),
      power,
      true,
    );
    expect(v.outcome).toBe("kill");
  });

  it("kills a powered, significant sample whose latest era has flipped sign", () => {
    expect(
      backtestVerdict(
        days(200, (i) => 2 + (i % 2)),
        power,
        false,
      ).outcome,
    ).toBe("kill");
  });
});
