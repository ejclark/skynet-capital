import {
  ASSERTIONS,
  assertionOf,
  claimSymbol,
  contextSymbolOf,
  knownSymbols,
  planClaim,
  type StudyLedgerEntry,
  withStudies,
} from "../../src/playbooks/claim-studies.js";
import { type ClaimStudy, studyProblems } from "../../src/playbooks/claim-study.js";
import type { Conviction, ConvictionClaim } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import ledger from "../../src/playbooks/conviction-studies.json";

/**
 * #5482 slice 3, criterion 2 — a claim maps to the research instrument that measures what it
 * ASSERTS, or it does not map. Each mapping rule is pinned by a claim that maps and a near miss that
 * must not (shares the symbol or the topic, asserts something the instrument cannot read), because
 * the failure to prevent is a verdict borrowed from a number that measures something else.
 */

const universe = knownSymbols();

const claim = (statement: string, over: Partial<ConvictionClaim> = {}): ConvictionClaim => ({
  tag: "underrated",
  statement,
  bucket: "tested",
  evidence: "Cited elsewhere.",
  falsifier: "Proven wrong by 2026-12-01.",
  ...over,
});

const reads = (statement: string) => assertionOf(claim(statement))?.reads ?? null;

describe("which assertion an instrument measures", () => {
  it("maps each house assertion from the sentence a member would write", () => {
    expect(reads("CRWV premiums are rich after the drop: puts overprice CRWV's downside.")).toBe(
      "premium-richness",
    );
    expect(reads("Sell puts before the print: the pre-print premium is worth selling.")).toBe(
      "pre-print-put",
    );
    expect(reads("The floor: more pullback first. CRWV's floor is probably $48–$52.")).toBe(
      "floor",
    );
    expect(reads("How long the drop lasts: back above today's price in 3 to 6 months.")).toBe(
      "recovery",
    );
    expect(reads("NVDA runs up into its print.")).toBe("run-up");
  });

  it("does not map a claim that only shares the topic, the symbol or a word", () => {
    // Same symbol and a print, but it asserts options UNDER-priced the move: no implied-move history.
    expect(
      reads(
        "Hold through earnings toward the recovery: CRWV's print moves run larger than priced.",
      ),
    ).toBeNull();
    // Post-print: the stock's drift is measured, a call's value after the vol crush is not.
    expect(
      reads(
        "Buy calls after the print: post-print value after the vol crush, about 6 sessions after.",
      ),
    ).toBeNull();
    expect(reads("Backlog and NVIDIA's stake cushion the downside.")).toBeNull();
    expect(
      reads("In the long run, AI adopters win. A worldview; it never sizes a trade."),
    ).toBeNull();
    expect(reads("Election-season sentiment against AI spending is a headwind.")).toBeNull();
    // 'premium' without 'rich', and 'sell' without a put before a print.
    expect(reads("The pre-print premium is worth selling.")).toBeNull();
    expect(reads("Sell calls into strength.")).toBeNull();
  });

  it("does not map a sentence that matches two assertions: ambiguous is not measured", () => {
    expect(
      reads("The floor is in, and CRWV premiums are rich after the drop; puts overprice it."),
    ).toBeNull();
  });

  it("ties every assertion to an instrument that exists and a measures line a member can read", () => {
    for (const a of ASSERTIONS) {
      expect(["premium-fit", "cycle-phase", "earnings-cycle"]).toContain(a.instrument);
      expect(a.measures.length).toBeGreaterThan(20);
    }
    expect(new Set(ASSERTIONS.map((a) => a.reads)).size).toBe(ASSERTIONS.length);
  });
});

describe("the symbol a claim names", () => {
  it("takes the one ticker in its own words, statement first", () => {
    expect(claimSymbol(claim("NVDA runs up into its print."), universe)).toBe("NVDA");
    expect(
      claimSymbol(claim("Premiums are rich.", { evidence: "CRWV fell 5 of 5." }), universe),
    ).toBe("CRWV");
    expect(
      claimSymbol(
        claim("Back above today's price.", {
          evidence: "n/a",
          falsifier: "No CRWV close by 2027-02-01.",
        }),
        universe,
      ),
    ).toBe("CRWV");
  });

  it("refuses a claim that names two names: it is about a basket, and the instruments read one name", () => {
    expect(claimSymbol(claim("NVDA and CRWV run up into their prints."), universe)).toBeNull();
  });

  it("ignores words that are not known tickers", () => {
    expect(claimSymbol(claim("IV and the CPI print matter."), universe)).toBeNull();
    expect(claimSymbol(claim("The AI basket beats QQQ."), universe)).toBeNull();
  });

  it("falls back to the symbol the conviction's steered pairs share, only when they share exactly one", () => {
    expect(claimSymbol(claim("Premiums are rich."), universe, "CRWV")).toBe("CRWV");
    expect(contextSymbolOf(AI_DIP_2026_10)).toBe("CRWV");
    expect(
      contextSymbolOf({ ...AI_DIP_2026_10, steers: ["CRWV-WHEEL", "S1-NVDA"] }),
    ).toBeUndefined();
  });
});

