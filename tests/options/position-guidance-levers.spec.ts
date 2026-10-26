import type { LadderResult } from "../../src/options/position-guidance-ladder.js";
import {
  cashSecuredPutCall,
  coveredCallCall,
  type LeverContext,
  ledgerFalsifier,
  lever,
  why,
  windowText,
} from "../../src/options/position-guidance-levers.js";
import type {
  DteMark,
  EarningsWindow,
  GuidanceInputs,
  LadderRow,
  LeverCall,
  Richness,
} from "../../src/options/position-guidance-types.js";

/**
 * The option levers, exercised directly with hand-built ladders and strips (#3729). The engine-level
 * specs in `position-guidance.spec.ts` reach this module through a priced chain; here every input is
 * a literal, so each sentence a member reads can be checked against arithmetic done by hand.
 */

const TODAY = "2026-09-25";

const ESTIMATE: EarningsWindow = {
  start: "2026-11-09",
  end: "2026-11-16",
  status: "estimate",
  source: "8-K cadence",
};
const CONFIRMED: EarningsWindow = { ...ESTIMATE, status: "confirmed" };

const mark = (expiration: string, dte: number, verdict: DteMark["verdict"] = "in"): DteMark => ({
  expiration,
  dte,
  verdict,
  catalysts: [],
});

/** Two usable expiries (14 and 28 days out) and one that crosses the print. */
const STRIP: readonly DteMark[] = [
  mark("2026-10-02", 7, "too-short"),
  mark("2026-10-09", 14),
  mark("2026-10-23", 28),
  mark("2026-11-13", 49, "spans-print"),
];

/** Every listed expiry is out of band. */
const CLOSED_STRIP: readonly DteMark[] = [
  mark("2026-10-02", 7, "too-short"),
  mark("2026-11-13", 49, "spans-print"),
];

const row = (over: Partial<LadderRow> = {}): LadderRow => ({
  lever: "covered-calls",
  expiration: "2026-10-23",
  dte: 28,
  strike: 100,
  bid: 1.5,
  mid: 1.55,
  annualizedYield: 0.2,
  probAssigned: 0.2,
  probTouch: 0.36,
  delta: 0.2,
  contracts: 1,
  maxContracts: 4,
  ...over,
});

const NO_DROPS: LadderResult["dropped"] = {
  quote: 0,
  stale: 0,
  thin: 0,
  otm: 0,
  basis: 0,
  delta: 0,
  own: 0,
  cash: 0,
};
const ladderOf = (...rows: LadderRow[]): LadderResult => ({ rows, dropped: NO_DROPS });
const emptyLadder = (dropped: Partial<LadderResult["dropped"]> = {}): LadderResult => ({
  rows: [],
  dropped: { ...NO_DROPS, ...dropped },
});

const RICH_RANK: Richness = { verdict: "rich", basis: "iv-rank", ivRank: 85 };
const MIDDLING_RANK: Richness = { verdict: "middling", basis: "iv-rank", ivRank: 50 };
const RICH_RATIO: Richness = {
  verdict: "rich",
  basis: "iv-vs-realized",
  atmIv: 0.8,
  realizedVol: 0.6,
};
const CHEAP_RATIO: Richness = {
  verdict: "cheap",
  basis: "iv-vs-realized",
  atmIv: 0.5,
  realizedVol: 0.6,
};
const MIDDLING_RATIO: Richness = {
  verdict: "middling",
  basis: "iv-vs-realized",
  atmIv: 0.65,
  realizedVol: 0.6,
};
const UNKNOWN: Richness = { verdict: "unknown", basis: "none" };

function ctx(over: Partial<GuidanceInputs> = {}, richness: Richness = RICH_RANK, strip = STRIP) {
  const input: GuidanceInputs = {
    symbol: "CRWV",
    now: `${TODAY}T18:00:00Z`,
    spot: 90,
    sessionOpen: true,
    stake: { shares: 400, costBasis: 90, cash: 40_000, goal: "income" },
    chain: [],
    catalysts: [],
    pulse: [],
    ...over,
  };
  const context: LeverContext = { input, today: TODAY, strip, richness };
  return context;
}

