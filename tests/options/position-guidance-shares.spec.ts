import {
  decisionDate,
  ledgerReason,
  sharesCall,
} from "../../src/options/position-guidance-shares.js";
import type {
  EarningsWindow,
  GuidanceInputs,
  GuidanceStake,
  LeverCall,
} from "../../src/options/position-guidance-types.js";

/**
 * The shares lever, exercised directly with literal inputs (#3729). The engine-level specs in
 * `position-guidance.spec.ts` reach it through a priced chain and only check the headline verdicts;
 * here every branch — the BUY licence, the decision zone's edges, the reason budget, the research
 * line's own falsifier — is checked against the sentence a member would read.
 */

const ESTIMATE: EarningsWindow = {
  start: "2026-11-09",
  end: "2026-11-16",
  status: "estimate",
  source: "8-K cadence",
};
const CONFIRMED: EarningsWindow = { ...ESTIMATE, status: "confirmed" };
/** Five sessions before Nov 9 (Mon): Nov 2. */
const DECISION = "2026-11-02";

const NO_BUY = {
  buySignal: false,
  buyConfidence: "none",
  stance: "Stand aside — no buy signal exists",
  source: "ledger",
} as const satisfies NonNullable<GuidanceInputs["ledger"]>;

const BUY_HIGH = {
  buySignal: true,
  buyConfidence: "high",
  stance: "Buy · S2 · E1",
  source: "ledger",
} as const satisfies NonNullable<GuidanceInputs["ledger"]>;

function inputs(over: Partial<GuidanceInputs> = {}): GuidanceInputs {
  return {
    symbol: "CRWV",
    now: "2026-09-25T18:00:00Z",
    spot: 80,
    sessionOpen: true,
    stake: { shares: 400, costBasis: 70, goal: "income" },
    chain: [],
    catalysts: [],
    pulse: [],
    ...over,
  };
}

const stakeOf = (stake: GuidanceStake, over: Partial<GuidanceInputs> = {}): GuidanceInputs =>
  inputs({ stake, ...over });

function callOn(input: GuidanceInputs, today = "2026-09-25"): LeverCall {
  return sharesCall({
    input,
    today,
    strip: [],
    richness: { verdict: "unknown", basis: "none" },
  });
}

const text = (c: LeverCall): string => c.reasons.map((r) => r.text).join(" ");

describe("decisionDate", () => {
  describe("when no earnings window is known", () => {
    it("has no decision date", () => {
      expect(decisionDate(inputs())).toBeUndefined();
    });
  });

  describe("when an earnings window is known", () => {
    it("falls due five sessions before the window opens", () => {
      expect(decisionDate(inputs({ earnings: ESTIMATE }))).toBe(DECISION);
    });

    it("steps over a weekend and over the Thanksgiving closure", () => {
      const window = { ...ESTIMATE, start: "2026-12-01", end: "2026-12-08" };
      expect(decisionDate(inputs({ earnings: window }))).toBe("2026-11-23");
    });

    it("is the same for an estimated and a confirmed window", () => {
      expect(decisionDate(inputs({ earnings: CONFIRMED }))).toBe(DECISION);
    });
  });
});

describe("ledgerReason", () => {
  describe("when research covers the stock", () => {
    it("quotes the ledger's stance under the LEDGER rule", () => {
      expect(ledgerReason(inputs({ ledger: NO_BUY }))).toEqual({
        rule: "LEDGER",
        text: "The research says: Stand aside — no buy signal exists",
      });
    });
  });

  describe("when no research covers the stock", () => {
    it("says nothing supports buying more", () => {
      expect(ledgerReason(inputs())).toEqual({
        rule: "LEDGER",
        text: "No research covers this stock yet, so nothing supports buying more.",
      });
    });
  });
});