describe("planClaim: study, offer or untestable", () => {
  const ctx = { universe, contextSymbol: "CRWV" };

  it("runs a study when an instrument measures the assertion and the claim names a symbol", () => {
    const plan = planClaim(claim("NVDA runs up into its print."), ctx);
    expect(plan).toMatchObject({ kind: "study", instrument: "earnings-cycle", symbol: "NVDA" });
  });

  it("offers a forward test when no instrument measures it but the claim can be scored on a day", () => {
    const plan = planClaim(
      claim("The print moves more than priced.", {
        bucket: "forward",
        scoreBy: "2026-11-17",
        falsifier: "It moves less than its straddle by 2026-11-17.",
      }),
      ctx,
    );
    expect(plan.kind).toBe("offer");
    if (plan.kind !== "offer" || plan.study.disposition !== "offer")
      throw new Error("not an offer");
    expect(plan.study.size).toBe(0);
    expect(plan.study.forwardTest).toEqual({
      hypothesis: "The print moves more than priced.",
      falsifier: "It moves less than its straddle by 2026-11-17.",
      scoreBy: "2026-11-17",
    });
    expect(plan.study.reason).toMatch(/no research instrument measures/);
  });

  it("labels a claim untestable at size zero when it has neither an instrument nor a day to be scored on", () => {
    const plan = planClaim(claim("The market is wrong about something unmeasurable."), ctx);
    expect(plan.kind).toBe("untestable");
    if (plan.kind === "study") throw new Error("not a study");
    expect(plan.study).toMatchObject({ disposition: "untestable", size: 0 });
    expect(plan.study.disposition === "untestable" && plan.study.reason).toMatch(
      /nothing to forward-test/,
    );
  });

  it("respects a claim the record marks untestable even when its falsifier has a date", () => {
    const plan = planClaim(
      claim("Backlog cushions the downside.", { bucket: "untestable", scoreBy: "2026-11-16" }),
      ctx,
    );
    expect(plan.kind).toBe("untestable");
  });

  it("falls to the forward-test path when an instrument measures it but the claim names no single symbol", () => {
    const plan = planClaim(
      claim("NVDA and CRWV run up into their prints.", {
        bucket: "forward",
        scoreBy: "2026-11-30",
      }),
      ctx,
    );
    expect(plan.kind).toBe("offer");
    expect(
      plan.kind === "offer" && plan.study.disposition === "offer" && plan.study.reason,
    ).toMatch(/earnings-cycle measures this, but the claim names no single symbol/);
  });

  it("maps on the statement, never on the evidence the member cited for it", () => {
    const plan = planClaim(
      claim("Hold through earnings.", {
        evidence: "CRWV premiums are rich after the drop; puts overprice the downside.",
      }),
      ctx,
    );
    expect(plan.kind).toBe("untestable");
  });
});

describe("the seeded AI-dip conviction", () => {
  const plans = AI_DIP_2026_10.claims.map((c) =>
    planClaim(c, { universe, contextSymbol: contextSymbolOf(AI_DIP_2026_10) }),
  );
  const label = (c: ConvictionClaim) => c.statement.match(/^(\d+[a-z]?)\./)?.[1];

  it("maps 1, 2a, 5, 7 and 8 to instruments; offers 2b, 4 and 9; leaves 3, 3b, 6 and 10–12 untestable", () => {
    const byLabel = Object.fromEntries(
      AI_DIP_2026_10.claims.map((c, i) => {
        const p = plans[i];
        return [label(c), p?.kind === "study" ? `${p.instrument}/${p.reads}/${p.symbol}` : p?.kind];
      }),
    );
    expect(byLabel).toEqual({
      "1": "premium-fit/premium-richness/CRWV",
      "2a": "cycle-phase/pre-print-put/CRWV",
      "2b": "offer",
      "3": "untestable",
      "4": "offer",
      "5": "earnings-cycle/run-up/NVDA",
      "6": "untestable",
      "7": "cycle-phase/floor/CRWV",
      "8": "cycle-phase/recovery/CRWV",
      "9": "offer",
      "3b": "untestable",
      "10": "untestable",
      "11": "untestable",
      "12": "untestable",
    });
  });

  it("carries a study on every claim, and each one is the disposition the mapping says", () => {
    AI_DIP_2026_10.claims.forEach((c, i) => {
      const plan = plans[i];
      expect(c.study, `claim ${label(c)} has no study; run npm run research:claims`).toBeDefined();
      expect(c.study?.disposition).toBe(plan?.kind === "study" ? "studied" : plan?.kind);
      if (c.study && plan?.kind === "study" && c.study.disposition === "studied") {
        expect(c.study.instrument).toBe(plan.instrument);
        expect(c.study.symbol).toBe(plan.symbol);
      }
    });
  });

  it("never lets a studied claim size anything, and pins the rest to size zero", () => {
    for (const c of AI_DIP_2026_10.claims) {
      const s = c.study as ClaimStudy;
      expect(studyProblems(s)).toEqual([]);
      if (s.disposition === "studied") expect(s).not.toHaveProperty("size");
      else expect(s.size).toBe(0);
    }
  });

  it("carries each verdict's dated falsifier from the claim itself", () => {
    for (const c of AI_DIP_2026_10.claims) {
      if (c.study?.disposition === "studied") {
        expect(c.study.verdict.falsifier).toBe(c.falsifier);
        expect(c.study.verdict.scoreBy).toBe(c.scoreBy);
      }
    }
  });

  it("has no ledger entry that no longer attaches to a claim (a re-read claim is studied afresh)", () => {
    const entries =
      (ledger as unknown as Record<string, StudyLedgerEntry[]>)[AI_DIP_2026_10.id] ?? [];
    const statements = new Set(AI_DIP_2026_10.claims.map((c) => c.statement));
    for (const e of entries) expect(statements.has(e.statement)).toBe(true);
    expect(entries).toHaveLength(AI_DIP_2026_10.claims.length);
  });
});

