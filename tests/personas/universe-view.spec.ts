import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { MarketContext, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { SauronHardcorePersona } from "../../src/personas/sauron-hardcore.js";
import { withQuoteUniverse } from "../../src/personas/universe-view.js";
import { G1_GOOG } from "../../src/playbooks/registry.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * #4777: the bots' stream now carries a playbook's own ticker (GOOG for G1-GOOG), and six base
 * personas trade ANY quote they are handed. These specs hold the line: a base persona decides
 * exactly what it decided without the extra quote, on every bot — while the playbook that asked for
 * the ticker still prices and buys it.
 */

const PERSONAS: readonly Persona[] = [...createDefaultPersonas(), new SauronHardcorePersona()];

/** The same signal on GOOG and NVDA, so a persona that reacts to one would react to the other. */
const SIGNALS: readonly { momentum: number; sentiment: number }[] = [
  { momentum: 0.08, sentiment: 0.9 },
  { momentum: 0.08, sentiment: -0.9 },
  { momentum: -0.08, sentiment: 0.9 },
  { momentum: -0.08, sentiment: -0.9 },
  { momentum: 0.03, sentiment: 0 },
  { momentum: -0.03, sentiment: 0 },
];

const PORTFOLIOS: readonly Portfolio[] = [
  aPortfolio({ cash: 1_000_000 }),
  aPortfolio({
    cash: 1_000_000,
    positions: [
      { symbol: "GOOG", quantity: 50, avgPrice: 90 },
      { symbol: "NVDA", quantity: 50, avgPrice: 90 },
    ],
  }),
];

function contexts(withGoog: boolean): MarketContext[] {
  return SIGNALS.map((signal) =>
    aContext({
      NVDA: { last: 100, ...signal },
      AAPL: { last: 100, momentum: 0.01, sentiment: 0.1 },
      ...(withGoog ? { GOOG: { last: 100, ...signal } } : {}),
    }),
  );
}

/** What a bot with NO playbook trades under — the composition the live trader runs. */
function asWired(persona: Persona): Persona {
  return tradingRoster(
    {
      bot: { persona, credentials: { apiKey: "k", apiSecret: "s" } },
      subscriptions: [],
      enabled: [],
    },
    { maxPositionPct: 0.03 },
  ).persona;
}

describe("a base persona sees only the ten names (#4777)", () => {
  it("is not vacuous: bare, the personas named in the issue DO trade a GOOG quote they are handed", () => {
    const tradesGoog = new Set(
      PERSONAS.filter((persona) =>
        PORTFOLIOS.some((portfolio) =>
          contexts(true).some((context) =>
            persona.decide(context, portfolio).some((i) => i.symbol === "GOOG"),
          ),
        ),
      ).map((p) => p.constructor.name),
    );
    for (const name of [
      "SauronPersona",
      "SauronHardcorePersona",
      "NewsFaderPersona",
      "RetailInvestorPersona",
      "FuturistPersona",
      "RumorTraderPersona",
    ]) {
      expect(tradesGoog.has(name)).toBe(true);
    }
  });

  for (const persona of PERSONAS) {
    it(`${persona.constructor.name} decides exactly the same with or without a GOOG quote, on a bot with no playbook`, () => {
      const wired = asWired(persona);
      const without = contexts(false);
      contexts(true).forEach((context, i) => {
        for (const portfolio of PORTFOLIOS) {
          expect(wired.decide(context, portfolio)).toEqual(
            persona.decide(without[i] as MarketContext, portfolio),
          );
        }
      });
    });
  }

  it("narrows quotes, momentum and sentiment alike, and keeps the persona's identity", () => {
    const seen: MarketContext[] = [];
    const spy: Persona = {
      id: "spy",
      name: "Spy",
      thesis: "t",
      decide: (context) => {
        seen.push(context);
        return [];
      },
    };
    const view = withQuoteUniverse(spy, BOTS_UNIVERSE);
    view.decide(
      aContext({
        NVDA: { momentum: 0.1, sentiment: 0.2 },
        GOOG: { momentum: 0.1, sentiment: 0.2 },
      }),
      aPortfolio(),
    );
    expect(Object.keys(seen[0]?.quotes ?? {})).toEqual(["NVDA"]);
    expect(Object.keys(seen[0]?.momentum ?? {})).toEqual(["NVDA"]);
    expect(Object.keys(seen[0]?.newsSentiment ?? {})).toEqual(["NVDA"]);
    expect([view.id, view.name, view.thesis]).toEqual(["spy", "Spy", "t"]);
  });
});

describe("the playbook that asked for the ticker still sees it (#4777)", () => {
  const CALENDAR: readonly EarningsPrint[] = [
    { symbol: "GOOG", date: "2026-08-03", status: "confirmed", source: "test fixture" },
  ];

  it("WHILE G1-GOOG is enabled and its window is open on a confirmed date, the bot prices and buys GOOG", () => {
    const persona = withPlaybooks(
      withQuoteUniverse(new SauronHardcorePersona(), BOTS_UNIVERSE),
      [{ playbook: G1_GOOG, mode: "standard" }],
      CALENDAR,
    );
    const intents = persona.decide(
      aContext({ GOOG: { last: 100 }, NVDA: { last: 100 } }),
      aPortfolio(),
    );
    expect(intents.filter((i) => i.symbol === "GOOG")).toEqual([
      expect.objectContaining({ side: "buy", playbookId: "G1-GOOG" }),
    ]);
  });
});