const text = (c: LeverCall) => c.reasons.map((r) => r.text).join(" | ");
const rules = (c: LeverCall) => c.reasons.map((r) => r.rule);

describe("the small helpers", () => {
  describe("when a lever call is assembled", () => {
    it("keeps at most the three most important reasons, in order", () => {
      const reasons = ["a", "b", "c", "d"].map((t) => why("SIZE", t));
      const call = lever({
        lever: "covered-calls",
        call: "WAIT",
        confidence: "medium",
        reasons,
        provesWrong: "x",
      });
      expect(call.reasons.map((r) => r.text)).toEqual(["a", "b", "c"]);
    });

    it("is never marked as a plan for the open — the caller decides that later", () => {
      const call = lever({
        lever: "cash-secured-puts",
        call: "WAIT",
        confidence: "low",
        reasons: [],
        provesWrong: "x",
      });
      expect(call.atOpen).toBe(false);
    });
  });

  describe("when the earnings window is described", () => {
    it("says plainly that nothing is on the calendar when there is no window", () => {
      expect(windowText(ctx().input)).toBe("no earnings report on the calendar");
    });

    it("labels a cadence guess as estimated, as a span", () => {
      expect(windowText(ctx({ earnings: ESTIMATE }).input)).toBe("Nov 9–16, estimated");
    });

    it("does not call a confirmed window an estimate", () => {
      expect(windowText(ctx({ earnings: CONFIRMED }).input)).toBe("Nov 9–16");
    });
  });

  describe("when the research ledger's own falsifier is quoted", () => {
    const ledger = (provesWrong?: { quote: string; asOf?: string }) =>
      ctx({
        ledger: {
          buySignal: false,
          buyConfidence: "none",
          stance: "Stand aside",
          source: "ledger",
          ...(provesWrong ? { provesWrong } : {}),
        },
      }).input;

    it("is absent when there is no ledger at all", () => {
      expect(ledgerFalsifier(ctx().input)).toBeUndefined();
    });

    it("is absent when the ledger states no falsifier, so the lever keeps its own", () => {
      expect(ledgerFalsifier(ledger())).toBeUndefined();
    });

    it("quotes the ledger's words with the day it was assessed", () => {
      expect(ledgerFalsifier(ledger({ quote: "a close above $100", asOf: "2026-09-24" }))).toBe(
        'The research, as of Sep 24: "a close above $100" → come back here.',
      );
    });

    it("drops the 'as of' clause when the ledger gave no date", () => {
      expect(ledgerFalsifier(ledger({ quote: "a close above $100" }))).toBe(
        'The research: "a close above $100" → come back here.',
      );
    });
  });
});

