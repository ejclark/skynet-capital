import { diffBriefs, positionBrief, snapshotOf } from "../../src/options/position-brief.js";
import { buildLadder } from "../../src/options/position-brief-ladder.js";
import {
  dteStrip,
  etDateOf,
  MAX_SHORT_DELTA,
  richnessOf,
  weekdaysBefore,
} from "../../src/options/position-brief-rules.js";
import type { BriefInputs } from "../../src/options/position-brief-types.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import { probabilityAbove } from "../../src/options/terminal-odds.js";
import { CHAIN, EXPIRATIONS, IV, inputs, NOW, quoteAt, SPOT } from "./position-brief-fixture.js";

/**
 * The Position Brief engine (#3729). Every number is checked against arithmetic a desk can redo by
 * hand; every rule id has a case that fires it; every pulse row has a case proving its demotion.
 */

const byLever = (b: ReturnType<typeof positionBrief>) => ({
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
    const verdicts = Object.fromEntries(strip.map((m) => [m.expiration, m.verdict]));
    expect(verdicts["2026-11-06"]).toBe("in");
    expect(verdicts["2026-11-13"]).toBe("spans-print");
    expect(verdicts["2026-11-20"]).toBe("spans-print");
  });

  it("warns — never excludes — for a catalyst before the expiry", () => {
    expect(strip[0]?.catalysts).toEqual([
      "Fully Connected opens (2026-09-29)",
      "MU prints (2026-09-30)",
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
    expect(rows.every((r) => r.contracts === 4)).toBe(true);
    const puts = buildLadder("cash-secured-puts", input, strip).rows;
    for (const p of puts) expect(p.contracts).toBe(Math.floor(40_000 / (p.strike * 100)));
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
  const { shares, cc, csp } = byLever(positionBrief(inputs()));

  it("HOLDs shares until 5 sessions before the print window, and names the fork", () => {
    expect(weekdaysBefore("2026-11-09", 5)).toBe("2026-11-02");
    expect(shares).toMatchObject({
      call: "HOLD",
      confidence: "medium",
      until: { date: "2026-11-02" },
    });
    expect(shares?.provesWrong).toContain("IR confirms a print date before 2026-11-02");
  });

  it("WRITEs covered calls at medium at most — the richness read is a proxy without IV rank", () => {
    expect(cc).toMatchObject({
      call: "WRITE",
      confidence: "medium",
      until: { date: "2026-11-06" },
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
    expect(positionBrief(inputs()).calls.map((c) => c.lever)).toEqual([
      "shares",
      "covered-calls",
      "cash-secured-puts",
    ]);
  });
});

describe("the stake shapes the calls", () => {
  it("STRIKE-BASIS: with basis above spot, no call strike sits below it", () => {
    const brief = positionBrief(inputs({ stake: { shares: 400, costBasis: 95, goal: "income" } }));
    const calls = brief.ladder.filter((r) => r.lever === "covered-calls");
    expect(calls.every((r) => r.strike >= 95)).toBe(true);
  });

  it("…unless the goal is exit, when the basis stops protecting strikes", () => {
    const brief = positionBrief(inputs({ stake: { shares: 400, costBasis: 95, goal: "exit" } }));
    expect(brief.ladder.some((r) => r.lever === "covered-calls" && r.strike < 95)).toBe(true);
    expect(brief.calls[0]?.call).toBe("SELL");
  });

  it("covered calls are NOT AVAILABLE under 100 shares", () => {
    expect(positionBrief(inputs({ stake: { shares: 50, goal: "income" } })).calls[1]?.call).toBe(
      "NOT AVAILABLE",
    );
  });

  it("STRIKE-OWN: no put strike above the happy-to-own price", () => {
    const brief = positionBrief(
      inputs({ stake: { cash: 40_000, goal: "income", happyToOwnAt: 70 } }),
    );
    expect(
      brief.ladder.filter((r) => r.lever === "cash-secured-puts").every((r) => r.strike <= 70),
    ).toBe(true);
  });

  it("a non-holder with no buy signal is told to STAND ASIDE", () => {
    expect(positionBrief(inputs({ stake: { goal: "income" } })).calls[0]?.call).toBe("STAND ASIDE");
  });
});

describe("richness", () => {
  it("cheap premium (implied below realized) turns WRITE into WAIT", () => {
    expect(positionBrief(inputs({ realizedVol: 1.0 })).calls[1]?.call).toBe("WAIT");
  });

  it("a rich IV rank lifts the covered-call cap to high", () => {
    expect(positionBrief(inputs({ ivRank: 70 })).calls[1]?.confidence).toBe("high");
  });

  it("no rank and no realized vol means unknown, capped low — a stand-aside", () => {
    expect(richnessOf(undefined, 0.8, undefined).verdict).toBe("unknown");
    const { realizedVol: _omit, ...rest } = inputs();
    expect(positionBrief(rest as BriefInputs).calls[1]).toMatchObject({
      call: "WAIT",
      confidence: "low",
    });
  });
});

describe("the S2 decision zone", () => {
  const zone = "2026-11-03T15:00:00Z";
  const chain = EXPIRATIONS.flatMap((e) => [quoteAt(e, 90, "call", zone)]);

  it("an income holder goes flat into the print", () => {
    expect(positionBrief(inputs({ now: zone, chain })).calls[0]?.call).toBe("SELL");
  });

  it("a keep-shares holder HOLDs as a conscious call", () => {
    const b = positionBrief(
      inputs({ now: zone, chain, stake: { shares: 400, goal: "keep-shares" } }),
    );
    expect(b.calls[0]).toMatchObject({ call: "HOLD", until: { date: "2026-11-16" } });
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
    const b = positionBrief(withPulse("spot", "stale", "IEX and parity disagree by 2.1%"));
    expect(b.calls.every((c) => c.call === "NO ANSWER" && c.confidence === "none")).toBe(true);
  });

  it("stale quotes turn a WRITE into a WAIT", () => {
    expect(positionBrief(withPulse("chain", "stale")).calls[1]).toMatchObject({
      call: "WAIT",
      confidence: "none",
    });
  });

  it("stale research caps every call low — and low is a stand-aside", () => {
    const b = positionBrief(withPulse("research", "stale", "8 days old"));
    expect(b.calls[1]).toMatchObject({ call: "WAIT", confidence: "low" });
    expect(b.calls[1]?.reasons[0]?.rule).toBe("PULSE");
  });

  it("new filings since research cap at medium and lead the why", () => {
    const b = positionBrief(
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
    const b = positionBrief(inputs({ sessionOpen: false }));
    expect(b.calls[1]).toMatchObject({ call: "WRITE", atOpen: true });
    expect(b.calls[0]?.atOpen).toBe(false); // HOLD is not an action
  });
});

describe("what changed since you last looked", () => {
  it("is empty on a first visit and names each moved call after", () => {
    const first = positionBrief(inputs());
    expect(diffBriefs(undefined, first)).toEqual([]);
    const next = positionBrief(inputs({ realizedVol: 1.0, spot: 84, chain: CHAIN }));
    const lines = diffBriefs(snapshotOf(first), next);
    expect(lines).toContain("Spot +5.0% since 2026-09-25.");
    expect(lines).toContain("Covered calls: WRITE (medium) → WAIT (medium).");
    expect(lines).toContain("Premium: rich → cheap.");
  });
});

describe("the headline strike", () => {
  it("is the ~0.20-delta row at 3+ weeks, not the highest annualized yield", () => {
    const { cc, csp } = byLever(positionBrief(inputs()));
    const b = positionBrief(inputs());
    const headline = cc?.reasons[0]?.text ?? "";
    const quoted = b.ladder.find(
      (r) =>
        r.lever === "covered-calls" &&
        headline.includes(`${r.expiration} `) &&
        headline.includes(`$${r.strike.toFixed(2)} call`),
    );
    expect(quoted?.dte).toBeGreaterThanOrEqual(21);
    const topYield = Math.max(
      ...b.ladder.filter((r) => r.lever === "covered-calls").map((r) => r.annualizedYield),
    );
    expect(quoted?.annualizedYield).toBeLessThan(topYield);
    expect(csp?.reasons.some((r) => r.text.includes("2026-10-02"))).toBe(false);
  });
});