describe("when the member holds no shares", () => {
  describe("and research licenses a buy at high confidence", () => {
    it("says BUY at the ledger's own confidence, quoting the research", () => {
      const c = callOn(stakeOf({ goal: "income" }, { ledger: BUY_HIGH }));
      expect(c).toMatchObject({ lever: "shares", call: "BUY", confidence: "high", atOpen: false });
      expect(c.reasons).toEqual([{ rule: "LEDGER", text: "The research says: Buy · S2 · E1" }]);
    });

    it("has no end date and a come-back-if line when no earnings report looms", () => {
      const c = callOn(stakeOf({}, { ledger: BUY_HIGH }));
      expect(c.until).toBeUndefined();
      expect(c.provesWrong).toBe(
        "If the research withdraws its buy signal before you buy → come back here.",
      );
    });

    it("plans the exit before the earnings report and dates it", () => {
      const c = callOn(stakeOf({}, { ledger: BUY_HIGH, earnings: ESTIMATE }));
      expect(c.call).toBe("BUY");
      expect(c.reasons[1]).toEqual({
        rule: "SHARES",
        text: "Plan to be out by Nov 2, before the earnings report.",
      });
      expect(c.until).toEqual({ date: DECISION, why: "be out before the earnings report" });
    });
  });

  describe("and research licenses a buy at medium confidence", () => {
    it("still says BUY — medium is actionable", () => {
      const c = callOn(stakeOf({}, { ledger: { ...BUY_HIGH, buyConfidence: "medium" } }));
      expect(c).toMatchObject({ call: "BUY", confidence: "medium" });
    });
  });

  describe("and research licenses a buy only at low confidence", () => {
    it("stands aside — a low grade is never a small bet", () => {
      const c = callOn(stakeOf({}, { ledger: { ...BUY_HIGH, buyConfidence: "low" } }));
      expect(c.call).toBe("STAND ASIDE");
    });
  });

  describe("and the ledger flags a buy signal with no confidence", () => {
    it("stands aside", () => {
      const c = callOn(stakeOf({}, { ledger: { ...BUY_HIGH, buyConfidence: "none" } }));
      expect(c.call).toBe("STAND ASIDE");
    });
  });

  describe("and research says there is nothing to buy", () => {
    it("stands aside at medium confidence, quoting the research", () => {
      const c = callOn(stakeOf({}, { ledger: NO_BUY }));
      expect(c).toMatchObject({ lever: "shares", call: "STAND ASIDE", confidence: "medium" });
      expect(text(c)).toBe("The research says: Stand aside — no buy signal exists");
    });

    it("says what would change it, undated when no earnings report looms", () => {
      const c = callOn(stakeOf({}, { ledger: NO_BUY }));
      expect(c.provesWrong).toBe("If the research starts supporting a buy → come back here.");
      expect(c.until).toBeUndefined();
    });

    it("dates the come-back-if line at the hold-or-sell date when earnings are coming", () => {
      const c = callOn(stakeOf({}, { ledger: NO_BUY, earnings: ESTIMATE }));
      expect(c.provesWrong).toBe(
        "If the research starts supporting a buy before Nov 2 → come back here.",
      );
    });
  });

  describe("and no research covers the stock", () => {
    it("stands aside at low confidence and says why", () => {
      const c = callOn(stakeOf({ goal: "income" }));
      expect(c).toMatchObject({ call: "STAND ASIDE", confidence: "low" });
      expect(text(c)).toBe("No research covers this stock yet, so nothing supports buying more.");
    });
  });

  describe("and the research states its own falsifier", () => {
    const provesWrong = { quote: "a reclaim of $95", asOf: "2026-10-01" };

    it("quotes it, dated, instead of the lever's own line when standing aside", () => {
      const c = callOn(stakeOf({}, { ledger: { ...NO_BUY, provesWrong } }));
      expect(c.provesWrong).toBe('The research, as of Oct 1: "a reclaim of $95" → come back here.');
    });

    it("quotes it instead of the lever's own line when buying", () => {
      const c = callOn(stakeOf({}, { ledger: { ...BUY_HIGH, provesWrong } }));
      expect(c.call).toBe("BUY");
      expect(c.provesWrong).toBe('The research, as of Oct 1: "a reclaim of $95" → come back here.');
    });

    it("omits the date when the ledger gave none", () => {
      const c = callOn(stakeOf({}, { ledger: { ...NO_BUY, provesWrong: { quote: "a reclaim" } } }));
      expect(c.provesWrong).toBe('The research: "a reclaim" → come back here.');
    });
  });

  describe("and the share count is zero, negative or absent", () => {
    it.each([
      ["zero", { shares: 0 }],
      ["negative", { shares: -5 }],
      ["absent", {}],
    ] as const)("is treated as a non-holder when it is %s", (_label, stake) => {
      expect(callOn(stakeOf(stake, { ledger: NO_BUY })).call).toBe("STAND ASIDE");
    });
  });

  describe("and their goal is exit", () => {
    it("is never told to SELL shares they do not own", () => {
      const c = callOn(stakeOf({ goal: "exit" }, { ledger: NO_BUY }));
      expect(c.call).toBe("STAND ASIDE");
    });
  });
});

