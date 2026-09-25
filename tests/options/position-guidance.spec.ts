import { diffGuidance, positionGuidance, snapshotOf } from "../../src/options/position-guidance.js";
import { buildLadder } from "../../src/options/position-guidance-ladder.js";
import { guidanceToMarkdown } from "../../src/options/position-guidance-markdown.js";
import {
  dteStrip,
  etDateOf,
  MAX_SHORT_DELTA,
  richnessOf,
  weekdaysBefore,
} from "../../src/options/position-guidance-rules.js";
import type { GuidanceInputs } from "../../src/options/position-guidance-types.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import { probabilityAbove } from "../../src/options/terminal-odds.js";
import { CHAIN, EXPIRATIONS, IV, inputs, NOW, quoteAt, SPOT } from "./position-guidance-fixture.js";

/**
 * The position guidance engine (#3729). Every number is checked against arithmetic a desk can redo by
 * hand; every rule id has a case that fires it; every pulse row has a case proving its demotion.
 */

const byLever = (b: ReturnType<typeof positionGuidance>) => ({
  shares: b.calls[0],
  cc: b.calls[1],
  csp: b.calls[2],
});

describe("DTE strip (DTE-FLOOR · DTE-PRINT)", () => {
  const strip = dteStrip(EXPIRATIONS, etDateOf(NOW), inputs().earnings, inputs().catalysts);

  it("keeps a 7-DTE expiry — the floor is 'under 7', a boundary", () => {
    expect(strip[0]).toMatchObject({ expiration: "2026-10-02", dte: 7, verdict: "in" });
  });

  it("drops the same expiry one day later, when it is 6 DTE", () => {
    const later = dteStrip(EXPIRATIONS, "2026-09-26", inputs().earnings, []);
    expect(later[0]?.verdict).toBe("too-short");
  });

  it("excludes every expiry on or after the estimate window's start, not its point date", () => {
    const keep = dteStrip(EXPIRATIONS, etDateOf(NOW), inputs().earnings, [], "keep-shares");
    const verdicts = Object.fromEntries(keep.map((m) => [m.expiration, m.verdict]));
    expect(verdicts["2026-11-06"]).toBe("in");
    expect(verdicts["2026-11-13"]).toBe("spans-print");
    expect(verdicts["2026-11-20"]).toBe("spans-print");
  });

  it("warns — never excludes — for a catalyst before the expiry", () => {
    expect(strip[0]?.catalysts).toEqual([
      "Fully Connected opens (2026-09-29)",
      "MU reports earnings (2026-09-30)",
    ]);
    expect(strip[0]?.verdict).toBe("in");
  });
});

describe("the ladder, priced at the bid", () => {
  const input = inputs();
  const strip = dteStrip(EXPIRATIONS, etDateOf(NOW), input.earnings, input.catalysts);
  const { rows } = buildLadder("covered-calls", input, strip);

  it("annualizes the bid on spot for a covered call — hand-checkable", () => {
    const row = rows[0];
    expect(row).toBeDefined();
    if (!row) return;
    expect(row.annualizedYield).toBeCloseTo((row.bid / SPOT) * (365 / row.dte), 10);
    expect(row.returnIfCalled).toBeCloseTo((row.strike - 70 + row.bid) / 70, 10);
  });

  it("quotes P(assigned) as the lognormal mass above the strike at the contract's own IV", () => {
    const row = rows[0];
    if (!row) throw new Error("no row");
    const days = daysToExpiryFrom(row.expiration, new Date(NOW)) ?? 0;
    const expected = probabilityAbove({
      spot: SPOT,
      target: row.strike,
      daysForward: days,
      volatility: IV,
    });
    expect(row.probAssigned).toBeCloseTo(expected ?? -1, 12);
  });

  it("never ladders a short strike past the delta cap, in the money, or in a spanning expiry", () => {
    for (const r of rows) {
      expect(Math.abs(r.delta)).toBeLessThanOrEqual(MAX_SHORT_DELTA);
      expect(r.strike).toBeGreaterThan(SPOT);
      expect(r.expiration < "2026-11-09").toBe(true);
    }
  });

  it("sizes covered calls by 100-share lots and puts by cash", () => {
    expect(rows.every((r) => r.contracts === 1 && r.maxContracts === 4)).toBe(true);
    const puts = buildLadder("cash-secured-puts", input, strip).rows;
    for (const p of puts) {
      expect(p.contracts).toBe(1);
      expect(p.maxContracts).toBe(Math.floor(40_000 / (p.strike * 100)));
    }
  });

  it("drops a quote whose spread is over 15% of mid, and says so", () => {
    const wide = inputs({
      chain: CHAIN.map((q) => ({ ...q, ask: (q.bid ?? 0) * 1.5 })),
    });
    const result = buildLadder("covered-calls", wide, strip);
    expect(result.rows).toHaveLength(0);
    expect(result.dropped.quote).toBeGreaterThan(0);
  });

  it("flags a feed delta that disagrees with ours by more than 0.05", () => {
    const skewed = inputs({
      chain: CHAIN.map((q) => ({ ...q, feedDelta: (q.feedDelta ?? 0) + 0.1 })),
    });
    const flagged = buildLadder("covered-calls", skewed, strip).rows;
    expect(flagged.every((r) => (r.deltaDisagreement ?? 0) > 0.05)).toBe(true);
  });
});

