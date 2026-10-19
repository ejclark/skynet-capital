import {
  judgeFloor,
  judgePremiumRichness,
  judgePrePrintPut,
  judgeRecovery,
  judgeRunUp,
  MEDIUM_UNITS,
  parseRunUpRow,
} from "../../src/playbooks/claim-verdicts.js";
import type { ConvictionClaim } from "../../src/playbooks/conviction-record.js";

/**
 * #5482 slice 3 — reading an instrument's output as a verdict on one claim. The failure these exist
 * to prevent: a verdict that reads more confident than the data (a `high`), that sizes a trade, that
 * drops the claim's dated falsifier, or that is invented from output the judge did not understand.
 */

const claim = (over: Partial<ConvictionClaim> = {}): ConvictionClaim => ({
  tag: "underrated",
  statement: "CRWV's floor is probably $48–$52.",
  bucket: "tested",
  evidence: "37 past episodes.",
  falsifier: "CRWV's lowest close lands outside $41.0–$60.9 by 2027-01-19.",
  scoreBy: "2027-01-20",
  ...over,
});

/** premium-fit's finding, only the fields a judge reads. */
const fit = (over: { verdict: string; rank: number; gap: number; confidence?: string }) => ({
  symbol: "CRWV",
  iv30: 0.932,
  fit: { confidence: "low", ...over },
  ladder: [
    { rung: 0.15, pricedAssignment: 0.15, historicalAssignment: 0.1 },
    { rung: 0.2, pricedAssignment: 0.201, historicalAssignment: 0.248 },
  ],
});

/** cycle-phase's `--json` file for one target: today's reading and the headline row. */
const cycle = (head: Record<string, unknown> | null, today: Record<string, unknown> = {}) => [
  {
    today: { date: "2026-10-16", close: 64.72, putExpiry: "2026-11-06", ...today },
    headline: head && {
      sample: "pooled",
      level: "exact",
      episodes: 43,
      clusters: 22,
      further: { p25: -0.3, p50: -0.17, p75: -0.076 },
      furtherScaled: { p25: -0.54, p50: -0.28, p75: -0.13 },
      toLow: [0, 8, 23, 49, 58],
      backToEntry: [1, 13, 43, ">126", ">126"],
      entryIn63: 0.67,
      highIn126: 0.35,
      rungs: [
        { delta: 0.2, strike: 55, raw: 0.116, scaled: 0.209 },
        { delta: 0.3, strike: 59, raw: 0.209, scaled: 0.302 },
      ],
      ...head,
    },
  },
];

describe("every verdict", () => {
  it("carries the claim's own dated falsifier and score-by day, and never a size", () => {
    const verdicts = [
      judgePremiumRichness(claim(), fit({ verdict: "stand aside", rank: 0.63, gap: -0.006 })),
      judgeFloor(claim(), cycle({})),
      judgeRecovery(claim(), cycle({})),
      judgePrePrintPut(claim(), cycle({})),
    ];
    for (const v of verdicts) {
      expect(v?.falsifier).toBe(claim().falsifier);
      expect(v?.scoreBy).toBe("2027-01-20");
      expect(v).not.toHaveProperty("size");
      expect(v?.call).not.toMatch(/\bsize\b|\border\b|\bbuy\b/i);
      expect(v?.confidence).not.toBe("high");
    }
  });

  it("omits scoreBy when the claim has none", () => {
    const v = judgeFloor(claim({ scoreBy: undefined }), cycle({}));
    expect(v).not.toHaveProperty("scoreBy");
  });
});