describe("when the member holds shares and wants out", () => {
  const exit = { shares: 400, costBasis: 70, goal: "exit" } as const;

  it("says SELL at medium confidence and that it is a taxable sale", () => {
    const c = callOn(stakeOf(exit));
    expect(c).toMatchObject({ lever: "shares", call: "SELL", confidence: "medium", atOpen: false });
    expect(c.reasons[0]).toEqual({
      rule: "GOAL",
      text: "You said you want out. The covered-call row shows strikes that pay you to leave.",
    });
    expect(c.reasons[1]).toEqual({
      rule: "SHARES",
      text: "Selling is a taxable sale — check what it means for you before you do it.",
    });
  });

  it("names what they paid, as a shaper of strikes and never of the sell call", () => {
    const c = callOn(stakeOf(exit));
    expect(c.reasons[2]?.text).toBe(
      "What you paid ($70.00) shapes which strikes are safe to sell — it never decides whether to hold.",
    );
  });

  it("drops the cost-basis line when the member has not said what they paid", () => {
    const c = callOn(stakeOf({ shares: 400, goal: "exit" }));
    expect(c.reasons).toHaveLength(2);
    expect(text(c)).not.toContain("What you paid");
  });

  it("makes the call hinge on their own goal, with no end date", () => {
    const c = callOn(stakeOf(exit));
    expect(c.provesWrong).toBe("If you change your goal → the guidance changes with it.");
    expect(c.until).toBeUndefined();
  });

  it("says SELL even when the member has a loss — cost basis never drives the call", () => {
    expect(callOn(stakeOf({ shares: 400, costBasis: 500, goal: "exit" })).call).toBe("SELL");
    expect(callOn(stakeOf({ shares: 400, costBasis: 1, goal: "exit" })).call).toBe("SELL");
  });

  it("still says SELL, not DECIDE, inside the earnings decision zone", () => {
    const c = callOn(stakeOf(exit, { earnings: ESTIMATE }), "2026-11-05");
    expect(c.call).toBe("SELL");
  });
});

describe("when the member holds shares inside the earnings decision zone", () => {
  const income = { shares: 400, costBasis: 70, goal: "income" } as const;

  it("states both choices side by side and picks neither", () => {
    const c = callOn(stakeOf(income, { earnings: ESTIMATE, ledger: NO_BUY }), "2026-11-05");
    expect(c).toMatchObject({ lever: "shares", call: "DECIDE", confidence: "medium" });
    expect(c.reasons[0]?.text).toBe(
      "Earnings are due Nov 9–16, estimated. Hold through: the stock can jump or drop sharply overnight, and nobody can call which way.",
    );
    expect(c.reasons[1]?.text).toBe(
      "Sell before: you trade the unknown earnings move for a price you can see. Selling is a taxable sale — check what it means for you before you do it.",
    );
  });

  it("closes the third line with the research for an income holder", () => {
    const c = callOn(stakeOf(income, { earnings: ESTIMATE, ledger: NO_BUY }), "2026-11-05");
    expect(c.reasons[2]).toEqual({
      rule: "LEDGER",
      text: "The research says: Stand aside — no buy signal exists",
    });
  });

  it("closes the third line with their own goal for a keep-shares holder", () => {
    const c = callOn(
      stakeOf({ ...income, goal: "keep-shares" }, { earnings: ESTIMATE, ledger: NO_BUY }),
      "2026-11-05",
    );
    expect(c.call).toBe("DECIDE");
    expect(c.reasons[2]).toEqual({
      rule: "GOAL",
      text: "You said you want to keep the shares — holding through is consistent with that.",
    });
  });

  it("asks a holder with no goal to decide too, never handing them a bare SELL", () => {
    const c = callOn(stakeOf({ shares: 400, costBasis: 70 }, { earnings: ESTIMATE }), "2026-11-05");
    expect(c.call).toBe("DECIDE");
  });

  it("drops the window's estimated tag once the date is confirmed", () => {
    const c = callOn(stakeOf(income, { earnings: CONFIRMED }), "2026-11-05");
    expect(c.reasons[0]?.text).toMatch(/^Earnings are due Nov 9–16\. Hold through/);
  });

  it("runs until the window closes and says how the guess would be proved wrong", () => {
    const c = callOn(stakeOf(income, { earnings: ESTIMATE }), "2026-11-05");
    expect(c.until).toEqual({
      date: "2026-11-16",
      why: "the earnings window closes — refresh the guidance on the new prices",
    });
    expect(c.provesWrong).toBe(
      "If the earnings report passes and the stock moves less than a normal day's range → the risk was smaller than feared.",
    );
  });

  describe("at the edges of the zone", () => {
    const at = (today: string) => callOn(stakeOf(income, { earnings: ESTIMATE }), today).call;

    it("is still HOLD the day before the decision date", () => {
      expect(at("2026-11-01")).toBe("HOLD");
    });

    it("turns to DECIDE on the decision date itself", () => {
      expect(at(DECISION)).toBe("DECIDE");
    });

    it("is still DECIDE on the last day of the window", () => {
      expect(at("2026-11-16")).toBe("DECIDE");
    });

    it("goes back to HOLD the day after the window closes", () => {
      expect(at("2026-11-17")).toBe("HOLD");
    });
  });
});

