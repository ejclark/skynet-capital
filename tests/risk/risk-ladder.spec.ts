import {
  blocksRiskIncrease,
  DEFAULT_RISK_LADDER,
  FLATTEN_DRAWDOWN_PCT,
  forceFlattenRequired,
  RESTRICT_DRAWDOWN_PCT,
  type RiskLadder,
  type RiskTier,
  readRiskLadder,
  WATCH_DRAWDOWN_PCT,
} from "../../src/risk/risk-ladder.js";

const BASELINE = 100_000;

/**
 * Equity that produces exactly `drawdownPct` against the baseline. Rounded to a whole dollar on
 * purpose: dividing two exactly-representable integers is correctly rounded, so `at(0.03)` gives a
 * drawdown bit-identical to the literal `0.03` — which is what lets a boundary spec assert "exactly
 * ON the threshold" without a tolerance fudge that would hide a real off-by-one in the comparison.
 */
const at = (drawdownPct: number): number => BASELINE - Math.round(BASELINE * drawdownPct);

const tierAt = (drawdownPct: number, ladder?: RiskLadder): RiskTier | null =>
  readRiskLadder(BASELINE, at(drawdownPct), ladder)?.tier ?? null;

describe("readRiskLadder", () => {
  describe("the rung boundaries", () => {
    // Each threshold is specced three times — one tick under, exactly on it, one tick over —
    // because "the tier flipped somewhere near 3%" is not a risk control, it is a rumour.
    const EPSILON = 0.0001;

    it("is clear just under the watch threshold", () => {
      expect(tierAt(WATCH_DRAWDOWN_PCT - EPSILON)).toBe("clear");
    });

    it("is watch exactly ON the watch threshold — boundaries are inclusive", () => {
      expect(tierAt(WATCH_DRAWDOWN_PCT)).toBe("watch");
    });

    it("is watch just over the watch threshold", () => {
      expect(tierAt(WATCH_DRAWDOWN_PCT + EPSILON)).toBe("watch");
    });

    it("is still watch just under the restrict threshold", () => {
      expect(tierAt(RESTRICT_DRAWDOWN_PCT - EPSILON)).toBe("watch");
    });

    it("is restricted exactly ON the restrict threshold", () => {
      expect(tierAt(RESTRICT_DRAWDOWN_PCT)).toBe("restricted");
    });

    it("is restricted just over the restrict threshold", () => {
      expect(tierAt(RESTRICT_DRAWDOWN_PCT + EPSILON)).toBe("restricted");
    });

    it("is still restricted just under the flatten threshold", () => {
      expect(tierAt(FLATTEN_DRAWDOWN_PCT - EPSILON)).toBe("restricted");
    });

    it("is liquidate exactly ON the flatten threshold", () => {
      expect(tierAt(FLATTEN_DRAWDOWN_PCT)).toBe("liquidate");
    });

    it("is liquidate well past the flatten threshold — the bottom rung has no floor", () => {
      expect(tierAt(0.9)).toBe("liquidate");
    });
  });

  describe("the reading itself", () => {
    it("reports the drawdown and the rung it crossed", () => {
      const reading = readRiskLadder(BASELINE, at(0.06));
      expect(reading?.tier).toBe("restricted");
      expect(reading?.drawdownPct).toBeCloseTo(0.06, 10);
      expect(reading?.crossedAt).toBe(RESTRICT_DRAWDOWN_PCT);
    });

    it("points at the next rung down, so a warning can say how much headroom is left", () => {
      expect(readRiskLadder(BASELINE, at(0.04))?.nextRung).toEqual({
        tier: "restricted",
        at: RESTRICT_DRAWDOWN_PCT,
      });
    });

    it("has crossed nothing while clear, and points at watch as the next rung", () => {
      const reading = readRiskLadder(BASELINE, at(0));
      expect(reading?.crossedAt).toBeUndefined();
      expect(reading?.nextRung).toEqual({ tier: "watch", at: WATCH_DRAWDOWN_PCT });
    });

    it("has no next rung at the bottom — liquidate is the last one", () => {
      expect(readRiskLadder(BASELINE, at(0.2))?.nextRung).toBeUndefined();
    });

    it("reports a gain as a negative drawdown rather than clamping it to flat", () => {
      const reading = readRiskLadder(BASELINE, 104_000);
      expect(reading?.tier).toBe("clear");
      expect(reading?.drawdownPct).toBeCloseTo(-0.04, 10);
    });

    it("honours a caller-supplied ladder over the defaults", () => {
      const tight: RiskLadder = { watchAt: 0.005, restrictAt: 0.01, flattenAt: 0.02 };
      expect(tierAt(0.012, tight)).toBe("restricted");
      expect(tierAt(0.012)).toBe("clear"); // the same drawdown is nothing on the default ladder
    });

    it("degrades to the SAFER rung when a ladder is mis-ordered", () => {
      // watchAt below restrictAt is a configuration mistake; severest-first evaluation means it
      // reads as restricted rather than as some nonsense rung.
      const jumbled: RiskLadder = { watchAt: 0.06, restrictAt: 0.02, flattenAt: 0.09 };
      expect(tierAt(0.03, jumbled)).toBe("restricted");
    });
  });

  describe("an unmeasurable account", () => {
    // ABSENT, never a cheerful `clear` — an unknown risk level reported as safe is the dangerous
    // direction of wrong, and it is the one the house honesty rule names explicitly.
    it("reads ABSENT with no day-opening baseline", () => {
      expect(readRiskLadder(Number.NaN, 90_000)).toBeNull();
    });

    it("reads ABSENT on a non-positive baseline", () => {
      expect(readRiskLadder(0, 90_000)).toBeNull();
    });

    it("reads ABSENT on a non-finite equity mark", () => {
      expect(readRiskLadder(BASELINE, Number.POSITIVE_INFINITY)).toBeNull();
    });
  });
});

describe("blocksRiskIncrease", () => {
  it("lets new risk through above the block rung", () => {
    expect(blocksRiskIncrease("clear")).toBe(false);
    expect(blocksRiskIncrease("watch")).toBe(false); // the soft rung WARNS; it must not block
  });

  it("refuses new risk from the block rung down", () => {
    expect(blocksRiskIncrease("restricted")).toBe(true);
    expect(blocksRiskIncrease("liquidate")).toBe(true);
  });
});

describe("forceFlattenRequired", () => {
  it("flattens an autonomous bot at the bottom rung", () => {
    expect(forceFlattenRequired("liquidate", "bot")).toBe(true);
  });

  it("NEVER flattens a human member, even at the bottom rung", () => {
    expect(forceFlattenRequired("liquidate", "member")).toBe(false);
  });

  it("does not flatten a bot above the bottom rung", () => {
    for (const tier of ["clear", "watch", "restricted"] as const) {
      expect(forceFlattenRequired(tier, "bot")).toBe(false);
    }
  });
});

describe("the default ladder's dials", () => {
  it("orders the rungs warn → block → flatten", () => {
    expect(DEFAULT_RISK_LADDER.watchAt).toBeLessThan(DEFAULT_RISK_LADDER.restrictAt);
    expect(DEFAULT_RISK_LADDER.restrictAt).toBeLessThan(DEFAULT_RISK_LADDER.flattenAt);
  });

  it("puts the block rung exactly on the daily-loss cap the live breaker already draws", () => {
    // Deliberate: the ladder adds a rung above and a rung below that line, and moves nothing.
    expect(RESTRICT_DRAWDOWN_PCT).toBe(0.05);
  });
});