describe("judgePremiumRichness", () => {
  it("reads the fit test's three verdicts as supports / mixed / against", () => {
    expect(
      judgePremiumRichness(claim(), fit({ verdict: "fits", rank: 0.8, gap: 0.1 }))?.reading,
    ).toBe("supports");
    expect(
      judgePremiumRichness(claim(), fit({ verdict: "thin", rank: 0.55, gap: 0.01 }))?.reading,
    ).toBe("mixed");
    expect(
      judgePremiumRichness(claim(), fit({ verdict: "stand aside", rank: 0.3, gap: -0.2 }))?.reading,
    ).toBe("against");
  });

  it("says fair when implied is above the median outcome but pays nothing, cheap when below it", () => {
    const fair = judgePremiumRichness(
      claim(),
      fit({ verdict: "stand aside", rank: 0.63, gap: -0.006 }),
    );
    expect(fair?.call).toMatch(/fair, not rich/);
    expect(fair?.call).toMatch(/63rd pct/);
    const cheap = judgePremiumRichness(
      claim(),
      fit({ verdict: "stand aside", rank: 0.06, gap: -0.24 }),
    );
    expect(cheap?.call).toMatch(/cheap/);
  });

  it("keeps the instrument's own grade, capped at medium by the judge's vocabulary", () => {
    expect(
      judgePremiumRichness(
        claim(),
        fit({ verdict: "fits", rank: 0.8, gap: 0.1, confidence: "high" }),
      )?.confidence,
    ).toBe("low");
    expect(
      judgePremiumRichness(
        claim(),
        fit({ verdict: "fits", rank: 0.8, gap: 0.1, confidence: "medium" }),
      )?.confidence,
    ).toBe("medium");
  });

  it("returns the wheel rung's priced and historical odds when the ladder has one", () => {
    const v = judgePremiumRichness(claim(), fit({ verdict: "fits", rank: 0.8, gap: 0.1 }));
    expect(v?.numbers.d20PricedAssignment).toBe(0.201);
    expect(v?.numbers.d20HistoricalAssignment).toBe(0.248);
  });

  it("returns null for output it does not understand, never a guess", () => {
    expect(judgePremiumRichness(claim(), null)).toBeNull();
    expect(
      judgePremiumRichness(claim(), { fit: { verdict: "maybe", rank: 0.5, gap: 0 }, iv30: 1 }),
    ).toBeNull();
    expect(judgePremiumRichness(claim(), { iv30: 0.9 })).toBeNull();
  });
});

describe("judgeFloor", () => {
  it("backs 'more pullback first' when the median like-weather episode fell 5% or more", () => {
    const v = judgeFloor(claim(), cycle({}));
    expect(v?.reading).toBe("supports");
    expect(v?.numbers.floorAtMedian).toBeCloseTo(64.72 * 0.83, 6);
    expect(v?.call).toMatch(/about 23 sessions in/);
  });

  it("splits between 2% and 5%, and cuts against it when the median barely fell", () => {
    expect(
      judgeFloor(claim(), cycle({ further: { p25: -0.1, p50: -0.03, p75: 0 } }))?.reading,
    ).toBe("mixed");
    const against = judgeFloor(claim(), cycle({ further: { p25: -0.04, p50: -0.01, p75: 0 } }));
    expect(against?.reading).toBe("against");
    expect(against?.call).toMatch(/may already be in/);
  });

  it("grades medium only with a clear reading AND enough independent units", () => {
    expect(judgeFloor(claim(), cycle({ clusters: MEDIUM_UNITS }))?.confidence).toBe("medium");
    expect(judgeFloor(claim(), cycle({ clusters: MEDIUM_UNITS - 1 }))?.confidence).toBe("low");
    expect(
      judgeFloor(claim(), cycle({ clusters: 99, further: { p25: -0.1, p50: -0.03, p75: 0 } }))
        ?.confidence,
    ).toBe("low");
  });

  it("counts own-history episodes, not clusters, when the headline is the name's own tape", () => {
    expect(
      judgeFloor(claim(), cycle({ sample: "own", episodes: 31, clusters: 3 }))?.confidence,
    ).toBe("medium");
  });

  it("makes no call when no sample reaches the headline bar", () => {
    const v = judgeFloor(claim(), cycle(null));
    expect(v?.reading).toBe("mixed");
    expect(v?.confidence).toBe("low");
    expect(v?.call).toMatch(/^No call/);
  });

  it("returns null when the reading is not the shape cycle-phase writes", () => {
    expect(judgeFloor(claim(), [])).toBeNull();
    expect(judgeFloor(claim(), cycle({ toLow: [] }))).toBeNull();
    expect(judgeFloor(claim(), cycle({ further: { p50: -0.2 } }))).toBeNull();
  });
});

describe("judgeRecovery", () => {
  it("backs a base case of 'back above entry' when half the episodes got there within 63 sessions", () => {
    const v = judgeRecovery(claim(), cycle({}));
    expect(v?.reading).toBe("supports");
    expect(v?.call).toMatch(
      /67% of like-weather episodes closed back above \$64\.72 within 63 sessions/,
    );
    expect(v?.call).toMatch(/35% regained the old high within 126/);
  });

  it("is slower than the claim when under half were back by 63 but the median recovered by 126", () => {
    const v = judgeRecovery(
      claim(),
      cycle({ entryIn63: 0.4, backToEntry: [10, 30, 80, ">126", ">126"] }),
    );
    expect(v?.reading).toBe("mixed");
  });

  it("cuts against it when the median episode had not recovered in the horizon", () => {
    const v = judgeRecovery(
      claim(),
      cycle({ entryIn63: 0.3, backToEntry: [10, 80, ">126", ">126", ">126"] }),
    );
    expect(v?.reading).toBe("against");
    expect(v?.numbers.medianSessionsBackToEntry).toBe(">126");
  });
});