describe("the three calls — the CRWV fixture", () => {
  const { shares, cc, csp } = byLever(positionGuidance(inputs()));

  it("HOLDs shares until 5 sessions before the print window, and names the fork", () => {
    expect(weekdaysBefore("2026-11-09", 5)).toBe("2026-11-02");
    expect(shares).toMatchObject({
      call: "HOLD",
      confidence: "medium",
      until: { date: "2026-11-02" },
    });
    expect(shares?.provesWrong).toContain("announces its earnings date before 2026-11-02");
  });

  it("WRITEs covered calls at medium at most — the richness read is a proxy without IV rank", () => {
    expect(cc).toMatchObject({
      call: "WRITE",
      confidence: "medium",
      until: { date: "2026-10-30" },
    });
    expect(cc?.reasons.map((r) => r.rule)).toContain("DTE-PRINT");
  });

  it("WAITs on puts: assignment is a buy research does not license, on a name already held", () => {
    expect(csp).toMatchObject({ call: "WAIT", confidence: "low" });
    expect(csp?.reasons.map((r) => r.rule)).toEqual(
      expect.arrayContaining(["LEDGER", "CONCENTRATION"]),
    );
  });

  it("renders the three levers in fixed order", () => {
    expect(positionGuidance(inputs()).calls.map((c) => c.lever)).toEqual([
      "shares",
      "covered-calls",
      "cash-secured-puts",
    ]);
  });
});

describe("the stake shapes the calls", () => {
  it("STRIKE-BASIS: with basis above spot, no call strike sits below it", () => {
    const guidance = positionGuidance(
      inputs({ stake: { shares: 400, costBasis: 95, goal: "income" } }),
    );
    const calls = guidance.ladder.filter((r) => r.lever === "covered-calls");
    expect(calls.every((r) => r.strike >= 95)).toBe(true);
  });

  it("…unless the goal is exit, when the basis stops protecting strikes", () => {
    const guidance = positionGuidance(
      inputs({ stake: { shares: 400, costBasis: 95, goal: "exit" } }),
    );
    expect(guidance.ladder.some((r) => r.lever === "covered-calls" && r.strike < 95)).toBe(true);
    expect(guidance.calls[0]?.call).toBe("SELL");
  });

  it("covered calls are NOT AVAILABLE under 100 shares", () => {
    expect(positionGuidance(inputs({ stake: { shares: 50, goal: "income" } })).calls[1]?.call).toBe(
      "NOT AVAILABLE",
    );
  });

  it("STRIKE-OWN: no put strike above the happy-to-own price", () => {
    const guidance = positionGuidance(
      inputs({ stake: { cash: 40_000, goal: "income", happyToOwnAt: 70 } }),
    );
    expect(
      guidance.ladder.filter((r) => r.lever === "cash-secured-puts").every((r) => r.strike <= 70),
    ).toBe(true);
  });

  it("a non-holder with no buy signal is told to STAND ASIDE", () => {
    expect(positionGuidance(inputs({ stake: { goal: "income" } })).calls[0]?.call).toBe(
      "STAND ASIDE",
    );
  });
});