describe("the covered-call lever", () => {
  describe("when no call can be offered at all", () => {
    it("says NOT AVAILABLE with the share count when under 100 shares are held", () => {
      const c = coveredCallCall(ctx({ stake: { shares: 50, goal: "income" } }), ladderOf(row()));
      expect(c.call).toBe("NOT AVAILABLE");
      expect(c.confidence).toBe("none");
      expect(rules(c)).toEqual(["COVERAGE"]);
      expect(text(c)).toBe("Covered calls need 100 shares per contract — you hold 50.");
      expect(c.provesWrong).toBe("—");
      expect(c.until).toBeUndefined();
    });

    it("treats an unset share count as holding none", () => {
      const c = coveredCallCall(ctx({ stake: { goal: "income" } }), ladderOf(row()));
      expect(c.call).toBe("NOT AVAILABLE");
      expect(text(c)).toContain("you hold 0");
    });

    it("says nothing is left to cover when every 100-share lot already has a call sold", () => {
      const c = coveredCallCall(
        ctx({ stake: { shares: 450, costBasis: 90, goal: "income", callsSold: 4 } }),
        ladderOf(row()),
      );
      expect(c.call).toBe("NOT AVAILABLE");
      expect(rules(c)).toEqual(["COVERAGE"]);
      expect(text(c)).toContain("All 4 of your 100-share lots already have a call sold");
    });

    it("counts calls open in the member's account against the lots too", () => {
      const openCall = {
        occ: "CRWV261023C00100000",
        strike: 100,
        expiration: "2026-10-23",
        contracts: 2,
        premium: 1.2,
      };
      const c = coveredCallCall(
        ctx({ stake: { shares: 200, costBasis: 90, goal: "income", openCalls: [openCall] } }),
        ladderOf(row()),
      );
      expect(c.call).toBe("NOT AVAILABLE");
      expect(text(c)).toContain("All 2 of your 100-share lots");
    });

    it("asks for a goal before it will offer a strike, and never defaults one", () => {
      const c = coveredCallCall(ctx({ stake: { shares: 400, costBasis: 90 } }), ladderOf(row()));
      expect(c.call).toBe("NOT AVAILABLE");
      expect(rules(c)).toEqual(["GOAL"]);
      expect(text(c)).toContain("Pick a goal first");
    });

    it("asks what the member paid before any strike when the goal is to keep or earn", () => {
      for (const goal of ["income", "keep-shares"] as const) {
        const c = coveredCallCall(ctx({ stake: { shares: 400, goal } }), ladderOf(row()));
        expect(c.call).toBe("NOT AVAILABLE");
        expect(rules(c)).toEqual(["STRIKE-BASIS"]);
        expect(text(c)).toContain("Enter what you paid per share first");
      }
    });

    it("does not need a basis from someone who wants out — the basis stops protecting strikes", () => {
      const c = coveredCallCall(ctx({ stake: { shares: 400, goal: "exit" } }), ladderOf(row()));
      expect(c.call).toBe("WRITE");
    });
  });

  describe("when every expiry is out of band", () => {
    it("waits at medium, naming the three ways an expiry is ruled out", () => {
      const c = coveredCallCall(ctx({}, RICH_RANK, CLOSED_STRIP), ladderOf(row()));
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("medium");
      expect(rules(c)).toEqual(["DTE-PRINT"]);
      expect(text(c)).toContain("under 7 days away, runs past your hold-or-sell date");
      expect(c.provesWrong).toBe(
        "If a new expiry is listed inside the safe range → come back here.",
      );
    });

    it("names the earnings window and sets the next decision for when it ends", () => {
      const c = coveredCallCall(
        ctx({ earnings: ESTIMATE }, RICH_RANK, CLOSED_STRIP),
        ladderOf(row()),
      );
      expect(text(c)).toContain("(Nov 9–16, estimated)");
      expect(c.until).toEqual({
        date: "2026-11-16",
        why: "the earnings report passes and a clean set of expiries opens",
      });
    });

    it("has no 'until' date when there is no earnings report to wait out", () => {
      const c = coveredCallCall(ctx({}, RICH_RANK, CLOSED_STRIP), ladderOf(row()));
      expect(c.until).toBeUndefined();
      expect(text(c)).toContain("no earnings report on the calendar");
    });
  });

  describe("when no strike passes the checks", () => {
    it("waits at medium and explains with the two rules that removed the most strikes", () => {
      const c = coveredCallCall(ctx(), emptyLadder({ quote: 2, thin: 9, delta: 5, basis: 1 }));
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("medium");
      expect(rules(c)).toEqual(["PRICE-AT-BID", "DTE-FLOOR"]);
      const first = c.reasons[0]?.text ?? "";
      expect(first).toBe(
        "No strike passes our checks: 9 too few contracts open (under 100); 5 more than a 30% chance of being exercised.",
      );
      expect(first).not.toContain("below what you paid");
    });

    it("says no prices were available in range when nothing was even counted", () => {
      const c = coveredCallCall(ctx(), emptyLadder());
      expect(c.reasons[0]?.text).toBe("No strike passes our checks: no prices available in range.");
    });

    it("explains the expiry band in plain words when there is no earnings report", () => {
      const c = coveredCallCall(ctx(), emptyLadder({ quote: 1 }));
      expect(c.reasons[1]?.text).toBe(
        "Only expiries 14–28 days out (through Oct 23). Under 7 days, the premium isn't worth the risk.",
      );
    });

    it("watches for the earnings date being announced when the window is only an estimate", () => {
      const c = coveredCallCall(ctx({ earnings: ESTIMATE }), emptyLadder({ quote: 1 }));
      expect(c.provesWrong).toBe(
        "If the company announces its earnings date for on or before Oct 23 → come back here; that expiry would then cross the report.",
      );
    });

    it("watches option prices instead when the earnings date is confirmed or absent", () => {
      for (const earnings of [CONFIRMED, undefined]) {
        const c = coveredCallCall(ctx(earnings ? { earnings } : {}), emptyLadder({ quote: 1 }));
        expect(c.provesWrong).toBe(
          "If option prices fall below how much the stock actually moves → come back here.",
        );
      }
    });
  });

  describe("when premium is not rich enough to sell", () => {
    it("waits at low on a proxy reading that says options are underpaid", () => {
      const c = coveredCallCall(ctx({}, CHEAP_RATIO), ladderOf(row()));
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("low");
      expect(rules(c)).toEqual(["RICHNESS", "DTE-FLOOR"]);
      expect(c.reasons[0]?.text).toBe(
        "Options are pricing moves of about 50% a year; the stock has actually moved about 60% — sellers are underpaid for the risk.",
      );
      expect(c.provesWrong).toBe(
        "If option prices rise to at least 1.2× what the stock actually moves → come back here.",
      );
      expect(c.until).toBeUndefined();
    });

    it("calls a middling ratio 'only a little extra' — not yet worth selling", () => {
      const c = coveredCallCall(ctx({}, MIDDLING_RATIO), ladderOf(row()));
      expect(c.call).toBe("WAIT");
      expect(c.reasons[0]?.text).toContain(
        "only a little extra — not enough to be worth selling yet.",
      );
    });

    it("admits it cannot tell when there is neither a rank nor a realized-vol read", () => {
      const c = coveredCallCall(ctx({}, UNKNOWN), ladderOf(row()));
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("low");
      expect(c.reasons[0]?.text).toBe(
        "We can't yet tell whether option prices are high or low for this stock.",
      );
    });
  });

  describe("when a strike is worth writing", () => {
    it("grades a rich IV rank high and leads with the money received", () => {
      const c = coveredCallCall(ctx({}, RICH_RANK), ladderOf(row()));
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("high");
      expect(rules(c)).toEqual(["PRICE-AT-BID", "STRIKE-BASIS", "DTE-FLOOR"]);
      expect(c.reasons[0]?.text).toBe(
        "The best fit: 1 call at the $100.00 strike, expiring Oct 23. You receive $150.00 now — yours whatever happens (≈20% a year only if you could repeat it every time).",
      );
    });

    it("never grades a proxy richness reading above medium", () => {
      const c = coveredCallCall(ctx({}, RICH_RATIO), ladderOf(row()));
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("medium");
    });

    it("grades a middling IV rank medium — still a write, not a stand-aside", () => {
      const c = coveredCallCall(ctx({}, MIDDLING_RANK), ladderOf(row()));
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("medium");
    });

    it("states both sides of the outcome: what is kept and what is given up", () => {
      const c = coveredCallCall(ctx(), ladderOf(row()));
      expect(c.reasons[1]?.text).toContain(
        "If CRWV closes above $100.00 on Oct 23 (about a 20% chance), 100 of your 400 shares are sold at $100.00 — you keep the $150.00 but miss any rise above it.",
      );
    });

    // Copy bug found while backfilling: the template hard-codes the article, so an 18% or 8% chance
    // reads "about a 18% chance". Written for the correct grammar; src is add-only here.
    it.todo("says 'an 18% chance', not 'a 18% chance', when the odds start with an eight");

    it("measures the gain over what was paid: strike less basis, plus the premium, on 100 shares", () => {
      // (100 − 90) × 100 + 150 = $1,150
      const c = coveredCallCall(ctx(), ladderOf(row()));
      expect(c.reasons[1]?.text).toContain("That's $1,150.00 more than you paid for those 100.");
    });

    it("counts premium already collected, and says so", () => {
      // floor = 90 − 400/400 = 89 → (100 − 89) × 100 + 150 = $1,250
      const c = coveredCallCall(
        ctx({ stake: { shares: 400, costBasis: 90, goal: "income", premiumsCollected: 400 } }),
        ladderOf(row()),
      );
      expect(c.reasons[1]?.text).toContain(
        "That's $1,250.00 more than you paid for those 100, counting the premium you've already collected.",
      );
    });

    it("calls an underwater exit a loss, not a negative gain", () => {
      // (100 − 105) × 100 + 150 = −$350
      const c = coveredCallCall(
        ctx({ stake: { shares: 400, costBasis: 105, goal: "exit" } }),
        ladderOf(row()),
      );
      expect(c.call).toBe("WRITE");
      expect(c.reasons[1]?.text).toContain(
        "That's $350.00 less than you paid for those 100 — a loss, which your exit goal accepts.",
      );
      expect(c.reasons[1]?.text).not.toContain("-");
    });

    it("makes no claim about what was paid when an exit has no basis", () => {
      const c = coveredCallCall(ctx({ stake: { shares: 400, goal: "exit" } }), ladderOf(row()));
      expect(c.reasons[1]?.text).not.toContain("than you paid");
    });

    it("files the outcome under GOAL for a keep-shares holder and tells them to favour low odds", () => {
      const c = coveredCallCall(
        ctx({ stake: { shares: 400, costBasis: 90, goal: "keep-shares" } }),
        ladderOf(row()),
      );
      expect(c.reasons[1]?.rule).toBe("GOAL");
      expect(c.reasons[1]?.text).toContain(
        "You want to keep the shares, so favour the rows with the lowest chance.",
      );
    });

    it("does not nag an income holder to keep the shares", () => {
      const c = coveredCallCall(ctx(), ladderOf(row()));
      expect(c.reasons[1]?.rule).toBe("STRIKE-BASIS");
      expect(text(c)).not.toContain("keep the shares");
    });

    it("quotes the row nearest a 0.20 delta among the longer-dated ones, not the richest yield", () => {
      const risky = row({
        strike: 92,
        delta: 0.45,
        annualizedYield: 0.9,
        expiration: "2026-10-23",
      });
      const safe = row({
        strike: 105,
        delta: 0.21,
        annualizedYield: 0.15,
        expiration: "2026-10-23",
      });
      const c = coveredCallCall(ctx(), ladderOf(risky, safe));
      expect(c.reasons[0]?.text).toContain("at the $105.00 strike");
    });

    it("falls back to the shorter rows when none reaches three weeks", () => {
      const short = row({ dte: 14, expiration: "2026-10-09", strike: 103 });
      const c = coveredCallCall(ctx(), ladderOf(short));
      expect(c.call).toBe("WRITE");
      expect(c.reasons[0]?.text).toContain("expiring Oct 9");
    });

    it("is due to be revisited on the last usable expiry, not the headline row's", () => {
      const c = coveredCallCall(ctx(), ladderOf(row({ dte: 14, expiration: "2026-10-09" })));
      expect(c.until?.date).toBe("2026-10-23");
    });

    it("tells a no-earnings member to refresh before selling another, and how to lock in the gain", () => {
      const c = coveredCallCall(ctx(), ladderOf(row()));
      expect(c.until?.why).toBe(
        "the longest usable expiry — refresh the guidance before selling another. Managing it: once you've kept about half the premium, buying the option back early is a common way to lock that in.",
      );
    });

    it("tells a member facing earnings to stop selling calls until the report passes", () => {
      const c = coveredCallCall(ctx({ earnings: ESTIMATE }), ladderOf(row()));
      expect(c.until?.why).toMatch(
        /^last usable expiry — stop selling calls until earnings pass\. /,
      );
      expect(c.until?.why).toContain("Managing it:");
    });

    it("keeps only the three reasons it has — receive, outcome, band — and the falsifier of an estimate", () => {
      const c = coveredCallCall(ctx({ earnings: ESTIMATE }), ladderOf(row()));
      expect(c.reasons).toHaveLength(3);
      expect(c.provesWrong).toContain("If the company announces its earnings date");
      expect(c.atOpen).toBe(false);
    });
  });

  describe("the expiry-band line", () => {
    it("says when the hold-or-sell decision falls due, for a holder who has not committed to the print", () => {
      const c = coveredCallCall(ctx({ earnings: ESTIMATE }), ladderOf(row()));
      expect(c.reasons[2]?.rule).toBe("DTE-PRINT");
      expect(c.reasons[2]?.text).toContain(
        "nothing should still be open on Nov 2, when you decide whether to hold through earnings (Nov 9–16, estimated).",
      );
    });

    it("says later expiries cross the report for a keep-shares holder, quoting this name's evidence", () => {
      const c = coveredCallCall(
        ctx({
          earnings: ESTIMATE,
          stake: { shares: 400, costBasis: 90, goal: "keep-shares" },
          printEvidence: "its options underpriced the last print",
        }),
        ladderOf(row()),
      );
      expect(c.reasons[2]?.text).toContain(
        "later ones cross the earnings report (Nov 9–16, estimated) — its options underpriced the last print.",
      );
    });

    it("falls back to a generic caveat when no symbol-specific evidence was given", () => {
      const c = coveredCallCall(
        ctx({ earnings: ESTIMATE, stake: { shares: 400, costBasis: 90, goal: "keep-shares" } }),
        ladderOf(row()),
      );
      expect(c.reasons[2]?.text).toContain(
        "— the stock can gap further than option prices expect.",
      );
    });
  });
});

