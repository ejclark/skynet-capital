import {
  CALL_WORDS,
  daysText,
  type HypothesisVerdict,
  type ProbeRetro,
  pct,
  retroLine,
  verdictLine,
} from "../../src/live/probes";

describe("pct — a signed percent with a true minus sign", () => {
  it("signs both ways", () => {
    expect(pct(0.032)).toBe("+3.2%");
    expect(pct(-0.01)).toBe("−1.0%");
    expect(pct(0)).toBe("+0.0%");
  });
});

describe("daysText", () => {
  it("reads hours under a day, then days", () => {
    expect(daysText(1 / 24)).toBe("1h");
    expect(daysText(0.5)).toBe("12h");
    expect(daysText(2.5)).toBe("2.5d");
    expect(daysText(14)).toBe("14d");
  });
});

describe("CALL_WORDS — a glyph and a word for every call, never hue alone", () => {
  it("covers every call with a distinct glyph", () => {
    const glyphs = Object.values(CALL_WORDS).map((c) => c.glyph);
    expect(new Set(glyphs).size).toBe(4);
    expect(CALL_WORDS.unproven.word).toMatch(/^Unproven/);
  });
});

describe("verdictLine", () => {
  const base: HypothesisVerdict = {
    hypothesis: "oversold-rebound",
    closes: 12,
    winRate: 0.583,
    meanRoi: 0.012,
    band: { ci: { low: -0.4, high: 2.1 } },
    outliers: [],
    call: "no edge shown",
    callWithoutOutliers: "no edge shown",
  };

  it("names the closes, win rate, average and the band (the band arrives in percent)", () => {
    expect(verdictLine(base)).toBe("12 closes · 58% won · avg +1.2% · band −0.4% to +2.1%");
  });

  it("adds the market comparison when it exists, and drops a band that doesn't", () => {
    expect(
      verdictLine({ ...base, band: { ci: null }, closes: 1, meanExcessVsMarket: -0.005 }),
    ).toBe("1 close · 58% won · avg +1.2% · −0.5% vs SPY");
  });
});

describe("retroLine", () => {
  const retro: ProbeRetro = {
    probeId: "AMD@1",
    symbol: "AMD",
    hypothesis: "oversold-rebound",
    reason: "horizon",
    closedAt: 1,
    daysHeld: 5,
    roi: 0.02,
    roiPerDay: 0.004,
    directionRight: true,
    soonerWasBetter: true,
    earlierExits: [],
    laterExits: [{ label: "1 week", roi: 0.05 }, { label: "3 weeks" }],
    market: { symbol: "SPY", roi: 0.01, excess: 0.01 },
  };

  it("says what the close taught, including what timing would have done", () => {
    expect(retroLine(retro)).toBe(
      "right call · held to horizon · +0.4%/day · closing sooner paid faster · held 1 week: +5.0% · +1.0% vs SPY",
    );
  });

  it("says a stopped-out wrong call plainly, and skips what isn't known yet", () => {
    expect(
      retroLine({
        ...retro,
        directionRight: false,
        reason: "invalidated",
        roiPerDay: -0.01,
        soonerWasBetter: false,
        laterExits: [{ label: "1 week" }],
      })
        .split(" · ")
        .slice(0, 3),
    ).toEqual(["wrong call", "stopped out", "−1.0%/day"]);
  });
});
