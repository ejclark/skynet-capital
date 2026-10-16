import type { OrderIntent, PlaybookMode } from "../../src/domain/types.js";
import { PLAYBOOK_MODES } from "../../src/domain/types.js";
import { readPlaybookWindow } from "../../src/observatory/playbook-window.js";
import type { Persona } from "../../src/personas/persona.js";
import { findPair, pairFor } from "../../src/playbooks/pair-table.js";
import {
  type EnabledPlaybook,
  exitSafetyIntents,
  type Playbook,
  playbookIntents,
  playbookVerdicts,
} from "../../src/playbooks/playbook.js";
import {
  MU_DIP_BOUNCE,
  NBIS_DIP_BOUNCE,
  registeredPlaybooks,
} from "../../src/playbooks/registry.js";
import { managedSymbols, withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * THE NEVER-PLACES-AN-ORDER GUARANTEE (#5489 slice 2). A dark playbook records its verdict and
 * places nothing — not because its rules happen to be quiet today, but because the engine drops
 * whatever it would answer. Pinned against a hostile dark playbook that tries every route to an
 * order (a `decide`, a "long" window, an enforced exit-safety dial on a position in drawdown), and
 * against the two registered dip-to-bounce pairs.
 */

const context = aContext({ MU: { last: 50 }, NBIS: { last: 50 }, AAPL: { last: 200 } });
/** Held at $90 and marked at $50: deep in drawdown, so any exit route would fire if it could. */
const portfolio = aPortfolio({
  positions: [
    aPosition({ symbol: "MU", avgPrice: 90 }),
    aPosition({ symbol: "NBIS", avgPrice: 90 }),
  ],
});

const buy = (symbol: string): OrderIntent => ({
  symbol,
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "would trade",
});

/** Every route to an order a playbook has, all switched on, with the dark flag set. */
const hostile: Playbook = {
  id: "TEST-DARK",
  symbols: ["MU"],
  thesis: "test",
  evidence: "test",
  size: { conservative: 0.5, standard: 0.5, aggressive: 0.5 },
  observeOnly: true,
  desiredState: () => "long",
  decide: () => [buy("MU"), { ...buy("MU"), side: "sell" }],
  exitSafety: { standard: { drawdownTripPct: 0.01, enforcement: "enforce" } },
};

const every = (playbook: Playbook): EnabledPlaybook[] =>
  PLAYBOOK_MODES.map((mode: PlaybookMode) => ({ playbook, mode }));

describe("a dark playbook places nothing, whatever its rules answer", () => {
  it("contributes no intent through decide, its window, or exit safety", () => {
    expect(playbookIntents(every(hostile), context, portfolio, [])).toEqual([]);
    expect(exitSafetyIntents(every(hostile), context, portfolio)).toEqual({
      intents: [],
      trips: [],
    });
  });

  it("still contributes nothing when paused", () => {
    const paused: EnabledPlaybook[] = [{ playbook: hostile, mode: "standard", exitsOnly: true }];
    expect(playbookIntents(paused, context, portfolio, [])).toEqual([]);
  });

  it("records its verdict as observing, never a window or live trading", () => {
    expect(playbookVerdicts(every(hostile), context.asOf, [])).toEqual(
      PLAYBOOK_MODES.map((mode) => ({ playbookId: "TEST-DARK", mode, state: "observing" })),
    );
    expect(readPlaybookWindow(hostile, "observing", new Date(context.asOf)).reason).toBe(
      "On, observe-only — it records what it would buy and sell in MU and places nothing.",
    );
  });

  it("takes no name from the bot it runs on, so subscribing changes nothing that bot does", () => {
    const base: Persona = {
      id: "base",
      name: "Base",
      thesis: "test",
      decide: () => [buy("MU"), buy("AAPL")],
    };
    const composed = withPlaybooks(base, every(hostile), []);
    expect(managedSymbols("base", every(hostile))).toEqual(new Set());
    expect(composed.decide(context, portfolio)).toEqual(base.decide(context, portfolio));
    expect(composed.playbookVerdicts?.(context).map((v) => v.state)).toEqual([
      "observing",
      "observing",
      "observing",
    ]);
  });

  it("leaves a lit playbook beside it untouched", () => {
    const lit: Playbook = {
      ...hostile,
      id: "TEST-LIT",
      observeOnly: undefined,
      exitSafety: undefined,
    };
    const intents = playbookIntents(
      [...every(hostile), { playbook: lit, mode: "standard" }],
      context,
      portfolio,
      [],
    );
    expect(intents.map((i) => i.playbookId)).toEqual(["TEST-LIT", "TEST-LIT"]);
  });
});

describe("the dip-to-bounce pairs, MU and NBIS, are dark", () => {
  const pairs = [MU_DIP_BOUNCE, NBIS_DIP_BOUNCE];

  it.each(pairs)("$id places nothing in any mode, holding or flat", (playbook) => {
    expect(playbookIntents(every(playbook), context, portfolio, [])).toEqual([]);
    expect(playbookIntents(every(playbook), context, aPortfolio(), [])).toEqual([]);
    expect(playbook.observeOnly).toBe(true);
  });

  it.each(pairs)("$id is sized at zero in every mode besides", (playbook) => {
    expect(Object.values(playbook.size)).toEqual([0, 0, 0]);
  });

  it("is the only route a registered playbook has to being dark today", () => {
    const dark = registeredPlaybooks().filter((p) => p.observeOnly);
    expect(dark.map((p) => p.id)).toEqual(["MU-DIP-BOUNCE", "NBIS-DIP-BOUNCE"]);
  });

  it("carries the study's evidence: MU researched at low confidence, NBIS weakened", () => {
    const mu = findPair("MU-DIP-BOUNCE");
    const nbis = findPair("NBIS-DIP-BOUNCE");
    expect(pairFor("dip-bounce", "MU")?.id).toBe("MU-DIP-BOUNCE");
    expect(mu?.evidence).toMatchObject({ status: "researched" });
    expect(mu?.evidence.qualifier).toBeUndefined();
    expect(nbis?.evidence).toMatchObject({ status: "researched", qualifier: "weakened" });
    expect([mu?.evidence.confidence, nbis?.evidence.confidence]).toEqual(["low", "low"]);
    // The study's falsifier date — a re-run on fresh bars — is when the verdicts go stale.
    expect([mu?.evidence.shelfOn, nbis?.evidence.shelfOn]).toEqual(["2027-01-15", "2027-01-15"]);
    expect(pairFor("dip-bounce", "CRWV")).toBeUndefined();
  });
});