describe("richness", () => {
  it("cheap premium (implied below realized) turns WRITE into WAIT", () => {
    expect(positionGuidance(inputs({ realizedVol: 1.0 })).calls[1]?.call).toBe("WAIT");
  });

  it("a rich IV rank lifts the covered-call cap to high", () => {
    expect(positionGuidance(inputs({ ivRank: 70 })).calls[1]?.confidence).toBe("high");
  });

  it("no rank and no realized vol means unknown, capped low — a stand-aside", () => {
    expect(richnessOf(undefined, 0.8, undefined).verdict).toBe("unknown");
    const { realizedVol: _omit, ...rest } = inputs();
    expect(positionGuidance(rest as GuidanceInputs).calls[1]).toMatchObject({
      call: "WAIT",
      confidence: "low",
    });
  });
});

describe("the S2 decision zone", () => {
  const zone = "2026-11-03T15:00:00Z";
  const chain = EXPIRATIONS.flatMap((e) => [quoteAt(e, 90, "call", zone)]);

  it("an income holder is asked to decide — never told to sell", () => {
    const c = positionGuidance(inputs({ now: zone, chain })).calls[0];
    expect(c?.call).toBe("DECIDE");
    expect(c?.reasons.map((r) => r.text).join(" ")).toMatch(/Hold through.*Sell before.*taxable/s);
  });

  it("a keep-shares holder is asked too, with their goal named", () => {
    const b = positionGuidance(
      inputs({ now: zone, chain, stake: { shares: 400, costBasis: 70, goal: "keep-shares" } }),
    );
    expect(b.calls[0]).toMatchObject({ call: "DECIDE", until: { date: "2026-11-16" } });
    expect(b.calls[0]?.reasons.some((r) => r.rule === "GOAL")).toBe(true);
  });
});

describe("pulse — stale inputs demote, never masquerade", () => {
  const withPulse = (id: string, status: "stale" | "aging", note = "x") =>
    inputs({
      pulse: [
        ...inputs().pulse.filter((p) => p.id !== id),
        { id: id as "spot", source: "s", status, note },
      ],
    });

  it("an unverified spot means no honest answer on every lever", () => {
    const b = positionGuidance(withPulse("spot", "stale", "IEX and parity disagree by 2.1%"));
    expect(b.calls.every((c) => c.call === "NO ANSWER" && c.confidence === "none")).toBe(true);
  });

  it("stale quotes turn a WRITE into a WAIT", () => {
    expect(positionGuidance(withPulse("chain", "stale")).calls[1]).toMatchObject({
      call: "WAIT",
      confidence: "none",
    });
  });

  it("stale research caps every call low — and low is a stand-aside", () => {
    const b = positionGuidance(withPulse("research", "stale", "8 days old"));
    expect(b.calls[1]).toMatchObject({ call: "WAIT", confidence: "low" });
    expect(b.calls[1]?.reasons[0]?.rule).toBe("PULSE");
  });

  it("new filings since research cap at medium and lead the why", () => {
    const b = positionGuidance(
      inputs({
        ivRank: 70,
        pulse: [
          ...inputs().pulse,
          { id: "filings", source: "EDGAR", status: "stale", note: "1 new 8-K since research" },
        ],
      }),
    );
    expect(b.calls[1]).toMatchObject({ call: "WRITE", confidence: "medium" });
    expect(b.calls[1]?.reasons[0]?.text).toContain("1 new 8-K");
  });

  it("a closed market turns acting calls into plans for the open", () => {
    const b = positionGuidance(inputs({ sessionOpen: false }));
    expect(b.calls[1]).toMatchObject({ call: "WRITE", atOpen: true });
    expect(b.calls[0]?.atOpen).toBe(false); // HOLD is not an action
  });
});

describe("what changed since you last looked", () => {
  it("is empty on a first visit and names each moved call after", () => {
    const first = positionGuidance(inputs());
    expect(diffGuidance(undefined, first)).toEqual([]);
    const next = positionGuidance(inputs({ realizedVol: 1.0, spot: 84, chain: CHAIN }));
    const lines = diffGuidance(snapshotOf(first), next);
    expect(lines).toContain("Stock price +5.0% since 2026-09-25.");
    expect(lines).toContain("Covered calls: Reasonable now (medium) → Wait (low).");
    expect(lines).toContain("Option prices for sellers: paying well → paying poorly.");
  });
});

