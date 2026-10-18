import { positionGuidance } from "../../src/options/position-guidance.js";
import { EXPIRATIONS, inputs, quoteAt } from "../options/position-guidance-fixture.js";

/**
 * ADJACENT SCENARIOS — the next situations scenarios 1 and 2 lead into (Claude, 2026-10-18;
 * docs/members/scenarios.md). Proposals, not the member's words: Eric prunes them.
 */

describe("scenario 3 — the CRWV put is assigned below its strike; now sell calls on the shares", () => {
  // Sold the $70 put for $1.25, CRWV fell to $64 and the put was assigned: 100 shares, really paid
  // $68.75 each. Selling a call under $68.75 would lock in a loss if it were called away.
  const SPOT = 64;
  const chain = EXPIRATIONS.flatMap((e) =>
    [60, 65, 70, 75, 80].flatMap((k) => [
      quoteAt(e, k, "call", undefined, SPOT),
      quoteAt(e, k, "put", undefined, SPOT),
    ]),
  );
  const g = positionGuidance(
    inputs({
      spot: SPOT,
      chain,
      stake: { shares: 100, costBasis: 70, premiumsCollected: 125, cash: 2_000, goal: "income" },
    }),
  );

  it("s1 — WHEN assigned shares sit below what the member really paid, the app shall offer no covered call that would sell them below it", () => {
    const calls = g.ladder.filter((r) => r.lever === "covered-calls");
    expect(calls.length).toBeGreaterThan(0);
    // $65 is above today's price but below what was really paid — the one strike the rule exists for
    for (const r of calls) expect(r.strike).toBeGreaterThanOrEqual(68.75);
  });

  it("s2 — WHEN the shares are held through a drop, the guidance shall never say sell on the drop", () => {
    expect(g.calls[0].call).not.toBe("SELL");
  });
});

describe("scenario 4 — election night: the market is shut and the member wants out", () => {
  const g = positionGuidance(
    inputs({
      now: "2026-11-04T02:00:00Z", // 21:00 ET on election day — after the close
      sessionOpen: false,
      stake: { shares: 400, costBasis: 70, cash: 40_000, goal: "exit" },
    }),
  );

  it("s1 — WHEN the market is closed, an acting call shall read as a plan for the next open, never an order for now", () => {
    expect(g.calls[0].call).toBe("SELL");
    expect(g.calls[0].atOpen).toBe(true);
  });

  it("s2 — WHEN the member chooses to sell, the app shall say it is a taxable sale", () => {
    expect(g.calls[0].reasons.map((r) => r.text).join(" ")).toMatch(/taxable/);
  });
});
