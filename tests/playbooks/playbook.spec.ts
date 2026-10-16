import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type EnabledPlaybook,
  isExitIntent,
  type Playbook,
  pausedMayPlace,
  playbookIntents,
  printWindow,
} from "../../src/playbooks/playbook.js";
import { aContext, anOptionIntent, aPortfolio, aPosition } from "../support/builders.js";

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
});

/** PAUSE = EXITS ONLY (#4651): a paused entry keeps managing to flat and never opens. */
describe("a paused (exits-only) entry", () => {
  const order = (side: "buy" | "sell") =>
    ({ symbol: "NVDA", side, quantity: 1, type: "market", reason: "test" }) as const;

  it("judges an exit by risk taken off: a share sell or an option close, never a sold put", () => {
    expect(isExitIntent(order("sell"))).toBe(true);
    expect(isExitIntent(order("buy"))).toBe(false);
    expect(isExitIntent(anOptionIntent())).toBe(false);
    expect(isExitIntent(anOptionIntent({ side: "buy", option: { effect: "close" } }))).toBe(true);
  });

  // The one risk-reducing open (#4651): a covered call can only deliver shares already held.
  it("may still place its exits and a covered call — never a put, a spread or a share buy", () => {
    const coveredCall = anOptionIntent({ option: { structure: "covered-call" } });
    expect(pausedMayPlace(order("sell"))).toBe(true);
    expect(pausedMayPlace(anOptionIntent({ side: "buy", option: { effect: "close" } }))).toBe(true);
    expect(pausedMayPlace(coveredCall)).toBe(true);
    expect(isExitIntent(coveredCall)).toBe(false);
    expect(pausedMayPlace(order("buy"))).toBe(false);
    expect(pausedMayPlace(anOptionIntent())).toBe(false);
    expect(pausedMayPlace(anOptionIntent({ option: { structure: "call-debit-spread" } }))).toBe(
      false,
    );
  });

  it("keeps a decide playbook's option close and drops its opens", () => {
    const close = anOptionIntent({ side: "buy", option: { effect: "close" } });
    const decider = play({
      id: "CRWV-WHEEL",
      symbols: ["CRWV"],
      decide: () => [anOptionIntent(), close],
    });
    const context = aContext({ CRWV: { last: 92 } });
    const running = playbookIntents(enabled(decider), context, aPortfolio(), calendar);
    expect(running.map((i) => i.option?.effect)).toEqual(["open", "close"]);
    const paused = playbookIntents(
      [{ playbook: decider, mode: "standard", exitsOnly: true }],
      context,
      aPortfolio(),
      calendar,
    );
    expect(paused.map((i) => i.option?.effect)).toEqual(["close"]);
  });

  it("still sells a held position when its window closes, and buys nothing when it opens", () => {
    const held = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });
    const pausedFlat: EnabledPlaybook[] = [
      { playbook: play({ desiredState: () => "flat" }), mode: "standard", exitsOnly: true },
    ];
    expect(playbookIntents(pausedFlat, aContext({ NVDA: {} }), held, calendar)).toEqual([
      expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 20 }),
    ]);
    const pausedLong: EnabledPlaybook[] = [{ playbook: play(), mode: "standard", exitsOnly: true }];
    expect(playbookIntents(pausedLong, aContext({ NVDA: {} }), aPortfolio(), calendar)).toEqual([]);
  });
});
