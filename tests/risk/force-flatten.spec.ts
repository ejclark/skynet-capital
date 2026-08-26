import { applyGuards } from "../../src/engine/guards.js";
import { planForceFlatten } from "../../src/risk/force-flatten.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

const REASON = "risk ladder: liquidate rung reached";

describe("planForceFlatten", () => {
  it("sells every long, in full", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA", quantity: 40 }),
        aPosition({ symbol: "AMD", quantity: 7 }),
      ],
    });

    const plan = planForceFlatten(portfolio, REASON);

    expect(plan.intents).toEqual([
      { symbol: "NVDA", side: "sell", quantity: 40, type: "market", reason: REASON, urgent: true },
      { symbol: "AMD", side: "sell", quantity: 7, type: "market", reason: REASON, urgent: true },
    ]);
    expect(plan.unflattened).toEqual([]);
  });

  it("claims urgency, so the defer-the-open discipline cannot sit on a flatten", () => {
    const plan = planForceFlatten(
      aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] }),
      REASON,
    );
    expect(plan.intents.every((intent) => intent.urgent)).toBe(true);
  });

  it("plans nothing for an already-flat book", () => {
    expect(planForceFlatten(aPortfolio(), REASON)).toEqual({ intents: [], unflattened: [] });
  });

  it("ignores a zero-quantity row — that is not a position", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 0 })] });
    expect(planForceFlatten(portfolio, REASON)).toEqual({ intents: [], unflattened: [] });
  });

  it("REPORTS a short it cannot close rather than claiming a flat book", () => {
    // Selling cannot close a short and this engine has no covering path. Silence here would be a
    // lie in exactly the situation the function exists for, so the symbol comes back named.
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA", quantity: 40 }),
        aPosition({ symbol: "EEM", quantity: -12 }),
      ],
    });

    const plan = planForceFlatten(portfolio, REASON);

    expect(plan.intents).toHaveLength(1);
    expect(plan.intents[0]?.symbol).toBe("NVDA");
    expect(plan.unflattened).toEqual(["EEM"]);
  });

  it("carries the reason through, so the audit trail says why the book was closed", () => {
    const plan = planForceFlatten(
      aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] }),
      REASON,
    );
    expect(plan.intents[0]?.reason).toBe(REASON);
  });

  describe("against the guards that will see it", () => {
    it("survives the ladder's own block rung — the flatten is never blocked by the rung that ordered it", () => {
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] });
      const plan = planForceFlatten(portfolio, REASON);

      const approved = applyGuards(plan.intents, portfolio, aContext({ NVDA: { last: 180 } }), {
        maxPositionPct: 0.2,
        accountTier: "liquidate",
      });

      expect(approved).toHaveLength(1);
      expect(approved[0]).toMatchObject({ symbol: "NVDA", side: "sell", quantity: 40 });
    });
  });
});
