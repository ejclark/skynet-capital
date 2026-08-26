import type { ChainContract, Outlook, UnderlyingContext } from "../../src/options/outlook.js";
import { priceOption } from "../../src/options/pricing.js";
import {
  type AbsentCandidate,
  type BuiltCandidate,
  type CandidateAbsence,
  type CandidateSet,
  candidateStructures,
} from "../../src/options/structure-candidates.js";
import type { StructureKind } from "../../src/options/structure-templates.js";

/**
 * Candidate generation is checked on the three promises it makes: every structure of the stated
 * direction comes back either BUILT or ABSENT-with-a-reason (never dropped), every leg is a
 * contract that actually exists on the chain at one shared expiry, and a chain that cannot carry a
 * structure says which part of it was missing.
 */

const SPOT = 180;
const VOL = 0.4;
const CONTEXT: UnderlyingContext = { spot: SPOT, volatility: VOL, rate: 0.04 };

/** A dense, fully-quoted chain at one expiry — the happy path everything else is measured against. */
function chainAt(daysToExpiry: number, expiration?: string): ChainContract[] {
  const contracts: ChainContract[] = [];
  for (let strike = 100; strike <= 260; strike += 5) {
    for (const kind of ["call", "put"] as const) {
      const valuation = priceOption({
        spot: SPOT,
        strike,
        daysToExpiry,
        volatility: VOL,
        rate: 0.04,
        type: kind,
      });
      if (!valuation) continue;
      contracts.push({
        kind,
        strike,
        daysToExpiry,
        volatility: VOL,
        price: Math.round(valuation.price * 100) / 100,
        ...(expiration === undefined ? {} : { expiration }),
      });
    }
  }
  return contracts;
}

const view = (
  direction: Outlook["direction"],
  magnitude: Outlook["magnitude"] = "moderate",
): Outlook => ({
  symbol: "NVDA",
  direction,
  magnitude,
  horizonDays: 30,
});

const reasons = (set: CandidateSet): CandidateAbsence[] =>
  set.absent.map((entry: AbsentCandidate) => entry.reason);
const kinds = (set: CandidateSet): StructureKind[] =>
  set.built.map((entry: BuiltCandidate) => entry.kind);

