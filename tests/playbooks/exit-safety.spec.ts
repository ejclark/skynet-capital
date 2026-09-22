import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type EnabledPlaybook,
  exitSafetyIntents,
  type Playbook,
  playbookIntents,
} from "../../src/playbooks/playbook.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * PLAYBOOK ANATOMY (#3194, step 4) — the first mechanism in this rollout that can autonomously
 * close a position. Every case here uses a synthetic playbook that declares `exitSafety`; no
 * shipped playbook (S1-NVDA, G1-GOOG, TACO-DJT) declares one, so these specs prove the MECHANISM
 * without touching any live behavior — that's covered separately by the step-1 characterization
 * specs, which must stay green and unchanged by this step.
 */

const calendar: readonly EarningsPrint[] = [];

const play = (overrides?: Partial<Playbook>): Playbook => ({
  id: "TEST-NVDA",
  symbols: ["NVDA"],
  thesis: "test play",
  evidence: "test",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "long", // still wants long — the trip must override this
  ...overrides,
});

const enabled = (p: Playbook, mode: EnabledPlaybook["mode"] = "standard"): EnabledPlaybook[] => [
  { playbook: p, mode },
];

describe("exitSafetyIntents", () => {
  it("does nothing for a playbook/mode with no exitSafety dial", () => {
    const context = aContext({ NVDA: { last: 80 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", avgPrice: 100 })] });

    const { intents, trips } = exitSafetyIntents(enabled(play()), context, portfolio);
    expect(intents).toEqual([]);
    expect(trips).toEqual([]);
  });

  it("does nothing while drawdown is below the trip line", () => {
    const p = play({
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } },
    });
    const context = aContext({ NVDA: { last: 95 } }); // ~5% below avgPrice 100, bid ~94.95
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", avgPrice: 100 })] });

    const { intents, trips } = exitSafetyIntents(enabled(p), context, portfolio);
    expect(intents).toEqual([]);
    expect(trips).toEqual([]);
  });

  it("trips and returns a scoped, full-quantity sell when enforcement is enforce", () => {
    const p = play({
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } },
    });
    const context = aContext({ NVDA: { last: 85 } }); // ~15% below avgPrice 100
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 })],
    });

    const { intents, trips } = exitSafetyIntents(enabled(p), context, portfolio);
    expect(intents).toEqual([
      expect.objectContaining({
        symbol: "NVDA",
        side: "sell",
        quantity: 40,
        playbookId: "TEST-NVDA",
        playbookMode: "standard",
        urgent: true,
      }),
    ]);
    expect(trips).toEqual([
      {
        playbookId: "TEST-NVDA",
        mode: "standard",
        symbol: "NVDA",
        drawdownPct: expect.any(Number),
        drawdownTripPct: 0.1,
        enforcement: "enforce",
      },
    ]);
  });

  it("reports the trip but emits no intent when enforcement is alert-only", () => {
    const p = play({
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "alert-only" } },
    });
    const context = aContext({ NVDA: { last: 85 } });
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 })],
    });

    const { intents, trips } = exitSafetyIntents(enabled(p), context, portfolio);
    expect(intents).toEqual([]);
    expect(trips).toHaveLength(1);
    expect(trips[0]?.enforcement).toBe("alert-only");
  });

  it("never trips a flat position, even with a dial declared", () => {
    const p = play({
      exitSafety: { standard: { drawdownTripPct: 0.01, enforcement: "enforce" } },
    });
    const context = aContext({ NVDA: { last: 50 } });
    const portfolio = aPortfolio({ positions: [] });

    const { intents, trips } = exitSafetyIntents(enabled(p), context, portfolio);
    expect(intents).toEqual([]);
    expect(trips).toEqual([]);
  });

  it("trips one symbol of a basket independently, leaving a healthy sibling untouched", () => {
    const p = play({
      symbols: ["NVDA", "AMD"],
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } },
    });
    const context = aContext({ NVDA: { last: 85 }, AMD: { last: 98 } }); // NVDA -15%, AMD -2%
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 }),
        aPosition({ symbol: "AMD", quantity: 10, avgPrice: 100 }),
      ],
    });

    const { intents, trips } = exitSafetyIntents(enabled(p), context, portfolio);
    expect(intents).toEqual([expect.objectContaining({ symbol: "NVDA", side: "sell" })]);
    expect(trips.map((t) => t.symbol)).toEqual(["NVDA"]);
  });
});

describe("playbookIntents: exit-safety overrides the playbook's own desired state", () => {
  it("flattens on a trip even though desiredState still wants long, and never double-sells", () => {
    const p = play({
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } },
    });
    const context = aContext({ NVDA: { last: 85 } });
    const portfolio = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 })],
    });

    const intents = playbookIntents(enabled(p), context, portfolio, calendar);
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      side: "sell",
      quantity: 40,
      reason: expect.stringMatching(/exit-safety trip/),
    });
  });

  it("a playbook declaring no exitSafety is completely unaffected (today's roster)", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const portfolio = aPortfolio({ cash: 100_000 });

    const intents = playbookIntents(enabled(play()), context, portfolio, calendar);
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ side: "buy" });
  });
});