describe("withStudies", () => {
  const record: Conviction = {
    ...AI_DIP_2026_10,
    claims: [claim("Premiums are rich."), claim("Second claim.")],
  };
  const untestable: ClaimStudy = { disposition: "untestable", size: 0, reason: "No feed." };

  it("attaches an entry to the claim that still says exactly what it said", () => {
    const out = withStudies(record, [{ statement: "Premiums are rich.", study: untestable }]);
    expect(out.claims[0]?.study).toEqual(untestable);
    expect(out.claims[1]?.study).toBeUndefined();
  });

  it("drops an entry whose claim was re-read: the old verdict belongs to the old sentence", () => {
    const out = withStudies(record, [{ statement: "Premiums are VERY rich.", study: untestable }]);
    expect(out.claims.every((c) => c.study === undefined)).toBe(true);
  });

  it("never serves an entry that breaks the call-sheet contract", () => {
    const sized = {
      disposition: "untestable",
      size: 5,
      reason: "No feed.",
    } as unknown as ClaimStudy;
    const undated = {
      disposition: "studied",
      instrument: "premium-fit",
      measures: "m",
      symbol: "CRWV",
      dataDate: "2026-10-16",
      verdict: {
        reading: "mixed",
        call: "c",
        confidence: "low",
        why: "w",
        falsifier: "later",
        numbers: {},
      },
    } as ClaimStudy;
    const out = withStudies(record, [
      { statement: "Premiums are rich.", study: sized },
      { statement: "Second claim.", study: undated },
    ]);
    expect(out.claims.every((c) => c.study === undefined)).toBe(true);
  });
});

describe("studyProblems", () => {
  const verdict = {
    reading: "supports",
    call: "More pullback first.",
    confidence: "low",
    why: "cycle-phase",
    falsifier: "Outside the band by 2027-01-19.",
    numbers: {},
  } as const;
  const studied = (over: Record<string, unknown> = {}) =>
    ({
      disposition: "studied",
      instrument: "cycle-phase",
      measures: "m",
      symbol: "CRWV",
      dataDate: "2026-10-16",
      verdict,
      ...over,
    }) as unknown as ClaimStudy;

  it("passes a graded, dated verdict", () => {
    expect(studyProblems(studied())).toEqual([]);
  });

  it("refuses a verdict with a size, an undated falsifier, an unknown instrument or a bad data date", () => {
    expect(studyProblems(studied({ size: 1 }))).toContain("a verdict never sizes a trade");
    expect(studyProblems(studied({ verdict: { ...verdict, falsifier: "soon" } }))).toContain(
      "the falsifier is not dated (name a day, or set scoreBy)",
    );
    expect(
      studyProblems(studied({ verdict: { ...verdict, falsifier: "soon", scoreBy: "2027-01-20" } })),
    ).toEqual([]);
    expect(studyProblems(studied({ instrument: "tarot" }))).toContain("instrument is unknown");
    expect(studyProblems(studied({ dataDate: "2026-13-40" }))).toContain(
      "dataDate is not a calendar day",
    );
    expect(studyProblems(studied({ verdict: { ...verdict, confidence: "certain" } }))).toContain(
      "confidence is not graded",
    );
  });

  it("reports a malformed entry in words instead of throwing", () => {
    expect(
      studyProblems({ disposition: "offer", size: 0, reason: "x" } as unknown as ClaimStudy),
    ).toContain("the forward test has no hypothesis");
    expect(studyProblems({ disposition: "studied" } as unknown as ClaimStudy)).toEqual([
      "a studied claim carries a verdict",
    ]);
    expect(studyProblems({ disposition: "mystery" } as unknown as ClaimStudy)).toEqual([
      "disposition is not studied/offer/untestable",
    ]);
  });
});