describe("candidateStructures — what the chain can carry for a stated view", () => {
  it("offers the three textbook expressions of each direction, all built", () => {
    expect(kinds(candidateStructures(view("bullish"), CONTEXT, chainAt(35)))).toEqual([
      "long-call",
      "bull-call-spread",
      "short-put-spread",
    ]);
    expect(kinds(candidateStructures(view("bearish"), CONTEXT, chainAt(35)))).toEqual([
      "long-put",
      "bear-put-spread",
      "short-call-spread",
    ]);
    expect(kinds(candidateStructures(view("neutral"), CONTEXT, chainAt(35)))).toEqual([
      "iron-condor",
      "short-strangle",
      "long-call-butterfly",
    ]);
  });

  it("builds every leg from a strike the chain actually lists, at one shared expiry", () => {
    const set = candidateStructures(view("neutral"), CONTEXT, chainAt(35, "2026-09-30"));
    const listed = new Set(chainAt(35).map((c) => c.strike));
    for (const candidate of set.built) {
      expect(candidate.daysToExpiry).toBe(35);
      expect(candidate.expiration).toBe("2026-09-30");
      for (const leg of candidate.legs) {
        expect(listed.has(leg.strike)).toBe(true);
        expect(leg.daysToExpiry).toBe(35);
      }
    }
  });

  it("takes the nearest expiry AT OR AFTER the horizon, never a shorter one", () => {
    const set = candidateStructures(view("bullish"), CONTEXT, [
      ...chainAt(20),
      ...chainAt(40),
      ...chainAt(90),
    ]);
    expect(set.built.every((candidate) => candidate.daysToExpiry === 40)).toBe(true);
  });

  it("reports the whole set absent when no listed expiry reaches the horizon", () => {
    const set = candidateStructures(view("bullish"), CONTEXT, chainAt(7));
    expect(set.built).toEqual([]);
    expect(reasons(set)).toEqual([
      "no-expiry-at-horizon",
      "no-expiry-at-horizon",
      "no-expiry-at-horizon",
    ]);
  });

  it("reports no-expected-move when the context cannot describe a distribution", () => {
    const set = candidateStructures(view("bullish"), { spot: SPOT, volatility: 0 }, chainAt(35));
    expect(set.built).toEqual([]);
    expect(reasons(set)).toEqual(["no-expected-move", "no-expected-move", "no-expected-move"]);
    expect(set.target).toBeUndefined();
  });

  it("names a missing quote rather than pricing the structure off a substitute", () => {
    const stripped = chainAt(35).map((c) => ({ ...c, price: undefined }));
    expect(reasons(candidateStructures(view("bullish"), CONTEXT, stripped))).toEqual([
      "missing-quote",
      "missing-quote",
      "missing-quote",
    ]);
  });

  it("names a missing implied volatility the same way", () => {
    const stripped = chainAt(35).map((c) => ({ ...c, volatility: undefined }));
    expect(reasons(candidateStructures(view("bearish"), CONTEXT, stripped))).toEqual([
      "missing-iv",
      "missing-iv",
      "missing-iv",
    ]);
  });

  it("names a missing strike when the chain lists no contract of the kind a structure needs", () => {
    const callsOnly = chainAt(35).filter((c) => c.kind === "call");
    const set = candidateStructures(view("bullish"), CONTEXT, callsOnly);
    expect(kinds(set)).toEqual(["long-call", "bull-call-spread"]);
    expect(reasons(set)).toEqual(["missing-strike"]);
  });

  it("calls a PUT and a CALL that snap together COLLAPSED — that is a straddle, not a strangle", () => {
    // A 10-wide grid on a 10-vol name: a strong neutral view's two short strikes both land on 180.
    // Keying the collapse guard on kind as well as strike would have let this through, and the
    // explanation would have called a short straddle a "short strangle".
    const quiet = { spot: SPOT, volatility: 0.1, rate: 0.04 };
    const grid = chainAt(35).filter((c) => c.strike % 10 === 0);
    const set = candidateStructures(view("neutral", "strong"), quiet, grid);
    expect(set.built).toEqual([]);
    expect(reasons(set)).toEqual(["strikes-collapsed", "strikes-collapsed", "strikes-collapsed"]);
  });

  it("names strike-out-of-reach rather than snapping a leg to a strike nowhere near the anchor", () => {
    // A violently bearish view on a 250-vol name points below every listed strike. Snapping to the
    // nearest one anyway would emit a naked long put dressed as a defined-risk spread.
    const wild = { spot: SPOT, volatility: 2.5, rate: 0.04 };
    const set = candidateStructures(view("bearish", "strong"), wild, chainAt(35));
    expect(kinds(set)).toEqual(["long-put"]);
    expect(reasons(set)).toEqual(["strike-out-of-reach", "strike-out-of-reach"]);
  });

  it("sells CLOSER strikes as a neutral view strengthens, matching what magnitude means there", () => {
    const shortStrikes = (magnitude: Outlook["magnitude"]): number[] => {
      const set = candidateStructures(view("neutral", magnitude), CONTEXT, chainAt(35));
      const strangle = set.built.find((candidate) => candidate.kind === "short-strangle");
      return (strangle?.legs ?? []).map((leg) => leg.strike).sort((a, b) => a - b);
    };
    const slight = shortStrikes("slight");
    const strong = shortStrikes("strong");
    expect(strong[0]).toBeGreaterThan(slight[0] ?? 0);
    expect(strong[1]).toBeLessThan(slight[1] ?? Number.POSITIVE_INFINITY);
  });
});