describe("the headline strike", () => {
  it("is the ~0.20-delta row at 3+ weeks, not the highest annualized yield", () => {
    const { cc, csp } = byLever(positionGuidance(inputs()));
    const b = positionGuidance(inputs());
    const headline = cc?.reasons[0]?.text ?? "";
    const quoted = b.ladder.find(
      (r) =>
        r.lever === "covered-calls" &&
        headline.includes(`$${r.strike.toFixed(2)} strike, expires ${r.expiration}`),
    );
    expect(quoted?.dte).toBeGreaterThanOrEqual(21);
    const topYield = Math.max(
      ...b.ladder.filter((r) => r.lever === "covered-calls").map((r) => r.annualizedYield),
    );
    expect(quoted?.annualizedYield).toBeLessThan(topYield);
    expect(csp?.reasons.some((r) => r.text.includes("2026-10-02"))).toBe(false);
  });
});

describe("review regressions — calls a member could act on must never be false", () => {
  it("a CSP WRITE on a licensed buy is falsified by the signal's withdrawal, and says why", () => {
    const b = positionGuidance(
      inputs({
        ivRank: 70,
        stake: { cash: 40_000, goal: "income", happyToOwnAt: 75 },
        ledger: { buySignal: true, buyConfidence: "high", stance: "S1 licensed", source: "x" },
      }),
    );
    expect(b.calls[2]?.call).toBe("WRITE");
    expect(b.calls[2]?.provesWrong).toContain("withdraws its buy signal");
    expect(b.calls[2]?.reasons.map((r) => r.rule)).toContain("LEDGER");
  });

  it("with no print on the calendar, nothing claims a print window", () => {
    const { earnings: _none, ...rest } = inputs();
    const b = positionGuidance(rest as GuidanceInputs);
    const text = JSON.stringify(b.calls);
    expect(text).not.toContain("print window");
    expect(b.dteStrip.every((m) => m.verdict !== "spans-print")).toBe(true);
  });

  it("symbol-specific print evidence is an input — absent, only the generic caveat renders", () => {
    const { printEvidence: _none, ...rest } = inputs({ symbol: "AAPL" });
    const b = positionGuidance(rest as GuidanceInputs);
    expect(JSON.stringify(b)).not.toContain("FT-15");
    const keep = positionGuidance(
      inputs({ stake: { shares: 400, costBasis: 70, goal: "keep-shares" } }),
    );
    expect(keep.calls[1]?.reasons.some((r) => r.text.includes("FT-15"))).toBe(true);
  });

  it("a closed print window is retired and reported, not carried forever", () => {
    const after = "2026-11-18T15:00:00Z";
    const chain = ["2026-11-27", "2026-12-04"].flatMap((e) =>
      [90, 95, 100].map((k) => quoteAt(e, k, "call", after)),
    );
    const b = positionGuidance(inputs({ now: after, chain }));
    expect(b.dteStrip.every((m) => m.verdict === "in")).toBe(true);
    expect(b.waitingOn.some((w) => w.label.startsWith("Print window"))).toBe(false);
    expect(b.calls[0]?.until).toBeUndefined();
    expect(b.assumptions.some((a) => a.includes("2026-11-09–2026-11-16 has passed"))).toBe(true);
  });

  it("mid-window, the waiting list shows the window closing, not opening", () => {
    const b = positionGuidance(inputs({ now: "2026-11-12T15:00:00Z", chain: [] }));
    expect(b.waitingOn.map((w) => w.label)).toContain(
      "Earnings window closes — refresh the guidance on the new prices",
    );
  });

  it("a zero cost basis is treated as not given — never Infinity", () => {
    const b = positionGuidance(inputs({ stake: { shares: 400, costBasis: 0, goal: "income" } }));
    expect(b.stake.costBasis).toBeUndefined();
    expect(JSON.stringify(b)).not.toContain("null");
    expect(b.ladder.every((r) => Number.isFinite(r.returnIfCalled ?? 0))).toBe(true);
  });

  it("stale quotes demote every option lever and blank the ladder", () => {
    const b = positionGuidance(
      inputs({
        pulse: [
          ...inputs().pulse.filter((p) => p.id !== "chain"),
          { id: "chain", source: "s", status: "stale", note: "20 min old" },
        ],
      }),
    );
    expect(b.ladder).toEqual([]);
    for (const c of [b.calls[1], b.calls[2]]) {
      expect(c).toMatchObject({ call: "WAIT", confidence: "none" });
      expect(c?.reasons[0]?.rule).toBe("PULSE");
    }
  });
});

