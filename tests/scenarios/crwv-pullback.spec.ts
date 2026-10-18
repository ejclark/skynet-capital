import { decisionsFor } from "../../src/observatory/decisions-view.js";
import { positionGuidance } from "../../src/options/position-guidance.js";
import { CHAIN, inputs } from "../options/position-guidance-fixture.js";
import { held } from "./scenario-world.js";

/**
 * SCENARIO 1 — CRWV after a pullback, long-term conviction (Eric, 2026-10-18; docs/members/scenarios.md).
 * "CRWV is a stock I believe to have long term significance just had significant pullback… I expect
 * the next round of earnings over the next month or so across tech will be a determining force. I
 * also expect the election to play into the equation."
 *
 * Each `it` is one acceptance line. `it.fails` is a known gap — the ratchet: it turns red the day
 * the gap closes, and the fix flips it to `it` (the journeys' `known_gap`, docs/members/README.md).
 */

const ELECTION = { date: "2026-11-03", label: "US midterm elections", source: "FEC calendar" };
const PEERS = [
  { date: "2026-10-28", label: "MSFT reports earnings", source: "IR" },
  { date: "2026-11-18", label: "NVDA reports earnings", source: "IR" },
];

describe("scenario 1 — CRWV after a pullback, buying in on conviction", () => {
  const conviction = inputs({
    stake: { cash: 40_000, happyToOwnAt: 70 },
    catalysts: [...inputs().catalysts, ELECTION, ...PEERS],
  });
  const g = positionGuidance(conviction);
  const puts = g.ladder.filter((r) => r.lever === "cash-secured-puts");

  it("s1 — WHEN the member names a price they'd happily own at and the research licenses no buy, the app shall say the research disagrees and still show the puts at or under that price", () => {
    const csp = g.calls[2];
    expect(csp.lever).toBe("cash-secured-puts");
    expect(csp.call).toBe("WAIT");
    expect(csp.reasons.some((r) => r.rule === "LEDGER")).toBe(true);
    expect(puts.length).toBeGreaterThan(0);
    for (const r of puts) {
      expect(r.strike).toBeLessThanOrEqual(70);
      // the number a buyer-in-a-lull reads: what each share would really cost if assigned
      expect(r.effectiveEntry).toBeCloseTo(r.strike - r.bid, 6);
    }
  });

  it("s2 — WHEN an expiry spans the earnings window, the app shall not price a put on it and shall mark it as spanning the print", () => {
    const spans = g.dteStrip.filter((m) => m.verdict === "spans-print").map((m) => m.expiration);
    expect(spans).toEqual(["2026-11-13", "2026-11-20"]);
    for (const r of puts) expect(spans).not.toContain(r.expiration);
  });

  it("s3 — WHEN the election and the tech prints land before the member's next decision, the app shall list each, dated, among what the calls are waiting on", () => {
    const labels = g.waitingOn.map((w) => `${w.date} ${w.label}`);
    expect(labels).toEqual(
      expect.arrayContaining([
        "2026-10-28 MSFT reports earnings",
        "2026-11-03 US midterm elections",
        "2026-11-18 NVDA reports earnings",
      ]),
    );
    const dates = g.waitingOn.map((w) => w.date);
    expect(dates).toEqual([...dates].sort());
    // the election rides on every expiry it lands before, as a warning, never an exclusion
    const nov6 = g.dteStrip.find((m) => m.expiration === "2026-11-06");
    expect(nov6?.catalysts).toContain("US midterm elections (Nov 3)");
  });

  it("s4 — WHEN a long-term holder is down from cost, the guidance shall hold and say cost never decides — never a sell on the drop alone", () => {
    const holder = positionGuidance(
      inputs({
        stake: { shares: 100, costBasis: 120, cash: 10_000, goal: "keep-shares" },
        chain: CHAIN,
      }),
    );
    const shares = holder.calls[0];
    expect(shares.call).toBe("HOLD");
    expect(shares.reasons.map((r) => r.text).join(" ")).toMatch(/never decides whether to hold/);
  });

  // KNOWN GAP — #4952 (at-risk calls that weigh range, trend, greeks, volume and sentiment). The
  // two engines disagree on one position: guidance says hold (s4), the card says "cut it" on a
  // −10% return-from-cost test alone (src/observatory/decisions-view.ts AT_RISK_RETURN_PCT).
  it.fails("s5 — WHEN the same holding reaches Needs a decision, the card shall not offer cutting it on a return-from-cost test alone", () => {
    const [d] = decisionsFor("eric", [held("CRWV", 100, 120, 100 * 95)], []);
    expect(d?.why ?? "").not.toMatch(/cut it/);
  });
});
