import { assessReadiness } from "../../src/autonomous/readiness.js";
import type { MarketContext, Portfolio } from "../../src/domain/types.js";
import { genericSafetyScenarios } from "../../src/evals/scenarios/generic-safety.js";
import { prospectorScenarios } from "../../src/evals/scenarios/prospector.js";
import { ProspectorPersona, WARM_UP_CLAIMS } from "../../src/personas/prospector.js";

const ctx = (prices: Record<string, number>): MarketContext => ({
  asOf: "2026-08-10T14:00:00.000Z",
  quotes: Object.fromEntries(
    Object.entries(prices).map(([symbol, last]) => [
      symbol,
      { symbol, bid: last - 0.05, ask: last + 0.05, last, asOf: "2026-08-10T14:00:00.000Z" },
    ]),
  ),
});

const book = (positions: [string, number, number][] = []): Portfolio => ({
  cash: 1_000_000,
  positions: positions.map(([symbol, quantity, avgPrice]) => ({ symbol, quantity, avgPrice })),
});

const prospector = (over = {}) =>
  new ProspectorPersona({ claims: ["NVDA"], baseNotional: 2_000, conviction: {}, ...over });

describe("when a planned claim is unheld", () => {
  it("stakes it regardless of signal — the entry is unconditional by design", () => {
    const intents = prospector().decide(ctx({ NVDA: 200 }), book());

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "buy", quantity: 10 });
  });

  it("scales the stake by conviction without changing whether it bets", () => {
    const [low] = prospector({ conviction: { NVDA: 0.5 } }).decide(ctx({ NVDA: 200 }), book());
    const [high] = prospector({ conviction: { NVDA: 2 } }).decide(ctx({ NVDA: 200 }), book());

    expect(low?.quantity).toBe(5);
    expect(high?.quantity).toBe(20);
  });

  it("never touches a symbol outside the plan", () => {
    const intents = prospector().decide(ctx({ GME: 40, NVDA: 200 }), book());

    expect(intents.map((i) => i.symbol)).toEqual(["NVDA"]);
  });

  it("stakes nothing on an unusable price rather than dividing by it", () => {
    expect(prospector().decide(ctx({ NVDA: 0 }), book())).toEqual([]);
  });

  it("stops opening new claims at the concurrency cap", () => {
    const p = new ProspectorPersona({
      claims: ["NVDA", "MRVL", "CRWV"],
      baseNotional: 2_000,
      maxConcurrent: 2,
    });

    const intents = p.decide(ctx({ NVDA: 200, MRVL: 200, CRWV: 80 }), book([["NVDA", 10, 200]]));

    expect(intents.filter((i) => i.side === "buy")).toHaveLength(1);
  });
});

describe("when a claim moves against the position", () => {
  it("cuts it once past the stop", () => {
    const intents = prospector({ stopPct: 0.04 }).decide(
      ctx({ NVDA: 190 }),
      book([["NVDA", 10, 200]]),
    );

    expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "sell", quantity: 10 });
  });

  it("holds through a drawdown inside the stop — noise is not a signal", () => {
    const intents = prospector({ stopPct: 0.04 }).decide(
      ctx({ NVDA: 197 }),
      book([["NVDA", 10, 200]]),
    );

    expect(intents).toEqual([]);
  });
});

describe("when a claim moves in favor", () => {
  // The point Eric named: don't jump off early to bank a small win when runway remains.
  it("does NOT take profit at a fixed target — a young winner keeps running", () => {
    const p = prospector({ runwayPct: 0.03, trailPct: 0.025 });
    const held = book([["NVDA", 10, 200]]);

    expect(p.decide(ctx({ NVDA: 204 }), held)).toEqual([]); // +2%: under the runway bar
    expect(p.decide(ctx({ NVDA: 210 }), held)).toEqual([]); // +5%: running, still at its peak
    expect(p.decide(ctx({ NVDA: 220 }), held)).toEqual([]); // +10%: let it run
  });

  it("exits only when the move rolls over — trailing from the peak, not from entry", () => {
    const p = prospector({ runwayPct: 0.03, trailPct: 0.025 });
    const held = book([["NVDA", 10, 200]]);

    p.decide(ctx({ NVDA: 220 }), held); // peak established at 220 (+10%)
    const stillRunning = p.decide(ctx({ NVDA: 217 }), held); // 1.4% off the high — inside the trail
    const rolledOver = p.decide(ctx({ NVDA: 214 }), held); // 2.7% off the high — trail triggers

    expect(stillRunning).toEqual([]);
    expect(rolledOver[0]).toMatchObject({ symbol: "NVDA", side: "sell", quantity: 10 });
  });

  it("keeps the trail disarmed until the position clears its runway", () => {
    const p = prospector({ runwayPct: 0.03, trailPct: 0.025 });
    const held = book([["NVDA", 10, 200]]);

    p.decide(ctx({ NVDA: 204 }), held); // peak +2% — never cleared the runway bar
    const pullback = p.decide(ctx({ NVDA: 199 }), held); // 2.5% off that peak, but inside the stop

    expect(pullback).toEqual([]);
  });

  it("forgets the peak once the claim is closed, so the next claim arms fresh", () => {
    const p = prospector({ runwayPct: 0.03, trailPct: 0.025 });

    p.decide(ctx({ NVDA: 260 }), book([["NVDA", 10, 200]])); // peak 260 while held
    p.decide(ctx({ NVDA: 250 }), book()); // position closed — peak cleared
    const reEntered = p.decide(ctx({ NVDA: 250 }), book([["NVDA", 10, 250]]));

    expect(reEntered).toEqual([]); // a stale 260 peak would have fired the trail here
  });
});

describe("when the readiness gate grades the warm-up plan", () => {
  it("passes, so live mode is not silently pinned to observe", () => {
    const readiness = assessReadiness(new ProspectorPersona(WARM_UP_CLAIMS), {
      pack: prospectorScenarios,
      safetyScenarios: genericSafetyScenarios,
    });

    expect(readiness.ready).toBe(true);
  });

  it("plans all three warm-up claims with conviction highest on NVDA", () => {
    expect(WARM_UP_CLAIMS.claims).toEqual(["NVDA", "MRVL", "CRWV"]);
    expect(WARM_UP_CLAIMS.conviction.NVDA).toBeGreaterThan(WARM_UP_CLAIMS.conviction.CRWV ?? 0);
  });
});