describe("the cash-secured-put lever", () => {
  const BUY_HIGH = {
    buySignal: true,
    buyConfidence: "high",
    stance: "Buy",
    source: "ledger",
  } as const;
  const NO_BUY = {
    buySignal: false,
    buyConfidence: "none",
    stance: "Stand aside",
    source: "ledger",
  } as const;
  const putRow = (over: Partial<LadderRow> = {}) =>
    row({
      lever: "cash-secured-puts",
      strike: 80,
      bid: 2,
      effectiveEntry: 78,
      probAssigned: 0.22,
      ...over,
    });
  const cashStake = { cash: 40_000, goal: "income", happyToOwnAt: 85 } as const;

  describe("when there is no cash to set aside", () => {
    it("says NOT AVAILABLE and asks for cash, because a put must be fully covered", () => {
      const c = cashSecuredPutCall(ctx({ stake: { goal: "income" } }), ladderOf(putRow()));
      expect(c.call).toBe("NOT AVAILABLE");
      expect(c.confidence).toBe("none");
      expect(rules(c)).toEqual(["COVERAGE"]);
      expect(text(c)).toBe("Enter your cash — a put must be fully covered by cash you set aside.");
      expect(c.provesWrong).toBe("—");
    });

    it("treats zero cash the same as none", () => {
      const c = cashSecuredPutCall(ctx({ stake: { cash: 0 } }), ladderOf(putRow()));
      expect(c.call).toBe("NOT AVAILABLE");
    });
  });

  describe("when every expiry is out of band", () => {
    it("waits at medium and points at the earnings report passing", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, earnings: ESTIMATE }, RICH_RANK, CLOSED_STRIP),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("medium");
      expect(rules(c)).toEqual(["DTE-PRINT"]);
      expect(c.until?.date).toBe("2026-11-16");
    });
  });

  describe("when no strike passes the checks", () => {
    it("waits at medium with the drop reason, then the ledger's view on owning the stock", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY }),
        emptyLadder({ own: 6, cash: 3, otm: 1 }),
      );
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("medium");
      expect(c.reasons[0]?.text).toBe(
        "No strike passes our checks: 6 above the price you'd be happy to own at; 3 not covered by your cash.",
      );
      expect(c.reasons[1]).toEqual({
        rule: "LEDGER",
        text: "Selling a put means agreeing to buy the stock — and the research doesn't support buying it right now.",
      });
    });

    it("refreshes after the earnings report when there is one, and not otherwise", () => {
      const withEarnings = cashSecuredPutCall(
        ctx({ stake: cashStake, earnings: ESTIMATE }),
        emptyLadder(),
      );
      expect(withEarnings.until?.date).toBe("2026-11-16");
      const without = cashSecuredPutCall(ctx({ stake: cashStake }), emptyLadder());
      expect(without.until).toBeUndefined();
    });
  });

  describe("when a strike is on the ladder", () => {
    it("writes at high only when richness, a high-confidence buy signal and a stated own-price all agree", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("high");
    });

    it("caps at medium when the member has not said what price they'd be happy to own at", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: { cash: 40_000, goal: "income" }, ledger: BUY_HIGH }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("medium");
    });

    it("is capped by the research's own buy confidence", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: { ...BUY_HIGH, buyConfidence: "medium" } }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.confidence).toBe("medium");
    });

    it("is capped by a proxy richness reading, which can never grade high", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH }, RICH_RATIO),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WRITE");
      expect(c.confidence).toBe("medium");
    });

    it("leads with the money received, then the obligation to buy, then the research", () => {
      const c = cashSecuredPutCall(ctx({ stake: cashStake, ledger: BUY_HIGH }), ladderOf(putRow()));
      expect(rules(c)).toEqual(["PRICE-AT-BID", "STRIKE-OWN", "LEDGER"]);
      expect(c.reasons[0]?.text).toBe(
        "The best fit: 1 put at the $80.00 strike, expiring Oct 23. You receive $200.00 now — yours whatever happens (≈20% a year only if you could repeat it every time).",
      );
      expect(c.reasons[1]?.text).toBe(
        "If CRWV closes below $80.00 on Oct 23 (about a 22% chance), you must buy 100 shares for $8,000.00 — even if it's far lower then. Your cost would be $78.00 a share after the premium.",
      );
      expect(c.reasons[2]?.text).toBe("The research supports buying (confidence: high).");
    });

    it("quotes the strike as the entry price when the row carries no effective entry", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH }),
        ladderOf(putRow({ effectiveEntry: undefined })),
      );
      expect(c.reasons[1]?.text).toContain("Your cost would be $80.00 a share after the premium.");
    });

    it("is due at the headline row's expiry, with a pointer to buying the option back early", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH }),
        ladderOf(putRow({ expiration: "2026-10-09", dte: 14 })),
      );
      expect(c.until?.date).toBe("2026-10-09");
      expect(c.until?.why).toMatch(
        /^expiry — decide then whether to sell another put or take the shares\. Managing it:/,
      );
    });

    it("warns that assignment doubles down when shares are already held — and drops the research line to stay at three reasons", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: { ...cashStake, shares: 400 }, ledger: BUY_HIGH }),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WRITE");
      expect(rules(c)).toEqual(["PRICE-AT-BID", "STRIKE-OWN", "CONCENTRATION"]);
      expect(c.reasons[2]?.text).toBe(
        "Being assigned adds 100 shares to the 400 you already hold — the same bet, bigger.",
      );
    });

    it("says nothing about concentration for someone who holds no shares", () => {
      const c = cashSecuredPutCall(ctx({ stake: cashStake, ledger: BUY_HIGH }), ladderOf(putRow()));
      expect(rules(c)).not.toContain("CONCENTRATION");
    });
  });

  describe("when the research does not license buying", () => {
    it("stands aside at low however rich the premium is — low is never a small bet", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("low");
      expect(c.until).toBeUndefined();
    });

    it("treats a missing ledger as no buy signal", () => {
      const c = cashSecuredPutCall(ctx({ stake: cashStake }, RICH_RANK), ladderOf(putRow()));
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("low");
      expect(c.reasons[0]?.text).toContain("doesn't support buying it right now");
    });

    it("explains how 'paid well' and 'don't buy' fit together, so they don't read as a contradiction", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(rules(c)).toEqual(["LEDGER", "RICHNESS"]);
      expect(c.reasons[1]?.text).toBe(
        "Option prices sit at 85 on a 0–100 scale of their past year — sellers are paid well — but that alone isn't a reason to take on more of a stock the research says not to buy.",
      );
    });

    it("leaves the richness line alone when premium is not rich", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY }, CHEAP_RATIO),
        ladderOf(putRow()),
      );
      expect(c.reasons[1]?.text).toContain("sellers are underpaid for the risk.");
      expect(c.reasons[1]?.text).not.toContain("isn't a reason");
    });

    it("puts the concentration line between the research and richness when shares are held", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: { ...cashStake, shares: 400 }, ledger: NO_BUY }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(rules(c)).toEqual(["LEDGER", "CONCENTRATION", "RICHNESS"]);
    });

    it("waits even on a buy signal whose confidence is too low to act on", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: { ...BUY_HIGH, buyConfidence: "low" } }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.call).toBe("WAIT");
      expect(c.confidence).toBe("low");
      expect(c.reasons[0]?.text).toBe("The research supports buying (confidence: low).");
      // A real buy signal needs no "don't buy" reconciliation on the richness line.
      expect(c.reasons[1]?.text).not.toContain("isn't a reason");
    });

    it("waits at the print's end when an earnings report is on the calendar", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY, earnings: ESTIMATE }, RICH_RANK),
        ladderOf(putRow()),
      );
      expect(c.until).toEqual({
        date: "2026-11-16",
        why: "the earnings report settles the biggest unknown — refresh the guidance after it",
      });
    });
  });

  describe("what would prove the call wrong", () => {
    it("is the buy signal's withdrawal, dated before the print, when the research licenses a buy", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH, earnings: ESTIMATE }),
        ladderOf(putRow()),
      );
      expect(c.provesWrong).toBe(
        "If the research withdraws its buy signal before Nov 9 → come back here.",
      );
    });

    it("is the research starting to support a buy, when it does not today", () => {
      const c = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: NO_BUY, earnings: ESTIMATE }),
        ladderOf(putRow()),
      );
      expect(c.provesWrong).toBe(
        "If the research starts supporting a buy before Nov 9 → come back here.",
      );
    });

    it("carries no date when there is no earnings report to be before", () => {
      const withBuy = cashSecuredPutCall(
        ctx({ stake: cashStake, ledger: BUY_HIGH }),
        ladderOf(putRow()),
      );
      expect(withBuy.provesWrong).toBe(
        "If the research withdraws its buy signal → come back here.",
      );
      const withoutBuy = cashSecuredPutCall(ctx({ stake: cashStake }), ladderOf(putRow()));
      expect(withoutBuy.provesWrong).toBe(
        "If the research starts supporting a buy → come back here.",
      );
    });

    it("defers to the ledger's own words, dated, when it states them", () => {
      const c = cashSecuredPutCall(
        ctx({
          stake: cashStake,
          ledger: {
            ...NO_BUY,
            provesWrong: { quote: "a reclaim of $95", asOf: "2026-09-24" },
          },
        }),
        ladderOf(putRow()),
      );
      expect(c.provesWrong).toBe(
        'The research, as of Sep 24: "a reclaim of $95" → come back here.',
      );
    });

    it("quotes the ledger on a no-strike wait too", () => {
      const c = cashSecuredPutCall(
        ctx({
          stake: cashStake,
          ledger: { ...NO_BUY, provesWrong: { quote: "a reclaim of $95" } },
        }),
        emptyLadder(),
      );
      expect(c.provesWrong).toBe('The research: "a reclaim of $95" → come back here.');
    });
  });
});
