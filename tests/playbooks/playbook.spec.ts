import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type EnabledPlaybook,
  type Playbook,
  playbookIntents,
  printWindow,
} from "../../src/playbooks/playbook.js";
import type { TacticalRule } from "../../src/playbooks/tactical-playbook.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

const calendar: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "test" },
];

const play = (overrides?: Partial<Playbook>): Playbook => ({
  id: "TEST-NVDA",
  symbols: ["NVDA"],
  thesis: "test play",
  evidence: "test",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "long",
  ...overrides,
});

const enabled = (p: Playbook, mode: EnabledPlaybook["mode"] = "standard"): EnabledPlaybook[] => [
  { playbook: p, mode },
];

describe("printWindow", () => {
  it("reports days and confirmation for the symbol's next print", () => {
    expect(printWindow("NVDA", "2026-08-16T14:00:00Z", calendar)).toEqual({
      days: 10,
      confirmed: true,
    });
  });

  it("is undefined with no upcoming print", () => {
    expect(printWindow("XYZ", "2026-08-16T14:00:00Z", calendar)).toBeUndefined();
  });
});

describe("playbookIntents", () => {
  it("opens from flat when the play wants long — sized by mode, fully attributed", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const portfolio = aPortfolio({ cash: 100_000 });

    const [intent] = playbookIntents(enabled(play()), context, portfolio, calendar);

    // standard = 2% of ~$100k equity at ~$100 -> ~19-20 shares
    expect(intent).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      playbookId: "TEST-NVDA",
      playbookMode: "standard",
    });
    expect(intent?.quantity).toBeGreaterThan(15);
    expect(intent?.quantity).toBeLessThanOrEqual(20);
  });

  it("does nothing while already positioned and still wanting long", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });

    expect(playbookIntents(enabled(play()), context, portfolio, calendar)).toEqual([]);
  });

  it("flattens the WHOLE position when the play wants flat — S2's exit side", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-24T15:00:00Z");
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });
    const flat = play({ desiredState: () => "flat" });

    const [intent] = playbookIntents(enabled(flat), context, portfolio, calendar);

    expect(intent).toMatchObject({
      side: "sell",
      quantity: 20,
      playbookId: "TEST-NVDA",
    });
  });

  it("threads the optional events feed to a playbook that declares it, defaulting to empty", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    let seen: unknown;
    const eventAware = play({
      desiredState: (_asOf, _cal, events) => {
        seen = events;
        return "no-window";
      },
    });

    playbookIntents(enabled(eventAware), context, aPortfolio(), calendar);
    expect(seen).toEqual([]);

    const passed = [{ symbol: "NVDA", detectedAt: "2026-08-16T14:50:00Z" }];
    playbookIntents(enabled(eventAware), context, aPortfolio(), calendar, passed);
    expect(seen).toBe(passed);
  });

  it("is silent in no-window, positioned or not", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const dark = play({ desiredState: () => "no-window" });

    expect(playbookIntents(enabled(dark), context, aPortfolio(), calendar)).toEqual([]);
    expect(
      playbookIntents(
        enabled(dark),
        context,
        aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 5 })] }),
        calendar,
      ),
    ).toEqual([]);
  });

  describe("multi-symbol baskets", () => {
    const basket = play({ symbols: ["NVDA", "AMD"] });

    it("applies one shared desiredState to every symbol in the basket", () => {
      const context = aContext({ NVDA: { last: 100 }, AMD: { last: 50 } }, "2026-08-16T15:00:00Z");
      const portfolio = aPortfolio({ cash: 100_000 });

      const intents = playbookIntents(enabled(basket), context, portfolio, calendar);

      expect(intents.map((i) => i.symbol).sort()).toEqual(["AMD", "NVDA"]);
      for (const intent of intents) {
        expect(intent).toMatchObject({ side: "buy", playbookId: "TEST-NVDA" });
      }
    });

    it("flattens only the symbols actually held, ignoring one still flat", () => {
      const context = aContext({ NVDA: { last: 100 }, AMD: { last: 50 } }, "2026-08-24T15:00:00Z");
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });
      const flatBasket = play({ symbols: ["NVDA", "AMD"], desiredState: () => "flat" });

      const intents = playbookIntents(enabled(flatBasket), context, portfolio, calendar);

      expect(intents).toEqual([
        expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 20 }),
      ]);
    });

    it("sizes each symbol independently against its own held quantity and quote", () => {
      const context = aContext({ NVDA: { last: 100 }, AMD: { last: 50 } }, "2026-08-16T15:00:00Z");
      // Already positioned in NVDA (wants long, held > 0 -> silent) but flat in AMD (wants long,
      // held == 0 -> enters) — proves the loop doesn't treat the basket as one scalar position.
      const portfolio = aPortfolio({
        cash: 100_000,
        positions: [aPosition({ symbol: "NVDA", quantity: 20 })],
      });

      const intents = playbookIntents(enabled(basket), context, portfolio, calendar);

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "AMD", side: "buy" });
    });
  });

  describe("tactical playbooks (issue #3527 plan, slice 2)", () => {
    const scalpRule: TacticalRule = {
      kind: "momentum-scalp",
      momentumAtOrAbove: 0.01,
      sentimentAbove: -0.35,
      sentimentBelow: 0.35,
      notional: 8_000,
      maxTrancheValue: 36_000,
    };

    it("takes priority over desiredState when tactics are declared, even if desiredState would fire", () => {
      const context = aContext(
        { NVDA: { last: 100, momentum: 0.02, sentiment: 0.1 } },
        "2026-08-16T15:00:00Z",
      );
      // desiredState says "long" (the default `play()` fixture) — if it ran, entry sizing would
      // be 2% of equity; the tactic's own notional-based sizing proves desiredState never ran.
      const tactical = play({ tactics: [scalpRule] });

      const [intent] = playbookIntents(
        enabled(tactical),
        context,
        aPortfolio({ cash: 100_000 }),
        calendar,
      );

      expect(intent).toMatchObject({ symbol: "NVDA", side: "buy", playbookId: "TEST-NVDA" });
      expect((intent?.quantity ?? 0) * 100.05).toBeLessThan(9_000); // ~$8k tranche, not ~2% of $100k
    });

    it("returns nothing when no tactic in the chain fires", () => {
      const context = aContext(
        { NVDA: { last: 100, momentum: 0, sentiment: 0 } },
        "2026-08-16T15:00:00Z",
      );
      const tactical = play({ tactics: [scalpRule] });

      expect(
        playbookIntents(enabled(tactical), context, aPortfolio({ cash: 100_000 }), calendar),
      ).toEqual([]);
    });

    it("applies the tactic chain independently per symbol in a basket", () => {
      const context = aContext(
        {
          NVDA: { last: 100, momentum: 0.02, sentiment: 0.1 },
          AMD: { last: 50, momentum: 0, sentiment: 0 },
        },
        "2026-08-16T15:00:00Z",
      );
      const tactical = play({ symbols: ["NVDA", "AMD"], tactics: [scalpRule] });

      const intents = playbookIntents(
        enabled(tactical),
        context,
        aPortfolio({ cash: 100_000 }),
        calendar,
      );

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "NVDA" });
    });

    it("skips a symbol an exit-safety trip already claimed this cycle", () => {
      const context = aContext(
        { NVDA: { last: 90, momentum: 0.02, sentiment: 0.1 } },
        "2026-08-16T15:00:00Z",
      );
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 100, avgPrice: 100 })],
      });
      const tactical = play({
        tactics: [scalpRule],
        exitSafety: { standard: { drawdownTripPct: 0.05, enforcement: "enforce" } },
      });

      const intents = playbookIntents(enabled(tactical), context, portfolio, calendar);

      // Only the exit-safety trip's own sell — the scalp tactic never got a look at NVDA this cycle.
      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ side: "sell", quantity: 100 });
    });
  });
});
