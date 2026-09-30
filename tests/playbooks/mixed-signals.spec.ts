import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import {
  detectMixedSignals,
  formatMixedSignals,
  type MixedSignalsDial,
  observeMixedSignals,
} from "../../src/playbooks/mixed-signals.js";
import type { EnabledPlaybook, Playbook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, HC_SAURON, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * #3194 step 5 — the mixed-signals detector, observe-only. The rule under test is written out in
 * `src/playbooks/mixed-signals.ts`'s module doc: both shared signals past their floors, pointing
 * opposite ways.
 */

const OBSERVE: MixedSignalsDial = { action: "observe" };

function play(id: string, symbols: string[], dial?: MixedSignalsDial): Playbook {
  return {
    id,
    symbols,
    thesis: "test",
    evidence: "test",
    size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
    desiredState: () => "long",
    ...(dial ? { mixedSignals: dial } : {}),
  };
}

const on = (playbook: Playbook): EnabledPlaybook => ({ playbook, mode: "standard" });

describe("detectMixedSignals: the rule", () => {
  it("flags rising price against bad news", () => {
    const context = aContext({ NVDA: { momentum: 0.05, sentiment: -0.5 } });
    expect(detectMixedSignals([on(play("P", ["NVDA"], OBSERVE))], context)).toEqual([
      {
        playbookId: "P",
        symbol: "NVDA",
        asOf: context.asOf,
        momentum: 0.05,
        newsSentiment: -0.5,
      },
    ]);
  });

  it("flags falling price against good news", () => {
    const context = aContext({ NVDA: { momentum: -0.03, sentiment: 0.4 } });
    expect(detectMixedSignals([on(play("P", ["NVDA"], OBSERVE))], context)).toHaveLength(1);
  });

  it("stays quiet when price and news agree", () => {
    const context = aContext({ NVDA: { momentum: 0.05, sentiment: 0.5 } });
    expect(detectMixedSignals([on(play("P", ["NVDA"], OBSERVE))], context)).toEqual([]);
  });

  it("treats a signal below its default floor as no reading, not a disagreement", () => {
    const weakMomentum = aContext({ NVDA: { momentum: 0.019, sentiment: -0.9 } });
    const weakNews = aContext({ NVDA: { momentum: 0.2, sentiment: -0.19 } });
    const p = [on(play("P", ["NVDA"], OBSERVE))];
    expect(detectMixedSignals(p, weakMomentum)).toEqual([]);
    expect(detectMixedSignals(p, weakNews)).toEqual([]);
  });

  it("counts a reading exactly at the floor as a direction", () => {
    const context = aContext({ NVDA: { momentum: 0.02, sentiment: -0.2 } });
    expect(detectMixedSignals([on(play("P", ["NVDA"], OBSERVE))], context)).toHaveLength(1);
  });

  it("treats an absent signal as no reading", () => {
    const noNews = aContext({ NVDA: { momentum: 0.1 } });
    const noMomentum = aContext({ NVDA: { sentiment: -0.9 } });
    const p = [on(play("P", ["NVDA"], OBSERVE))];
    expect(detectMixedSignals(p, noNews)).toEqual([]);
    expect(detectMixedSignals(p, noMomentum)).toEqual([]);
  });

  it("honors a playbook's own floors", () => {
    const context = aContext({ NVDA: { momentum: 0.05, sentiment: -0.5 } });
    const strict: MixedSignalsDial = { action: "observe", momentumFloor: 0.1 };
    const loose: MixedSignalsDial = {
      action: "observe",
      momentumFloor: 0.01,
      sentimentFloor: 0.05,
    };
    expect(detectMixedSignals([on(play("P", ["NVDA"], strict))], context)).toEqual([]);
    expect(
      detectMixedSignals(
        [on(play("P", ["NVDA"], loose))],
        aContext({ NVDA: { momentum: 0.015, sentiment: -0.1 } }),
      ),
    ).toHaveLength(1);
  });

  it("checks every symbol in a basket on its own readings", () => {
    const context = aContext({
      NVDA: { momentum: 0.05, sentiment: -0.5 },
      AMD: { momentum: 0.05, sentiment: 0.5 },
    });
    const found = detectMixedSignals([on(play("B", ["NVDA", "AMD"], OBSERVE))], context);
    expect(found.map((o) => o.symbol)).toEqual(["NVDA"]);
  });
});

describe("detectMixedSignals: opt-in, off by default", () => {
  it("never looks at a playbook that does not declare mixedSignals", () => {
    const context = aContext({ NVDA: { momentum: 0.05, sentiment: -0.5 } });
    expect(detectMixedSignals([on(play("P", ["NVDA"]))], context)).toEqual([]);
  });

  it("opts in exactly one house playbook, S1-NVDA, and only to observe", () => {
    expect(S1_NVDA.mixedSignals).toEqual({ action: "observe" });
    // HC-SAURON trades this very disagreement (contrarian); TACO-DJT has no news feed; G1-GOOG
    // is the runner-up, left dark so the falsifier reads one playbook's tape.
    for (const p of [G1_GOOG, TACO_DJT, HC_SAURON]) {
      expect(p.mixedSignals).toBeUndefined();
    }
    const context = aContext({
      NVDA: { momentum: 0.1, sentiment: -0.9 },
      GOOG: { momentum: 0.1, sentiment: -0.9 },
      DJT: { momentum: 0.1, sentiment: -0.9 },
    });
    const all = [S1_NVDA, G1_GOOG, TACO_DJT, HC_SAURON].map(on);
    expect(detectMixedSignals(all, context).map((o) => `${o.playbookId}/${o.symbol}`)).toEqual([
      "S1-NVDA/NVDA",
    ]);
  });
});

describe("detectMixedSignals: decision isolation", () => {
  it("gives a playbook the same observations alone as alongside an opted-in peer", () => {
    const context = aContext({
      NVDA: { momentum: 0.05, sentiment: -0.5 },
      GOOG: { momentum: 0.03, sentiment: -0.3 },
    });
    const a = on(play("A", ["NVDA"], OBSERVE));
    // A peer on an OVERLAPPING symbol with different floors — its reading must not leak into A's.
    const peer = on(play("B", ["NVDA", "GOOG"], { action: "observe", momentumFloor: 0.2 }));
    const alone = detectMixedSignals([a], context);
    const withPeer = detectMixedSignals([peer, a], context).filter((o) => o.playbookId === "A");
    expect(withPeer).toEqual(alone);
  });
});

describe("observeMixedSignals: logs, and only logs", () => {
  it("writes one plain-words line per observation", () => {
    const lines: string[] = [];
    const context = aContext({ NVDA: { momentum: 0.05, sentiment: -0.5 } }, "2026-09-30T14:30:00Z");
    observeMixedSignals([on(play("P", ["NVDA"], OBSERVE))], context, { log: (l) => lines.push(l) });
    expect(lines).toEqual([
      "[mixed-signals] P NVDA @ 2026-09-30T14:30:00Z: momentum 5.0% vs news sentiment -0.50 " +
        "(observe-only — no order placed, changed or held back)",
    ]);
  });

  it("formats a single observation the same way the sink receives it", () => {
    const [o] = detectMixedSignals(
      [on(play("P", ["NVDA"], OBSERVE))],
      aContext({ NVDA: { momentum: -0.04, sentiment: 0.3 } }),
    );
    expect(o && formatMixedSignals(o)).toContain("momentum -4.0% vs news sentiment 0.30");
  });
});

describe("withPlaybooks + mixed signals: no order is placed, changed or suppressed", () => {
  const calendar: readonly EarningsPrint[] = [];
  const base: Persona = {
    id: "base",
    name: "Base",
    thesis: "test",
    decide: (): OrderIntent[] => [
      { symbol: "AAPL", side: "buy", quantity: 5, type: "market", reason: "reflex" },
    ],
  };
  const context = aContext(
    { NVDA: { last: 100, momentum: 0.05, sentiment: -0.5 }, AAPL: { last: 100 } },
    "2026-09-30T14:30:00Z",
  );
  const portfolio = aPortfolio({ cash: 10_000 });

  it("returns byte-identical intents with the detector opted in as without it, and logs the reading", () => {
    const lines: string[] = [];
    const without = withPlaybooks(base, [on(play("P", ["NVDA"]))], calendar).decide(
      context,
      portfolio,
    );
    const withDial = withPlaybooks(base, [on(play("P", ["NVDA"], OBSERVE))], calendar, [], {
      log: (l) => lines.push(l),
    }).decide(context, portfolio);
    expect(withDial).toEqual(without);
    expect(withDial.some((i) => i.symbol === "NVDA" && i.side === "buy")).toBe(true);
    expect(lines).toHaveLength(1);
  });

  it("logs nothing through the default sink path when no playbook opts in", () => {
    const lines: string[] = [];
    withPlaybooks(base, [on(play("P", ["NVDA"]))], calendar, [], {
      log: (l) => lines.push(l),
    }).decide(context, portfolio);
    expect(lines).toEqual([]);
  });
});

describe("S1-NVDA in the live composition (#3194 step 5b-i)", () => {
  // Inside S1's entry window: a confirmed print 10 days out, so desiredState says "long".
  const calendar: readonly EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-10-10", status: "confirmed", source: "test fixture" },
  ];
  const base: Persona = {
    id: "base",
    name: "Base",
    thesis: "test",
    decide: (): OrderIntent[] => [
      { symbol: "AAPL", side: "buy", quantity: 5, type: "market", reason: "reflex" },
      { symbol: "NVDA", side: "sell", quantity: 1, type: "market", reason: "reflex" },
    ],
  };
  const mixed = aContext(
    { NVDA: { last: 100, momentum: 0.05, sentiment: -0.5 }, AAPL: { last: 100 } },
    "2026-09-30T14:30:00Z",
  );
  const portfolio = aPortfolio({ cash: 10_000 });
  const { mixedSignals: _dial, ...withoutDetector } = S1_NVDA;

  it("logs the mixed reading for S1-NVDA on a mixed-signal fixture", () => {
    const lines: string[] = [];
    withPlaybooks(base, [on(S1_NVDA)], calendar, [], { log: (l) => lines.push(l) }).decide(
      mixed,
      portfolio,
    );
    expect(lines).toEqual([
      "[mixed-signals] S1-NVDA NVDA @ 2026-09-30T14:30:00Z: momentum 5.0% vs news sentiment " +
        "-0.50 (observe-only — no order placed, changed or held back)",
    ]);
  });

  it("returns byte-identical intents with and without the detector", () => {
    const lines: string[] = [];
    const withDial = withPlaybooks(base, [on(S1_NVDA)], calendar, [], {
      log: (l) => lines.push(l),
    }).decide(mixed, portfolio);
    const without = withPlaybooks(base, [on(withoutDetector)], calendar).decide(mixed, portfolio);
    expect(JSON.stringify(withDial)).toBe(JSON.stringify(without));
    // The entry still fires on the mixed cycle — observing never holds it back.
    expect(withDial.some((i) => i.symbol === "NVDA" && i.side === "buy")).toBe(true);
    expect(lines).toHaveLength(1);
  });
});
