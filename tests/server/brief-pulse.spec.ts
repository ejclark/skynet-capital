import {
  chainPulse,
  clockSessionOpen,
  earningsPulse,
  filingsPulse,
  researchPulse,
  sessionPulse,
  spotPulse,
} from "../../src/server/brief-pulse.js";

/**
 * The Brief's pulse (#3729): every input graded against its live source's OWN timestamp. Each row
 * of the pulse table has a case proving the status fires — "stale" is what demotes a call.
 */

const NOW = "2026-09-25T18:00:00Z"; // 14:00 ET Friday, in session
const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString();

describe("spotPulse — two independent reads of spot", () => {
  it("is fresh when the trade is seconds old and parity agrees", () => {
    const p = spotPulse({ last: 80, lastAt: ago(10_000), parity: 80.3 }, NOW, true);
    expect(p.status).toBe("fresh");
    expect(p.note).toContain("matches option parity");
  });

  it("is stale when IEX and option parity disagree by more than 1%", () => {
    const p = spotPulse({ last: 80, lastAt: ago(1_000), parity: 82 }, NOW, true);
    expect(p.status).toBe("stale");
    expect(p.note).toContain("2.4% apart");
  });

  it("ages by the trade's own time: 2 min aging, 6 min stale, in session", () => {
    expect(spotPulse({ last: 80, lastAt: ago(120_000), parity: 80 }, NOW, true).status).toBe(
      "aging",
    );
    expect(spotPulse({ last: 80, lastAt: ago(360_000), parity: 80 }, NOW, true).status).toBe(
      "stale",
    );
  });

  it("accepts last session's close when the market is shut", () => {
    const p = spotPulse({ last: 80, lastAt: ago(16 * 3_600_000), parity: 80 }, NOW, false);
    expect(p).toMatchObject({ status: "fresh" });
    expect(p.note).toContain("as of close");
  });

  it("never grades fresh without the parity cross-check", () => {
    expect(spotPulse({ last: 80, lastAt: ago(1_000) }, NOW, true).status).toBe("aging");
  });
});

describe("chainPulse", () => {
  it("grades the median quote age — 20 min in session is stale", () => {
    const stamps = [ago(20 * 60_000), ago(21 * 60_000), ago(60_000)];
    expect(chainPulse(stamps, 10, NOW, true)).toMatchObject({ status: "stale" });
  });

  it("is stale when the feed stamped nothing", () => {
    expect(chainPulse([], 40, NOW, true).note).toBe("no quote times on 40 strikes");
  });
});

describe("researchPulse — stale by the calendar or by the tape", () => {
  const ledger = { assessed: "2026-09-24", probePrice: 80, source: "ledger" };

  it("is fresh a day after assessment with the tape inside one expected move", () => {
    expect(researchPulse(ledger, 81, 0.8, "2026-09-25").status).toBe("fresh");
  });

  it("is stale after 7 days", () => {
    expect(researchPulse({ ...ledger, assessed: "2026-09-17" }, 80, 0.8, "2026-09-25").status).toBe(
      "stale",
    );
  });

  it("is stale when spot has moved more than one expected move since the probe", () => {
    // 1 day at 80% vol: 80 × 0.8 × √(1/365) ≈ $3.35
    const p = researchPulse(ledger, 84, 0.8, "2026-09-25");
    expect(p.status).toBe("stale");
    expect(p.note).toContain("+5.0% since research");
  });
});

describe("earnings, filings and session", () => {
  it("an estimate date is aging — never fresh", () => {
    expect(
      earningsPulse({ date: "2026-11-10", status: "estimate", source: "8-K cadence" }).status,
    ).toBe("aging");
  });

  it("a new 8-K after the research date is stale and named", () => {
    const p = filingsPulse(
      [
        { date: "2026-09-25", items: "8.01" },
        { date: "2026-09-17", items: "1.01" },
      ],
      "2026-09-24",
      NOW,
    );
    expect(p).toMatchObject({
      status: "stale",
      note: "1 new 8-K since research: 2026-09-25 items 8.01",
    });
  });

  it("an unreachable EDGAR is aging, never a confident 'no filings'", () => {
    expect(filingsPulse(undefined, "2026-09-24", NOW)).toMatchObject({ status: "aging" });
  });

  it("falls back to the clock when the broker clock is unreachable, and says so", () => {
    expect(sessionPulse(undefined, NOW).status).toBe("aging");
    expect(clockSessionOpen(NOW)).toBe(true);
    expect(clockSessionOpen("2026-09-25T21:00:00Z")).toBe(false); // 17:00 ET
    expect(clockSessionOpen("2026-09-26T15:00:00Z")).toBe(false); // Saturday
  });
});
