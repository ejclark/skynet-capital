import {
  assessFlow,
  type ContractFlow,
  DEFAULT_UNUSUAL_FLOW_THRESHOLDS,
  detectUnusualFlow,
  type UnusualFlowThresholds,
} from "../../src/options/unusual-flow.js";

const AT = "2026-08-26T18:00:00.000Z";

const flow = (partial: Partial<ContractFlow> & { occSymbol: string }): ContractFlow => ({
  underlying: "NVDA",
  expiration: "2026-09-18",
  strike: 200,
  type: "call",
  ...partial,
});

/** Loose dials, so a spec about ONE rule never trips a different one by accident. */
const LOOSE: UnusualFlowThresholds = { minRatio: 2, minVolume: 10 };

describe("assessFlow", () => {
  it("flags volume at or above the ratio threshold and reports the ratio", () => {
    const verdict = assessFlow(1_000, 400, LOOSE);
    expect(verdict).toEqual({
      verdict: "unusual",
      reason: "volume-over-open-interest",
      ratio: 2.5,
    });
  });

  it("is ordinary just below the threshold — the dial is a real boundary, not a suggestion", () => {
    expect(assessFlow(799, 400, LOOSE).verdict).toBe("ordinary");
    expect(assessFlow(800, 400, LOOSE).verdict).toBe("unusual");
  });

  it("keeps the ratio on an ordinary verdict, so a reader sees how close it came", () => {
    expect(assessFlow(600, 400, LOOSE)).toEqual({
      verdict: "ordinary",
      reason: "ratio-below-threshold",
      ratio: 1.5,
    });
  });

  it("flags a strike nobody held as its own reason, with NO ratio invented", () => {
    const verdict = assessFlow(500, 0, LOOSE);
    expect(verdict.verdict).toBe("unusual");
    expect(verdict.reason).toBe("no-open-interest");
    expect(verdict.ratio).toBeUndefined();
    expect(Number.isFinite(verdict.ratio as number)).toBe(false);
  });

  it("holds the volume floor above the zero-open-interest case — a 3-lot is not news", () => {
    expect(assessFlow(3, 0, LOOSE).reason).toBe("below-volume-floor");
    expect(assessFlow(3, 0, LOOSE).verdict).toBe("ordinary");
  });

  it("is INDETERMINATE, not ordinary, when the feed withheld open interest", () => {
    const verdict = assessFlow(5_000, undefined, LOOSE);
    expect(verdict.verdict).toBe("indeterminate");
    expect(verdict.reason).toBe("open-interest-unreported");
    expect(verdict.ratio).toBeUndefined();
  });

  it("is indeterminate when the feed withheld volume", () => {
    expect(assessFlow(undefined, 400, LOOSE)).toEqual({
      verdict: "indeterminate",
      reason: "volume-unreported",
    });
  });

  it("treats a nonsense number as unreported rather than trusting it", () => {
    expect(assessFlow(Number.NaN, 400, LOOSE).verdict).toBe("indeterminate");
    expect(assessFlow(1_000, -5, LOOSE).reason).toBe("open-interest-unreported");
    expect(assessFlow(Number.POSITIVE_INFINITY, 400, LOOSE).verdict).toBe("indeterminate");
  });

  it("uses the defensible defaults when no thresholds are passed", () => {
    expect(DEFAULT_UNUSUAL_FLOW_THRESHOLDS).toEqual({ minRatio: 2, minVolume: 250 });
    // 240 lots clears 2× open interest but sits under the default liquidity floor.
    expect(assessFlow(240, 100).reason).toBe("below-volume-floor");
    expect(assessFlow(260, 100).verdict).toBe("unusual");
  });
});

describe("detectUnusualFlow", () => {
  it("records a scan that found nothing rather than staying silent", () => {
    const scan = detectUnusualFlow(
      "NVDA",
      [flow({ occSymbol: "A", volume: 10, openInterest: 5_000 })],
      AT,
      LOOSE,
    );
    expect(scan.flags).toEqual([]);
    expect(scan.contractsScanned).toBe(1);
    expect(scan.contractsJudged).toBe(1);
    expect(scan.at).toBe(AT);
    expect(scan.underlying).toBe("NVDA");
  });

  it("counts contracts it could not judge separately from ordinary ones", () => {
    const scan = detectUnusualFlow(
      "NVDA",
      [
        flow({ occSymbol: "A", volume: 10, openInterest: 5_000 }),
        flow({ occSymbol: "B", volume: 900 }), // open interest withheld
        flow({ occSymbol: "C", openInterest: 40 }), // volume withheld
      ],
      AT,
      LOOSE,
    );
    expect(scan.contractsScanned).toBe(3);
    expect(scan.indeterminate).toBe(2);
    expect(scan.contractsJudged).toBe(1);
    expect(scan.flags).toEqual([]);
  });

  it("carries the numbers that flagged the contract, so nobody has to trust the verdict", () => {
    const scan = detectUnusualFlow(
      "NVDA",
      [flow({ occSymbol: "NVDA260918C00200000", volume: 1_200, openInterest: 300 })],
      AT,
      LOOSE,
    );
    expect(scan.flags).toHaveLength(1);
    expect(scan.flags[0]).toEqual({
      occSymbol: "NVDA260918C00200000",
      expiration: "2026-09-18",
      strike: 200,
      type: "call",
      volume: 1_200,
      openInterest: 300,
      reason: "volume-over-open-interest",
      ratio: 4,
    });
  });

  it("ranks rated flags loudest-first and never sorts a missing ratio as infinity", () => {
    const scan = detectUnusualFlow(
      "NVDA",
      [
        flow({ occSymbol: "MILD", volume: 300, openInterest: 100 }), // 3×
        flow({ occSymbol: "NEW", volume: 400, openInterest: 0 }), // no ratio at all
        flow({ occSymbol: "LOUD", volume: 4_000, openInterest: 100 }), // 40×
      ],
      AT,
      LOOSE,
    );
    expect(scan.flags.map((f) => f.occSymbol)).toEqual(["LOUD", "MILD", "NEW"]);
  });

  it("records the thresholds it used, so an old scan stays readable after the dials move", () => {
    const scan = detectUnusualFlow("NVDA", [], AT, LOOSE);
    expect(scan.thresholds).toEqual(LOOSE);
    expect(detectUnusualFlow("NVDA", [], AT).thresholds).toEqual(DEFAULT_UNUSUAL_FLOW_THRESHOLDS);
  });

  it("handles an empty chain as a real scan of nothing, not a crash", () => {
    const scan = detectUnusualFlow("NVDA", [], AT, LOOSE);
    expect(scan).toMatchObject({ contractsScanned: 0, contractsJudged: 0, indeterminate: 0 });
  });
});