describe("contradictions found in review (#3729) — the guidance must not argue with itself", () => {
  it("an option never outlives the hold-or-sell decision: income stops at Nov 2", () => {
    const b = positionGuidance(inputs());
    const decided = weekdaysBefore("2026-11-09", 5);
    expect(b.ladder.every((r) => r.expiration <= decided)).toBe(true);
    expect(b.dteStrip.find((m) => m.expiration === "2026-11-06")?.verdict).toBe("after-decision");
  });

  it("keep-shares, already committed to holding through, may sell up to the earnings window", () => {
    const b = positionGuidance(
      inputs({ stake: { shares: 400, costBasis: 70, goal: "keep-shares" } }),
    );
    expect(b.ladder.some((r) => r.expiration === "2026-11-06")).toBe(true);
  });

  it("without IV rank, a middling ratio (1.0–1.2) is a wait, not the same WRITE as 1.3", () => {
    const middling = positionGuidance(inputs({ realizedVol: IV / 1.1 }));
    expect(middling.richness.verdict).toBe("middling");
    expect(middling.calls[1]).toMatchObject({ call: "WAIT", confidence: "low" });
    expect(positionGuidance(inputs({ realizedVol: IV / 1.3 })).calls[1]?.call).toBe("WRITE");
  });

  it("the rows kept per expiry are the ones nearest the target delta, not the riskiest", () => {
    const b = positionGuidance(inputs());
    const oct30 = b.ladder.filter(
      (r) => r.lever === "covered-calls" && r.expiration === "2026-10-30",
    );
    const distance = (d: number) => Math.abs(Math.abs(d) - 0.2);
    const kept = Math.max(...oct30.map((r) => distance(r.delta)));
    const strip = dteStrip(EXPIRATIONS, etDateOf(NOW), inputs().earnings, [], "income");
    const all = buildLadder(
      "covered-calls",
      { ...inputs(), stake: { shares: 400, costBasis: 70, goal: "income" } },
      strip,
    );
    expect(all.rows.filter((r) => r.expiration === "2026-10-30")).toEqual(oct30);
    expect(oct30.some((r) => distance(r.delta) <= kept)).toBe(true);
    expect(Math.min(...oct30.map((r) => distance(r.delta)))).toBeLessThan(0.05);
  });
});

describe("per-strike honesty (#3729 step 2)", () => {
  it("drops a strike whose own quote is 25 minutes old, even when the rest are fresh", () => {
    const old = "2026-09-25T17:35:00Z";
    const chain = CHAIN.map((q) =>
      q.strike === 95 ? { ...q, quotedAt: old } : { ...q, quotedAt: NOW },
    );
    const b = positionGuidance(inputs({ chain }));
    expect(b.ladder.some((r) => r.strike === 95)).toBe(false);
  });

  it("keeps last session's quotes when the market is closed — they are labelled as of close", () => {
    const chain = CHAIN.map((q) => ({ ...q, quotedAt: "2026-09-24T20:00:00Z" }));
    expect(positionGuidance(inputs({ chain, sessionOpen: false })).ladder.length).toBeGreaterThan(
      0,
    );
  });

  it("drops a strike with fewer than 100 contracts open, and names why when nothing is left", () => {
    const thin = positionGuidance(
      inputs({ chain: CHAIN.map((q) => ({ ...q, openInterest: 12 })) }),
    );
    expect(thin.ladder).toEqual([]);
    expect(thin.calls[1]?.reasons[0]?.text).toContain("too few contracts open");
  });

  it("a pulse that blocks pricing empties the ladder and makes every option lever wait", () => {
    const b = positionGuidance(
      inputs({
        pulse: [
          ...inputs().pulse.filter((p) => p.id !== "spot"),
          {
            id: "spot",
            source: "s",
            status: "aging",
            note: "4.8% apart, after hours",
            blocksPricing: true,
          },
        ],
      }),
    );
    expect(b.ladder).toEqual([]);
    expect(b.calls[1]).toMatchObject({ call: "WAIT", confidence: "none" });
  });

  it("an aging option feed caps the option levers at medium", () => {
    const b = positionGuidance(
      inputs({
        ivRank: 70,
        pulse: [
          ...inputs().pulse.filter((p) => p.id !== "chain"),
          { id: "chain", source: "s", status: "aging", note: "indicative" },
        ],
      }),
    );
    expect(b.calls[1]?.confidence).toBe("medium");
  });
});

