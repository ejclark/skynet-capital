import type { IvAbsence, IvMetric } from "../../src/research/iv-rank.js";
import {
  IV_WINDOW_DAYS,
  ivReading,
  ivReadings,
  MAX_SAMPLE_GAP_DAYS,
} from "../../src/research/iv-rank.js";
import type { IvSample } from "../../src/research/iv-record.js";

/** The number behind a metric this spec asserts is present — a named failure beats an optional chain. */
const measured = (metric: IvMetric | undefined): number => {
  if (metric?.kind === "value") return metric.value;
  throw new Error(`expected a measured metric, got ${metric ? metric.reason : "no reading"}`);
};

/** The NAMED reason a metric is absent — the assertion this instrument's honesty rests on. */
const absence = (metric: IvMetric | undefined): IvAbsence => {
  if (metric?.kind === "absent") return metric.reason;
  throw new Error(`expected an absent metric, got ${metric ? String(metric.value) : "no reading"}`);
};

const DAY = 24 * 60 * 60 * 1000;
const NOW = "2026-08-26T00:00:00.000Z";
const NOW_MS = Date.parse(NOW);

const at = (daysAgo: number): string => new Date(NOW_MS - daysAgo * DAY).toISOString();

const s = (daysAgo: number, atmIv: number, symbol = "NVDA"): IvSample => ({
  at: at(daysAgo),
  symbol,
  atmIv,
  spot: 100,
  daysToExpiry: 30,
});

/** Daily samples from `days` ago through today; `iv` and `keep` are keyed by the day offset. */
const daily = (
  days: number,
  iv: (daysAgo: number) => number,
  options: { readonly symbol?: string; readonly keep?: (daysAgo: number) => boolean } = {},
): IvSample[] => {
  const out: IvSample[] = [];
  for (let d = days; d >= 0; d--) {
    if (options.keep && !options.keep(d)) continue;
    out.push(s(d, iv(d), options.symbol));
  }
  return out;
};

/** A full covered year: flat at 0.2, one 0.6 spike 200 days back, currently 0.4. */
const SPIKED_YEAR = daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.4 : d === 200 ? 0.6 : 0.2));

describe("ivReading — rank and percentile are different numbers", () => {
  it("computes rank against the 52-week range", () => {
    const reading = ivReading("NVDA", SPIKED_YEAR, NOW);
    // (0.4 − 0.2) / (0.6 − 0.2) = 50.
    expect(measured(reading?.rank)).toBeCloseTo(50, 10);
    expect(reading?.windowLow).toBe(0.2);
    expect(reading?.windowHigh).toBe(0.6);
  });

  it("computes percentile against the distribution, so one spike does not dominate it", () => {
    const reading = ivReading("NVDA", SPIKED_YEAR, NOW);
    // 364 of 366 samples sit strictly below 0.4 — a mid-range RANK next to a rich PERCENTILE.
    expect(measured(reading?.percentile)).toBeCloseTo((364 / 366) * 100, 10);
  });

  it("reports the reading against the latest sample's own timestamp", () => {
    const reading = ivReading("NVDA", SPIKED_YEAR, NOW);
    expect(reading?.at).toBe(at(0));
    expect(reading?.currentIv).toBe(0.4);
  });

  it("reads percentile over the FULL history while rank stays inside the window", () => {
    // Two rich years, then a quiet one: the year-window says 'as rich as it has been', the full
    // distribution says 'still cheaper than two thirds of everything we ever recorded'.
    const threeYears = daily(3 * IV_WINDOW_DAYS, (d) =>
      d > IV_WINDOW_DAYS ? 0.9 : d === 0 ? 0.25 : 0.2,
    );
    const reading = ivReading("NVDA", threeYears, NOW);
    expect(measured(reading?.rank)).toBeCloseTo(100, 10);
    expect(measured(reading?.percentile)).toBeLessThan(40);
  });
});

describe("ivReading — the extremes are real numbers, not absences", () => {
  it("ranks a fresh 52-week high at 100", () => {
    const reading = ivReading(
      "NVDA",
      daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.6 : 0.2)),
      NOW,
    );
    expect(measured(reading?.rank)).toBeCloseTo(100, 10);
  });

  it("ranks a fresh 52-week low at a TRUE zero — 'never been lower', not 'unknown'", () => {
    const reading = ivReading(
      "NVDA",
      daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.2 : 0.6)),
      NOW,
    );
    expect(measured(reading?.rank)).toBe(0);
    expect(measured(reading?.percentile)).toBe(0);
  });
});