describe("judgePrePrintPut", () => {
  it("calls the put fair when raw history says rich but vol-scaled history says priced right", () => {
    const v = judgePrePrintPut(claim(), cycle({}));
    expect(v?.reading).toBe("mixed");
    expect(v?.call).toMatch(
      /^Fair, not rich: the \$55\.00 put expiring 2026-11-06 is priced at 20%/,
    );
    expect(v?.call).toMatch(/12% to 21%/);
  });

  it("is rich only when it beats BOTH histories by the fair band, cheap only when it loses to both", () => {
    const rich = judgePrePrintPut(
      claim(),
      cycle({ rungs: [{ delta: 0.2, strike: 55, raw: 0.05, scaled: 0.1 }] }),
    );
    expect(rich?.reading).toBe("supports");
    const cheap = judgePrePrintPut(
      claim(),
      cycle({ rungs: [{ delta: 0.2, strike: 55, raw: 0.3, scaled: 0.4 }] }),
    );
    expect(cheap?.reading).toBe("against");
  });

  it("returns null without the wheel's rung, rather than judging another delta", () => {
    expect(
      judgePrePrintPut(
        claim(),
        cycle({ rungs: [{ delta: 0.3, strike: 59, raw: 0.2, scaled: 0.3 }] }),
      ),
    ).toBeNull();
  });
});

describe("parseRunUpRow and judgeRunUp", () => {
  const report = (row: string) =>
    [
      "[RUN-UP] close D-10 -> close D (held into, but not through, the print) | non-earnings baseline +2.03%",
      "  era                n    mean%     med%     win%     p10%     p90%  excess%",
      "  2023-2026         15     2.15     3.72       67    -6.40     8.68     0.12",
      "",
      "[RUN-UP] close D-20 -> close D (held into, but not through, the print) | non-earnings baseline +4.26%",
      "  era                n    mean%     med%     win%     p10%     p90%  excess%",
      "  ALL               88     5.38     4.73       73    -6.50    17.45     1.12",
      row,
      "",
      "[GAP] close D -> open D+1 (the overnight verdict)",
    ].join("\n");
  const modern = "  2023-2026         15     9.16     7.73      100     1.78    19.17     4.90";

  it("reads the modern-era row of the D-20 table, not another window's", () => {
    expect(parseRunUpRow(report(modern))).toEqual({ n: 15, win: 100, mean: 9.16, excess: 4.9 });
    expect(parseRunUpRow(report(modern), 10)).toEqual({ n: 15, win: 67, mean: 2.15, excess: 0.12 });
  });

  it("returns null when the table, the row or a column is missing", () => {
    expect(parseRunUpRow("nothing here")).toBeNull();
    expect(
      parseRunUpRow(
        report("  2020-2022         12    11.50    10.27       75    -1.91    32.02     7.24"),
      ),
    ).toBeNull();
    expect(parseRunUpRow(report("  2023-2026         15     9.16     7.73      100"))).toBeNull();
  });

  it("backs the claim at 80% positive with a positive excess, medium on 10+ prints", () => {
    const v = judgeRunUp(
      claim({ falsifier: "Close D-20 to print day is negative by 2026-11-30." }),
      report(modern),
      "NVDA",
    );
    expect(v?.reading).toBe("supports");
    expect(v?.confidence).toBe("medium");
    expect(v?.call).toMatch(/15 of its last 15 prints/);
    expect(v?.call).toMatch(/\+4\.9%/);
  });

  it("splits or cuts against on weaker rows, and calls too few prints mixed whatever they show", () => {
    const row = (n: number, win: number, excess: number) =>
      `  2023-2026         ${n}     9.16     7.73      ${win}     1.78    19.17     ${excess.toFixed(2)}`;
    expect(judgeRunUp(claim(), report(row(15, 67, 0.5)), "NVDA")?.reading).toBe("mixed");
    expect(judgeRunUp(claim(), report(row(15, 40, 0.5)), "NVDA")?.reading).toBe("against");
    expect(judgeRunUp(claim(), report(row(15, 100, -1)), "NVDA")?.reading).toBe("against");
    const few = judgeRunUp(claim(), report(row(6, 100, 5)), "NVDA");
    expect(few?.reading).toBe("mixed");
    expect(few?.confidence).toBe("low");
  });

  it("returns null for output that is not the report text", () => {
    expect(judgeRunUp(claim(), { not: "text" }, "NVDA")).toBeNull();
    expect(judgeRunUp(claim(), "garbage", "NVDA")).toBeNull();
  });
});
