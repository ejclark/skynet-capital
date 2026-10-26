import { equityDrawdown } from "../../src/observatory/equity-sparkline.js";
import type { EquitySample } from "../../src/observatory/history-store.js";
import {
  lossHeadroomGauge,
  lossHeadroomGauges,
  unmeasuredVitals,
  wireTradeVitals,
} from "../../src/observatory/vitals.js";
import { RESTRICT_DRAWDOWN_PCT } from "../../src/risk/risk-ladder.js";

const sample = (at: string, equity: number): EquitySample => ({
  at,
  participantId: "sauron",
  equity,
  cash: 0,
  realizedPl: 0,
});

describe("lossHeadroomGauge", () => {
  it("renders 'not yet measured' with fewer than 2 samples — never a fabricated bar", () => {
    const gauge = lossHeadroomGauge(
      [sample("2026-08-28T10:00:00Z", 100_000)],
      "2026-08-28T10:00:00Z",
    );
    expect(gauge).toEqual({
      label: "Loss headroom",
      measured: false,
      valueText: "not yet measured",
    });
  });

  it("reports full headroom (100% left) when equity has never dipped from its peak", () => {
    const samples = [
      sample("2026-08-28T09:00:00Z", 100_000),
      sample("2026-08-28T10:00:00Z", 101_000),
    ];
    const gauge = lossHeadroomGauge(samples, "2026-08-28T10:00:00Z");
    expect(gauge.measured).toBe(true);
    expect(gauge.fraction).toBe(1);
    expect(gauge.valueText).toBe("100% left");
  });

  it("computes headroom fraction as 1 minus (drawdown / cap)", () => {
    // peak 100_000, a 3,100 dip = 3.1% drawdown, RESTRICT cap is 5.0% — 62% of the cap USED,
    // so 38% of it is left.
    const samples = [
      sample("2026-08-28T09:00:00Z", 100_000),
      sample("2026-08-28T10:00:00Z", 96_900),
    ];
    const gauge = lossHeadroomGauge(samples, "2026-08-28T10:00:00Z");
    expect(gauge.measured).toBe(true);
    expect(gauge.fraction).toBeCloseTo(1 - 0.031 / RESTRICT_DRAWDOWN_PCT, 2);
    expect(gauge.valueText).toBe("38% left");
    expect(gauge.detailText).toBe("3.1% of 5.0% cap");
  });

  it("clamps fraction to 0 once drawdown exceeds the cap, never a negative bar", () => {
    const samples = [
      sample("2026-08-28T09:00:00Z", 100_000),
      sample("2026-08-28T10:00:00Z", 88_000),
    ];
    const gauge = lossHeadroomGauge(samples, "2026-08-28T10:00:00Z");
    expect(gauge.fraction).toBe(0);
    expect(gauge.valueText).toBe("0% left");
  });

  it("reads AS OF the given timestamp — a later dip never leaks into an earlier row's gauge", () => {
    const samples = [
      sample("2026-08-28T09:00:00Z", 100_000),
      sample("2026-08-28T10:00:00Z", 99_000), // 1% dip — the "as of" point for this test
      sample("2026-08-28T11:00:00Z", 80_000), // a much later, larger dip
    ];
    const gauge = lossHeadroomGauge(samples, "2026-08-28T10:00:00Z");
    expect(gauge.detailText).toBe(`1.0% of ${(RESTRICT_DRAWDOWN_PCT * 100).toFixed(1)}% cap`);
  });
});

describe("lossHeadroomGauges", () => {
  // The index must answer exactly what the per-row filter + equityDrawdown did before #4619 — the
  // Wire's numbers move only in speed. Unsorted input, tied instants, and cut points that fall
  // before, between, on and after the samples.
  const history = [
    sample("2026-08-28T12:00:00.000Z", 97_500),
    sample("2026-08-28T09:00:00.000Z", 100_000),
    sample("2026-08-28T11:00:00.000Z", 103_000),
    sample("2026-08-28T10:00:00.000Z", 96_000),
    sample("2026-08-28T11:00:00.000Z", 99_000),
    sample("2026-08-28T13:00:00.000Z", 94_000),
  ];
  const before = (atIso: string) => {
    const dd = equityDrawdown(history.filter((s) => s.at <= atIso));
    return dd ? `${(dd.ddPct).toFixed(1)}% of 5.0% cap` : "unmeasured";
  };
  const gauge = lossHeadroomGauges(history);

  it.each([
    "2026-08-28T08:00:00.000Z",
    "2026-08-28T09:00:00.000Z",
    "2026-08-28T10:00:00.000Z",
    "2026-08-28T10:30:00.000Z",
    "2026-08-28T11:00:00.000Z",
    "2026-08-28T12:00:00.000Z",
    "2026-08-28T23:59:59.999Z",
  ])("matches the filter-and-scan reading as of %s", (atIso) => {
    const g = gauge(atIso);
    expect(g.measured ? g.detailText : "unmeasured").toBe(before(atIso));
    expect(g).toEqual(lossHeadroomGauge(history, atIso));
  });
});

describe("unmeasuredVitals", () => {
  it("gives Proof its own honest word, distinct from the generic 'not yet measured'", () => {
    const vitals = unmeasuredVitals();
    expect(vitals.proof).toEqual({ label: "Proof", measured: false, valueText: "unproven" });
    expect(vitals.edgeVsHold.measured).toBe(false);
    expect(vitals.breadth.measured).toBe(false);
  });
});

describe("wireTradeVitals", () => {
  it("bundles a live Loss headroom with the three honestly-unmeasured gauges", () => {
    const samples = [
      sample("2026-08-28T09:00:00Z", 100_000),
      sample("2026-08-28T10:00:00Z", 100_000),
    ];
    const vitals = wireTradeVitals(samples, "2026-08-28T10:00:00Z");
    expect(vitals.lossHeadroom.measured).toBe(true);
    expect(vitals.edgeVsHold.measured).toBe(false);
    expect(vitals.proof.measured).toBe(false);
    expect(vitals.breadth.measured).toBe(false);
  });
});