describe("ivReading — absence, never a misleading partial-window number", () => {
  it("reports short-history when the series does not reach back a full window", () => {
    const reading = ivReading(
      "NVDA",
      daily(100, (d) => 0.2 + d / 1000),
      NOW,
    );
    expect(reading?.currentIv).toBe(0.2);
    expect(absence(reading?.rank)).toBe("short-history");
    expect(absence(reading?.percentile)).toBe("short-history");
  });

  it("draws the coverage line exactly at the window edge", () => {
    const oneDayShort = ivReading(
      "NVDA",
      daily(IV_WINDOW_DAYS - 1, () => 0.3),
      NOW,
    );
    expect(absence(oneDayShort?.rank)).toBe("short-history");
    const exact = ivReading(
      "NVDA",
      daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.4 : 0.3)),
      NOW,
    );
    expect(exact?.rank.kind).toBe("value");
  });

  it("reports gapped-history when the window has a hole wider than the tolerance", () => {
    const holed = daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.4 : 0.2), {
      keep: (d) => d < 150 || d > 210,
    });
    expect(absence(ivReading("NVDA", holed, NOW)?.rank)).toBe("gapped-history");
  });

  it("tolerates a hole inside the gap allowance", () => {
    const nicked = daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.4 : d === 200 ? 0.6 : 0.2), {
      keep: (d) => d < 150 || d > 150 + MAX_SAMPLE_GAP_DAYS - 2,
    });
    expect(ivReading("NVDA", nicked, NOW)?.rank.kind).toBe("value");
  });

  it("reports gapped-history when the instrument went stale, however dense its past", () => {
    const stale = daily(IV_WINDOW_DAYS, (d) => (d === 200 ? 0.6 : 0.2), { keep: (d) => d >= 60 });
    const reading = ivReading("NVDA", stale, NOW);
    expect(reading?.at).toBe(at(60));
    expect(absence(reading?.rank)).toBe("gapped-history");
  });

  it("reports flat-range rather than inventing a rank for a series with no range", () => {
    const reading = ivReading(
      "NVDA",
      daily(IV_WINDOW_DAYS, () => 0.3),
      NOW,
    );
    expect(reading?.currentIv).toBe(0.3);
    expect(absence(reading?.rank)).toBe("flat-range");
    expect(absence(reading?.percentile)).toBe("flat-range");
  });

  it("omits the 52-week band whenever the rank itself is absent", () => {
    const reading = ivReading(
      "NVDA",
      daily(100, () => 0.3),
      NOW,
    );
    expect(reading?.windowLow).toBeUndefined();
    expect(reading?.windowHigh).toBeUndefined();
  });

  it("has no reading at all for a symbol with nothing recorded", () => {
    expect(ivReading("MU", SPIKED_YEAR, NOW)).toBeUndefined();
    expect(ivReading("NVDA", [], NOW)).toBeUndefined();
  });
});

describe("ivReading — reads only what it should", () => {
  it("ignores other underlyings' samples", () => {
    const mixed = [...SPIKED_YEAR, ...daily(IV_WINDOW_DAYS, () => 0.95, { symbol: "GOOG" })];
    expect(ivReading("NVDA", mixed, NOW)?.windowHigh).toBe(0.6);
  });

  it("ignores samples stamped after the moment being asked about", () => {
    const withFuture = [...SPIKED_YEAR, s(-5, 3.5)];
    const reading = ivReading("NVDA", withFuture, NOW);
    expect(reading?.currentIv).toBe(0.4);
    expect(reading?.windowHigh).toBe(0.6);
  });

  it("does not care what order the samples arrive in", () => {
    const shuffled = [...SPIKED_YEAR].reverse();
    expect(ivReading("NVDA", shuffled, NOW)).toEqual(ivReading("NVDA", SPIKED_YEAR, NOW));
  });
});

describe("ivReadings", () => {
  it("returns one reading per underlying, sorted by symbol", () => {
    const samples = [
      ...SPIKED_YEAR,
      ...daily(IV_WINDOW_DAYS, (d) => (d === 0 ? 0.3 : 0.25), { symbol: "GOOG" }),
    ];
    expect(ivReadings(samples, NOW).map((r) => r.symbol)).toEqual(["GOOG", "NVDA"]);
  });

  it("omits an underlying with nothing recorded yet at that moment", () => {
    const samples = [...SPIKED_YEAR, s(-5, 0.9, "GOOG")];
    expect(ivReadings(samples, NOW).map((r) => r.symbol)).toEqual(["NVDA"]);
  });

  it("is empty when nothing has ever been recorded", () => {
    expect(ivReadings([], NOW)).toEqual([]);
  });
});
