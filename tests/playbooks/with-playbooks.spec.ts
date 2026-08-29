import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, aPortfolio } from "../support/builders.js";

const calendar: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "test" },
];

/** Base persona with reflexes on BOTH a playbook-managed and an unmanaged symbol. */
const base: Persona = {
  id: "base",
  name: "Base",
  thesis: "test",
  decide: (): OrderIntent[] => [
    { symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "reflex" },
    { symbol: "AAPL", side: "buy", quantity: 5, type: "market", reason: "reflex" },
  ],
};

const nvdaPlay: Playbook = {
  id: "TEST-NVDA",
  symbol: "NVDA",
  thesis: "test",
  evidence: "test",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "long",
};

const ctx: MarketContext = aContext(
  { NVDA: { last: 100 }, AAPL: { last: 100 } },
  "2026-08-16T15:00:00Z",
);
const flat: Portfolio = aPortfolio({ cash: 10_000 });

describe("withPlaybooks", () => {
  it("returns the base persona untouched when the roster is empty — the dark default", () => {
    expect(withPlaybooks(base, [], calendar)).toBe(base);
  });

  it("merges playbook intents with base reflexes, suppressing reflexes on managed symbols", () => {
    const composed = withPlaybooks(base, [{ playbook: nvdaPlay, mode: "standard" }], calendar);

    const intents = composed.decide(ctx, flat);

    // One NVDA intent — the playbook's, not the reflex (one position, one decision-maker).
    const nvda = intents.filter((i) => i.symbol === "NVDA");
    expect(nvda).toHaveLength(1);
    expect(nvda[0]?.playbookId).toBe("TEST-NVDA");
    // The unmanaged AAPL reflex passes through untouched.
    expect(intents.filter((i) => i.symbol === "AAPL")).toHaveLength(1);
  });

  it("keeps the base persona's identity — readiness and display see the same bot", () => {
    const composed = withPlaybooks(base, [{ playbook: nvdaPlay, mode: "standard" }], calendar);
    expect(composed.id).toBe("base");
    expect(composed.name).toBe("Base");
  });

  it("threads an events feed through to an event-driven play in the roster", () => {
    let seenEvents: unknown;
    const eventPlay: Playbook = {
      id: "TEST-EVT",
      symbol: "MSFT",
      thesis: "test",
      evidence: "test",
      size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
      desiredState: (_asOf, _cal, events) => {
        seenEvents = events;
        return "no-window";
      },
    };
    const events = [{ symbol: "MSFT", detectedAt: "2026-08-16T14:50:00Z" }];
    const composed = withPlaybooks(
      base,
      [{ playbook: eventPlay, mode: "standard" }],
      calendar,
      events,
    );

    composed.decide(ctx, flat);
    expect(seenEvents).toBe(events);
  });
});
