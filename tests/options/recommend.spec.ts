import type { ChainContract, Outlook, UnderlyingContext } from "../../src/options/outlook.js";
import { priceOption } from "../../src/options/pricing.js";
import {
  type RankedCandidate,
  RECOMMENDATION_DISCLOSURE,
  type Recommendation,
  rankStructures,
} from "../../src/options/recommend.js";
import type { IvReading } from "../../src/research/iv-rank.js";

/**
 * The end-to-end contract, checked against the three acceptance criteria this engine was built to:
 * a stated forecast returns a RANKED LIST rather than one suggestion, every explanation states
 * MECHANICS and never advice, and anything that cannot be scored is reported ABSENT with a named
 * reason rather than ranked on a fabricated number.
 */

const SPOT = 180;
const VOL = 0.4;
const CONTEXT: UnderlyingContext = { spot: SPOT, volatility: VOL, rate: 0.04 };
const HORIZON_DAYS = 30;
const EXPIRY_DAYS = 35;

const ADVICE_SHAPED = [
  /\byou\b/i,
  /\byour\b/i,
  /\bshould\b/i,
  /\brecommend/i,
  /\bbuy\b/i,
  /\bsell\b/i,
];

function chain(over: Partial<ChainContract> = {}): ChainContract[] {
  const contracts: ChainContract[] = [];
  for (let strike = 100; strike <= 260; strike += 5) {
    for (const kind of ["call", "put"] as const) {
      const valuation = priceOption({
        spot: SPOT,
        strike,
        daysToExpiry: EXPIRY_DAYS,
        volatility: VOL,
        rate: 0.04,
        type: kind,
      });
      if (!valuation) continue;
      contracts.push({
        kind,
        strike,
        daysToExpiry: EXPIRY_DAYS,
        expiration: "2026-09-30",
        volatility: VOL,
        price: Math.round(valuation.price * 100) / 100,
        ...over,
      });
    }
  }
  return contracts;
}

const view = (direction: Outlook["direction"]): Outlook => ({
  symbol: "NVDA",
  direction,
  magnitude: "moderate",
  horizonDays: HORIZON_DAYS,
});

const CHEAP_VOL: IvReading = {
  symbol: "NVDA",
  at: "2026-08-26T20:00:00.000Z",
  currentIv: VOL,
  rank: { kind: "value", value: 9 },
  percentile: { kind: "value", value: 11 },
};

describe("rankStructures — a stated view in, a ranked list of structures out", () => {
  it("returns a LIST of candidates, not a single suggestion", () => {
    const result: Recommendation = rankStructures(view("bullish"), CONTEXT, chain());
    expect(result.ranked.length).toBeGreaterThan(1);
    expect(result.ranked.map((candidate: RankedCandidate) => candidate.kind)).toEqual(
      expect.arrayContaining(["long-call", "bull-call-spread", "short-put-spread"]),
    );
  });

  it("orders best-fitting first, and orders the same inputs the same way every time", () => {
    const result = rankStructures(view("neutral"), CONTEXT, chain());
    const composites = result.ranked.map((candidate) => candidate.score.composite);
    expect(composites).toEqual([...composites].sort((a, b) => b - a));
    const again = rankStructures(view("neutral"), CONTEXT, chain());
    expect(again.ranked.map((c) => c.kind)).toEqual(result.ranked.map((c) => c.kind));
  });

  it("explains every candidate in mechanics, with no advice-shaped language anywhere", () => {
    for (const direction of ["bullish", "bearish", "neutral"] as const) {
      for (const candidate of rankStructures(view(direction), CONTEXT, chain()).ranked) {
        expect(candidate.mechanics).toMatch(/profits if NVDA is |break-even at /);
        for (const pattern of ADVICE_SHAPED) {
          expect({ kind: candidate.kind, matched: pattern.test(candidate.mechanics) }).toEqual({
            kind: candidate.kind,
            matched: false,
          });
        }
      }
    }
  });

  it("accounts for every structure it considered — ranked or absent, never dropped", () => {
    const built = rankStructures(view("bullish"), CONTEXT, chain());
    expect(built.ranked.length + built.absent.length).toBe(3);
    const starved = rankStructures(view("bullish"), CONTEXT, chain({ price: undefined }));
    expect(starved.ranked).toEqual([]);
    expect(starved.absent.map((entry) => entry.reason)).toEqual([
      "missing-quote",
      "missing-quote",
      "missing-quote",
    ]);
  });

  it("echoes the view, the target it points at, and the vol regime it read", () => {
    const result = rankStructures(view("bullish"), { ...CONTEXT, ivReading: CHEAP_VOL }, chain());
    expect(result.outlook).toEqual(view("bullish"));
    expect(result.target).toBeCloseTo(SPOT + SPOT * VOL * Math.sqrt(HORIZON_DAYS / 365), 8);
    expect(result.volRegime).toEqual({ kind: "regime", regime: "cheap", rank: 9 });
  });

  it("names the reason no regime could be read rather than assuming a middling one", () => {
    expect(rankStructures(view("bearish"), CONTEXT, chain()).volRegime).toEqual({
      kind: "absent",
      reason: "no-iv-history",
    });
  });

  it("carries the standing educational, paper-only disclosure", () => {
    const result = rankStructures(view("neutral"), CONTEXT, chain());
    expect(result.disclosure).toBe(RECOMMENDATION_DISCLOSURE);
    expect(result.disclosure).toContain("not financial advice");
  });

  it("ranks one lot per leg — sizing is not this engine's business", () => {
    for (const candidate of rankStructures(view("neutral"), CONTEXT, chain()).ranked) {
      for (const leg of candidate.legs) expect(Math.abs(leg.quantity)).toBeLessThanOrEqual(2);
      expect(candidate.daysToExpiry).toBe(EXPIRY_DAYS);
      expect(candidate.expiration).toBe("2026-09-30");
    }
  });

  it("keeps an uncapped-loss candidate honest instead of hiding it behind a high probability", () => {
    const result = rankStructures(view("neutral"), CONTEXT, chain());
    const strangle = result.ranked.find((candidate) => candidate.kind === "short-strangle");
    expect(strangle?.risk.maxLoss).toEqual({ kind: "unbounded" });
    expect(strangle?.risk.capitalAtRisk).toBeUndefined();
    expect(strangle?.score.probabilityOfProfit ?? 0).toBeGreaterThan(0.6);
    expect(strangle?.mechanics).toContain("the most it can lose is not capped");
  });
});