describe("when the member holds shares outside the decision zone", () => {
  const income = { shares: 400, costBasis: 70, goal: "income" } as const;

  describe("with no earnings report or research signal on the calendar", () => {
    it("says HOLD at medium confidence and that nothing suggests a change", () => {
      const c = callOn(stakeOf(income));
      expect(c).toMatchObject({
        lever: "shares",
        call: "HOLD",
        confidence: "medium",
        atOpen: false,
      });
      expect(c.reasons[0]?.text).toBe(
        "Nothing suggests a change — no earnings report or research signal is on the calendar.",
      );
    });

    it("has no end date and falls back to the company-news falsifier", () => {
      const c = callOn(stakeOf(income));
      expect(c.until).toBeUndefined();
      expect(c.provesWrong).toBe(
        "If the stock makes a big move on company-specific news → come back here.",
      );
    });
  });

  describe("with an estimated earnings window ahead", () => {
    it("holds until the decision date, naming what to decide then", () => {
      const c = callOn(stakeOf(income, { earnings: ESTIMATE }));
      expect(c.call).toBe("HOLD");
      expect(c.reasons[0]?.text).toBe(
        "Nothing suggests a change before Nov 2, when you decide whether to hold through earnings.",
      );
      expect(c.until).toEqual({
        date: DECISION,
        why: "decide whether to hold through earnings (Nov 9–16, estimated)",
      });
    });

    it("says an announced date would bring the decision sooner", () => {
      const c = callOn(stakeOf(income, { earnings: ESTIMATE }));
      expect(c.provesWrong).toBe(
        "If the company announces its earnings date before Nov 2 → come back here; the decision comes sooner.",
      );
    });
  });

  describe("with a confirmed earnings window ahead", () => {
    it("keeps the end date but there is no announcement left to wait for", () => {
      const c = callOn(stakeOf(income, { earnings: CONFIRMED }));
      expect(c.until?.date).toBe(DECISION);
      expect(c.until?.why).toBe("decide whether to hold through earnings (Nov 9–16)");
      expect(c.provesWrong).toBe(
        "If the stock makes a big move on company-specific news → come back here.",
      );
    });
  });

  describe("with no goal picked", () => {
    it("asks them to pick one rather than assuming income", () => {
      const c = callOn(stakeOf({ shares: 400, costBasis: 70 }));
      expect(c.call).toBe("HOLD");
      expect(c.reasons[1]).toEqual({
        rule: "GOAL",
        text: "Pick a goal — keep the shares, earn income, or exit. It changes which strikes fit.",
      });
    });

    it("does not nag a member who already chose", () => {
      for (const goal of ["income", "keep-shares"] as const) {
        expect(text(callOn(stakeOf({ shares: 400, goal })))).not.toContain("Pick a goal");
      }
    });
  });

  describe("with research and a cost basis to report", () => {
    it("lists the research and what they paid, in that order", () => {
      const c = callOn(stakeOf(income, { ledger: BUY_HIGH }));
      expect(c.reasons.map((r) => r.rule)).toEqual(["SHARES", "LEDGER", "SHARES"]);
      expect(c.reasons[1]?.text).toBe("The research says: Buy · S2 · E1");
      expect(c.reasons[2]?.text).toBe(
        "What you paid ($70.00) shapes which strikes are safe to sell — it never decides whether to hold.",
      );
    });

    it("keeps to three reasons, most important first — the cost basis is the one to go", () => {
      const c = callOn(stakeOf({ shares: 400, costBasis: 70 }, { ledger: NO_BUY }));
      expect(c.reasons.map((r) => r.rule)).toEqual(["SHARES", "GOAL", "LEDGER"]);
    });

    it("says HOLD whatever the cost basis — sunk cost never drives the call", () => {
      for (const costBasis of [1, 80, 500]) {
        expect(callOn(stakeOf({ shares: 400, costBasis, goal: "income" })).call).toBe("HOLD");
      }
    });
  });

  describe("with no research covering the stock", () => {
    it("says so rather than leaving the line out", () => {
      const c = callOn(stakeOf(income));
      expect(text(c)).toContain("No research covers this stock yet");
    });
  });
});
