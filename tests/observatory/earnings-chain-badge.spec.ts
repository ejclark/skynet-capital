import { type EarningsPrint, PRINT_WINDOWS } from "../../src/domain/earnings-calendar.js";
import {
  type EarningsProximity,
  earningsBadge,
  earningsProximity,
  expirationPrintMark,
} from "../../src/observatory/earnings-chain-badge.js";

/**
 * The chain's earnings tell. Two contracts are load-bearing beyond "it renders": absence is
 * ABSENT (never a cleared-looking zero-state), and an ESTIMATE is never phrased as a fact.
 */

const prints: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: nvidianews call notice" },
  { symbol: "MU", date: "2026-09-29", status: "estimate", source: "NEWS: triangulated" },
];

describe("earningsProximity", () => {
  it("calls the entry-guard window the flat zone, with the days until the print", () => {
    const near = earningsProximity("NVDA", "2026-08-25T14:00:00Z", prints) as EarningsProximity;
    expect(near.nearness).toBe("flat-zone");
    expect(near.days).toBe(1);
    expect(near.print.date).toBe("2026-08-26");
  });

  it("counts the print day itself as still ahead — the release lands after the close", () => {
    const near = earningsProximity("NVDA", "2026-08-26T14:00:00Z", prints) as EarningsProximity;
    expect(near.days).toBe(0);
    expect(near.nearness).toBe("flat-zone");
  });

  it("calls the wider pre-print week the dead zone", () => {
    const near = earningsProximity("NVDA", "2026-08-22T14:00:00Z", prints) as EarningsProximity;
    expect(near.nearness).toBe("dead-zone");
    expect(near.days).toBe(4);
  });

  it("reports a print just behind us with a negative day count", () => {
    const near = earningsProximity("NVDA", "2026-08-28T14:00:00Z", prints) as EarningsProximity;
    expect(near.nearness).toBe("just-printed");
    expect(near.days).toBe(-2);
  });

  it("is ABSENT outside every window, and for a symbol with no print at all", () => {
    expect(earningsProximity("NVDA", "2026-08-01T14:00:00Z", prints)).toBeUndefined();
    expect(earningsProximity("NVDA", "2026-09-05T14:00:00Z", prints)).toBeUndefined();
    expect(earningsProximity("XYZ", "2026-08-25T14:00:00Z", prints)).toBeUndefined();
  });

  it("reads the trading-discipline windows rather than a display-only number", () => {
    // The boundary day IS inside the flat zone; one day further out is not.
    const edge = `2026-08-${String(26 - PRINT_WINDOWS.entryFlatDays).padStart(2, "0")}T14:00:00Z`;
    expect(earningsProximity("NVDA", edge, prints)?.nearness).toBe("flat-zone");
    const beyond = `2026-08-${String(26 - PRINT_WINDOWS.deadZoneDays - 1).padStart(2, "0")}T14:00:00Z`;
    expect(earningsProximity("NVDA", beyond, prints)).toBeUndefined();
  });
});

describe("earningsBadge", () => {
  it("names the days until the print, its date and how confident the date is", () => {
    const html = earningsBadge("NVDA", "2026-08-24T14:00:00Z", prints);
    expect(html).toContain("Earnings in 2 days");
    expect(html).toContain("2026-08-26");
    expect(html).toContain("confirmed");
    expect(html).toContain('data-nearness="flat-zone"');
  });

  it("says tomorrow and today in plain English rather than making anyone decode D-1", () => {
    expect(earningsBadge("NVDA", "2026-08-25T14:00:00Z", prints)).toContain("Earnings tomorrow");
    expect(earningsBadge("NVDA", "2026-08-26T14:00:00Z", prints)).toContain(
      "Earnings today, after the close",
    );
  });

  it("hedges an ESTIMATED date instead of asserting it — the honesty invariant", () => {
    const html = earningsBadge("MU", "2026-09-26T14:00:00Z", prints);
    expect(html).toContain("Earnings expected in 3 days");
    expect(html).not.toContain("<b>Earnings in 3 days</b>");
    expect(html).toContain("estimate");
  });

  it("renders NOTHING when no print is near, and nothing at all without a symbol", () => {
    expect(earningsBadge("NVDA", "2026-08-01T14:00:00Z", prints)).toBe("");
    expect(earningsBadge(undefined, "2026-08-25T14:00:00Z", prints)).toBe("");
  });

  it("wears the alarm colour only inside the window the bots actually refuse", () => {
    expect(earningsBadge("NVDA", "2026-08-25T14:00:00Z", prints)).toContain("var(--neg)");
    expect(earningsBadge("NVDA", "2026-08-22T14:00:00Z", prints)).not.toContain("var(--neg)");
  });

  it("carries the calendar entry's own source as the tooltip — provenance, not a bare claim", () => {
    expect(earningsBadge("NVDA", "2026-08-25T14:00:00Z", prints)).toContain(
      "IR: nvidianews call notice",
    );
  });
});

describe("expirationPrintMark", () => {
  it("marks an expiration whose contract is still alive on print day", () => {
    const mark = expirationPrintMark("NVDA", "2026-09-18", "2026-08-20T14:00:00Z", prints);
    expect(mark).toContain("⚡");
    expect(mark).toContain("lives through the print");
  });

  it("counts the print date itself as held — the release comes after the close", () => {
    expect(expirationPrintMark("NVDA", "2026-08-26", "2026-08-20T14:00:00Z", prints)).toContain(
      "⚡",
    );
  });

  it("leaves an expiration that lands before the print unmarked", () => {
    expect(expirationPrintMark("NVDA", "2026-08-21", "2026-08-20T14:00:00Z", prints)).toBe("");
  });

  it("marks a print far outside the proximity windows — a 45-day contract still holds it", () => {
    // 2026-09-29 is well past every PRINT_WINDOWS horizon, and decisive for this expiration.
    expect(expirationPrintMark("MU", "2026-10-16", "2026-08-20T14:00:00Z", prints)).toContain("⚡");
    expect(expirationPrintMark("MU", "2026-09-18", "2026-08-20T14:00:00Z", prints)).toBe("");
  });

  it("hedges an estimated date in its tooltip too", () => {
    expect(expirationPrintMark("MU", "2026-10-16", "2026-08-20T14:00:00Z", prints)).toContain(
      "is expected to report",
    );
  });

  it("marks nothing without a symbol or a scheduled print", () => {
    expect(expirationPrintMark(undefined, "2026-10-16", "2026-08-20T14:00:00Z", prints)).toBe("");
    expect(expirationPrintMark("XYZ", "2026-10-16", "2026-08-20T14:00:00Z", prints)).toBe("");
  });
});