describe("a blocked lever says only why (#3734 review)", () => {
  it("carries exactly one reason, with no price in it", () => {
    const b = positionGuidance(
      inputs({
        pulse: [
          ...inputs().pulse.filter((p) => p.id !== "spot"),
          {
            id: "spot",
            source: "s",
            status: "aging",
            note: "4.8% apart, after hours",
            blocksPricing: true,
          },
        ],
      }),
    );
    for (const c of [b.calls[1], b.calls[2]]) {
      expect(c?.reasons).toHaveLength(1);
      expect(c?.reasons[0]?.text).not.toContain("$");
      expect(c?.until).toBeUndefined();
    }
  });
});

describe("defaults that never act for you (#3729 step 2b)", () => {
  it("with no goal, a holder HOLDs and is asked to pick one — nothing defaults to income", () => {
    const b = positionGuidance(inputs({ stake: { shares: 400, costBasis: 70 } }));
    expect(b.calls[0]?.call).toBe("HOLD");
    expect(
      b.calls[0]?.reasons.some((r) => r.rule === "GOAL" && r.text.startsWith("Pick a goal")),
    ).toBe(true);
  });

  it("SELL appears only for an exit goal, and always says it is a taxable sale", () => {
    const b = positionGuidance(inputs({ stake: { shares: 400, costBasis: 70, goal: "exit" } }));
    expect(b.calls[0]?.call).toBe("SELL");
    expect(b.calls[0]?.reasons.map((r) => r.text).join(" ")).toContain("taxable");
  });

  it("covered calls wait for what you paid — without it no strike is offered", () => {
    const b = positionGuidance(inputs({ stake: { shares: 400, goal: "income" } }));
    expect(b.calls[1]).toMatchObject({ call: "NOT AVAILABLE" });
    expect(b.calls[1]?.reasons[0]?.text).toContain("Enter what you paid");
    expect(b.ladder.some((r) => r.lever === "covered-calls")).toBe(false);
  });

  it("leads with money and states both sides of the outcome", () => {
    const cc = positionGuidance(inputs()).calls[1];
    expect(cc?.reasons[0]?.text).toMatch(
      /^Sell 1 call: .* You receive \$[\d,.]+ now — yours whatever happens/,
    );
    expect(cc?.reasons[1]?.text).toMatch(
      /100 of your 400 shares are sold at .* miss any rise above it/,
    );
  });
});

describe("step 2b review regressions — nothing false on the surface a member acts on", () => {
  it("an underwater exit says 'less than you paid — a loss', never '$-335 more'", () => {
    const cc = positionGuidance(inputs({ stake: { shares: 400, costBasis: 100, goal: "exit" } }))
      .calls[1];
    const text = cc?.reasons.map((r) => r.text).join(" ") ?? "";
    expect(text).not.toMatch(/\$-/);
    expect(text).toContain("less than you paid");
  });

  it("an exit with no basis never labels a call row as buying shares", () => {
    const md = guidanceToMarkdown(
      positionGuidance(inputs({ stake: { shares: 400, goal: "exit" } })),
    );
    const callRows = md.split("\n").filter((l) => l.includes(" call |"));
    expect(callRows.length).toBeGreaterThan(0);
    for (const row of callRows) expect(row).not.toContain("you buy");
  });

  it("with no goal, covered calls wait for one rather than saying 'reasonable now'", () => {
    const cc = positionGuidance(inputs({ stake: { shares: 400, costBasis: 70 } })).calls[1];
    expect(cc).toMatchObject({ call: "NOT AVAILABLE" });
    expect(cc?.reasons[0]?.text).toContain("Pick a goal first");
  });

  it("after the close, DECIDE is a plan for the open and never promises today's price", () => {
    const zone = "2026-11-04T01:00:00Z";
    const c = positionGuidance(inputs({ now: zone, chain: [], sessionOpen: false })).calls[0];
    expect(c).toMatchObject({ call: "DECIDE", atOpen: true });
    expect(c?.reasons.map((r) => r.text).join(" ")).not.toContain("today's price");
  });

  it("section 7 and the stake line speak plainly too", () => {
    const first = positionGuidance(inputs());
    const next = positionGuidance(inputs({ realizedVol: 1.0, spot: 84 }));
    const md = guidanceToMarkdown(next, diffGuidance(snapshotOf(first), next));
    for (const word of [
      "Spot ",
      "Premium:",
      "basis **",
      "goal **income",
      "| spot |",
      "| chain |",
    ]) {
      expect(md).not.toContain(word);
    }
  });
});
