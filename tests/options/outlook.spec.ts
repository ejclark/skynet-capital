import {
  BOUNDARY_SIGMAS,
  CHEAP_IV_RANK,
  expectedMove,
  MAGNITUDE_SIGMAS,
  type Outlook,
  type OutlookDirection,
  type OutlookMagnitude,
  outlookTarget,
  RICH_IV_RANK,
  type UnderlyingContext,
  type VolRegime,
  type VolRegimeAbsence,
  volatilityRegime,
} from "../../src/options/outlook.js";
import type { IvMetric, IvReading } from "../../src/research/iv-rank.js";

/**
 * The outlook vocabulary is checked against the arithmetic it claims to do — an expected move is
 * `spot · σ · √T` and nothing else — and against the two readings of magnitude that must stay
 * opposite: a stronger DIRECTIONAL view travels further, a stronger NEUTRAL view sells closer.
 * Collapsing them is the failure mode this module exists to prevent.
 */

const CONTEXT: UnderlyingContext = { spot: 180, volatility: 0.4, rate: 0.04 };
const HORIZON = 30;
/** 180 × 0.40 × √(30/365) — computed the long way so the spec never borrows the implementation. */
const MOVE = 180 * 0.4 * Math.sqrt(30 / 365);

const view = (
  direction: OutlookDirection,
  magnitude: OutlookMagnitude,
  horizonDays = HORIZON,
): Outlook => ({ symbol: "NVDA", direction, magnitude, horizonDays });

const reading = (rank: IvMetric): IvReading => ({
  symbol: "NVDA",
  at: "2026-08-26T20:00:00.000Z",
  currentIv: 0.4,
  rank,
  percentile: rank,
});

describe("expectedMove — one standard deviation of the underlying over the horizon", () => {
  it("is spot × σ × √(days ÷ 365)", () => {
    expect(expectedMove(CONTEXT, HORIZON)).toBeCloseTo(MOVE, 12);
  });

  it("is ABSENT rather than zero when there is no uncertainty to measure", () => {
    expect(expectedMove({ ...CONTEXT, volatility: 0 }, HORIZON)).toBeUndefined();
    expect(expectedMove({ ...CONTEXT, spot: 0 }, HORIZON)).toBeUndefined();
    expect(expectedMove(CONTEXT, 0)).toBeUndefined();
    expect(expectedMove({ ...CONTEXT, volatility: Number.NaN }, HORIZON)).toBeUndefined();
  });
});

describe("outlookTarget — the price the stated view points at", () => {
  it("puts a bullish view one magnitude of expected move above spot", () => {
    expect(outlookTarget(view("bullish", "moderate"), CONTEXT)).toBeCloseTo(180 + MOVE, 10);
    expect(outlookTarget(view("bullish", "strong"), CONTEXT)).toBeCloseTo(180 + 1.75 * MOVE, 10);
  });

  it("mirrors it below spot for a bearish view", () => {
    expect(outlookTarget(view("bearish", "slight"), CONTEXT)).toBeCloseTo(180 - 0.5 * MOVE, 10);
  });

  it("leaves a neutral view at spot — its claim is that nothing moves", () => {
    expect(outlookTarget(view("neutral", "strong"), CONTEXT)).toBe(180);
  });

  it("floors a violently bearish view above zero instead of implying a wipe-out", () => {
    const target = outlookTarget(view("bearish", "strong"), { spot: 180, volatility: 4 });
    expect(target).toBeGreaterThan(0);
    expect(target).toBeCloseTo(1.8, 10);
  });

  it("is ABSENT when no expected move can be described", () => {
    expect(
      outlookTarget(view("bullish", "moderate"), { spot: 180, volatility: 0 }),
    ).toBeUndefined();
  });
});

describe("magnitude reads one way for a move and the opposite way for a range", () => {
  it("travels further as a directional view strengthens", () => {
    expect(MAGNITUDE_SIGMAS.slight).toBeLessThan(MAGNITUDE_SIGMAS.moderate);
    expect(MAGNITUDE_SIGMAS.moderate).toBeLessThan(MAGNITUDE_SIGMAS.strong);
  });

  it("sells CLOSER as a range-holding view strengthens", () => {
    expect(BOUNDARY_SIGMAS.strong).toBeLessThan(BOUNDARY_SIGMAS.moderate);
    expect(BOUNDARY_SIGMAS.moderate).toBeLessThan(BOUNDARY_SIGMAS.slight);
  });
});

describe("volatilityRegime — is premium rich, middling or cheap for this name", () => {
  const regimeOf = (rank: number): VolRegime | undefined => {
    const read = volatilityRegime(reading({ kind: "value", value: rank }));
    return read.kind === "regime" ? read.regime : undefined;
  };

  it("calls the top of the range rich and the bottom cheap, at the stated cut points", () => {
    expect(regimeOf(RICH_IV_RANK)).toBe("rich");
    expect(regimeOf(88)).toBe("rich");
    expect(regimeOf(CHEAP_IV_RANK)).toBe("cheap");
    expect(regimeOf(4)).toBe("cheap");
  });

  it("leaves the band between them explicitly middling rather than forcing a side", () => {
    expect(regimeOf((RICH_IV_RANK + CHEAP_IV_RANK) / 2)).toBe("middling");
  });

  it("passes the IV instrument's own absence reason straight through", () => {
    const read = volatilityRegime(reading({ kind: "absent", reason: "gapped-history" }));
    const reason: VolRegimeAbsence | undefined = read.kind === "absent" ? read.reason : undefined;
    expect(reason).toBe("gapped-history");
  });

  it("names no-iv-history when there is no reading at all — never a middling default", () => {
    const read = volatilityRegime(undefined);
    expect(read).toEqual({ kind: "absent", reason: "no-iv-history" });
  });
});
