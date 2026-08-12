import type { OrderIntent, PlaybookMode } from "../../src/domain/types.js";
import { applyGuards } from "../../src/engine/guards.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

const buy = (symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side: "buy",
  quantity,
  type: "market",
  reason: "test",
});

const sell = (symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side: "sell",
  quantity,
  type: "market",
  reason: "test",
});

describe("applyGuards", () => {
  describe("a buy larger than the per-position cap", () => {
    it("is clamped down to the cap, not dropped", () => {
      const context = aContext({ EEM: { last: 100 } }); // ask ~100.05
      const portfolio = aPortfolio({ cash: 1_000_000 });

      // 20% of $1M equity = $200k budget -> ~1999 shares at ~100.05.
      const [approved] = applyGuards([buy("EEM", 10_000)], portfolio, context, {
        maxPositionPct: 0.2,
      });

      expect(approved?.side).toBe("buy");
      expect(approved?.quantity).toBeGreaterThan(0);
      expect(approved?.quantity).toBeLessThan(10_000);
      // Position value must not exceed the 20% cap.
      const eemAsk = context.quotes.EEM?.ask ?? 0;
      expect((approved?.quantity ?? 0) * eemAsk).toBeLessThanOrEqual(200_000);
    });
  });

  describe("a buy with no cash", () => {
    it("is dropped entirely", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ cash: 0 });

      expect(applyGuards([buy("EEM", 10)], portfolio, context)).toEqual([]);
    });
  });

  describe("a sell larger than the holding", () => {
    it("is clamped to the quantity actually held", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "EEM", quantity: 30 })] });

      const [approved] = applyGuards([sell("EEM", 500)], portfolio, context);

      expect(approved).toMatchObject({ side: "sell", quantity: 30 });
    });
  });

  describe("a sell of something not held", () => {
    it("is dropped (no accidental shorting)", () => {
      const context = aContext({ EEM: { last: 100 } });

      expect(applyGuards([sell("EEM", 10)], aPortfolio(), context)).toEqual([]);
    });
  });

  // The playbook seam (docs/plans/trade-playbooks.md slice 1): attribution must survive risk
  // clamping — a clamped order that lost its playbookId would be unscoreable by the metrics layer.
  describe("playbook attribution on an intent", () => {
    it("survives a buy being clamped", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ cash: 1_000_000 });
      const mode: PlaybookMode = "standard";

      const [approved] = applyGuards(
        [{ ...buy("EEM", 10_000), playbookId: "S1-NVDA", playbookMode: mode }],
        portfolio,
        context,
        { maxPositionPct: 0.2 },
      );

      expect(approved?.quantity).toBeLessThan(10_000); // it really was clamped
      expect(approved).toMatchObject({ playbookId: "S1-NVDA", playbookMode: "standard" });
    });

    it("survives a sell being clamped", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "EEM", quantity: 30 })] });

      const [approved] = applyGuards(
        [{ ...sell("EEM", 500), playbookId: "G1-GOOG", playbookMode: "aggressive" }],
        portfolio,
        context,
      );

      expect(approved).toMatchObject({ quantity: 30, playbookId: "G1-GOOG" });
    });
  });

  // S2 + E1 (docs/plans/trade-playbooks.md slices 3/4, entry side) — opt-in via
  // RiskConfig.discipline, and INERT without it: that absence is what keeps evals and the
  // readiness gate untouched, so the first spec here is the inertness itself.
  describe("trade discipline (S2 flat-through-print + E1 defer-the-open)", () => {
    // 15:00 UTC = 11:00 ET in August — comfortably past the open, no print nearby.
    const midday = "2026-08-14T15:00:00.000Z";
    const calendar = [
      { symbol: "EEM", date: "2026-08-26", status: "estimate" as const, source: "test" },
    ];
    const discipline = { calendar };
    const at = (asOf: string) => aContext({ EEM: { last: 100 } }, asOf);

    it("without a discipline config, both guards are inert — the eval-path guarantee", () => {
      // 09:35 ET on a print-adjacent day: both rules WOULD fire if configured.
      const context = at("2026-08-25T13:35:00.000Z");
      const approved = applyGuards([buy("EEM", 10)], aPortfolio({ cash: 10_000 }), context);
      expect(approved).toHaveLength(1);
    });

    it("S2 drops a buy when a print sits inside the flat window", () => {
      const context = at("2026-08-25T15:00:00.000Z"); // D-1, 11:00 ET
      const approved = applyGuards([buy("EEM", 10)], aPortfolio({ cash: 10_000 }), context, {
        maxPositionPct: 0.2,
        discipline,
      });
      expect(approved).toEqual([]);
    });

    it("S2 lets an explicit allowThroughPrint intent pass — deliberate, recorded opt-out", () => {
      const context = at("2026-08-25T15:00:00.000Z");
      const approved = applyGuards(
        [{ ...buy("EEM", 10), allowThroughPrint: true }],
        aPortfolio({ cash: 10_000 }),
        context,
        { maxPositionPct: 0.2, discipline },
      );
      expect(approved).toHaveLength(1);
    });

    it("S2 leaves buys alone outside the window", () => {
      const approved = applyGuards([buy("EEM", 10)], aPortfolio({ cash: 10_000 }), at(midday), {
        maxPositionPct: 0.2,
        discipline,
      });
      expect(approved).toHaveLength(1);
    });

    it("E1 drops a non-urgent buy before 10:00 ET", () => {
      const context = at("2026-08-14T13:35:00.000Z"); // 09:35 ET (EDT)
      const approved = applyGuards([buy("EEM", 10)], aPortfolio({ cash: 10_000 }), context, {
        maxPositionPct: 0.2,
        discipline,
      });
      expect(approved).toEqual([]);
    });

    it("E1 lets an urgent buy take the open — urgency claimed, not assumed", () => {
      const context = at("2026-08-14T13:35:00.000Z");
      const approved = applyGuards(
        [{ ...buy("EEM", 10), urgent: true }],
        aPortfolio({ cash: 10_000 }),
        context,
        { maxPositionPct: 0.2, discipline },
      );
      expect(approved).toHaveLength(1);
    });

    it("neither rule ever touches a sell — exits always pass", () => {
      const context = at("2026-08-25T13:35:00.000Z"); // pre-open AND print-adjacent
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "EEM", quantity: 30 })] });
      const approved = applyGuards([sell("EEM", 30)], portfolio, context, {
        maxPositionPct: 0.2,
        discipline,
      });
      expect(approved).toHaveLength(1);
    });
  });
});
