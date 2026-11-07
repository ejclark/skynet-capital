import { bookNeeds } from "../../src/domain/option-book.js";
import { computeEquity } from "../../src/domain/portfolio.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import { openLedger } from "../../src/engine/guard-batch.js";
import { applyGuardsWithVerdicts, type RiskConfig } from "../../src/engine/guards.js";
import { clampOption, type OptionGuardConfig } from "../../src/engine/option-guards.js";
import { REFUSAL_LABEL } from "../../src/observatory/decision-json-view.js";
import {
  BELOW_BAR_FLOOR_PCT,
  BELOW_BAR_LABEL,
  belowBar,
  labelBelowBar,
  openCeilingFor,
  withBelowBarLabel,
} from "../../src/playbooks/fit-floor.js";
import { pairTable } from "../../src/playbooks/pair-table.js";
import { registeredPlaybooks } from "../../src/playbooks/registry.js";
import { tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import {
  aContext,
  anOptionIntent,
  anOptionQuote,
  aPortfolio,
  aPosition,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

/**
 * THE BELOW-BAR FLOOR (#6954 slice 5, `src/playbooks/fit-floor.ts`). The EARS:
 *  - WHERE a pair sits below its playbook's evidence bar, the system SHALL size its opens no larger
 *    than the floor and label each decision "below its bar".
 * Safeguard: the floor is one constant with a spec — it is smaller than what a below-bar share play
 * places today, and it never sizes an exit.
 */

describe("which pairs sit below their bar", () => {
  it("is the △ tier of the pair table — the run-up, the spread that borrows it, and NBIS", () => {
    const below = pairTable()
      .filter((pair) => belowBar(pair.id))
      .map((pair) => pair.id)
      .sort();
    expect(below).toEqual(["NBIS-DIP-BOUNCE", "NVDA-CALL-SPREAD", "S1-NVDA"]);
  });

  it("says no for a clean pair, and for an id the table does not know", () => {
    expect(belowBar("MU-DIP-BOUNCE")).toBe(false);
    expect(belowBar("G1-GOOG")).toBe(false);
    expect(belowBar("NOBODY")).toBe(false);
  });

  it("hands the guards the floor for a below-bar pair, and no ceiling for any other", () => {
    const ceiling = openCeilingFor();
    expect(ceiling("S1-NVDA")).toBe(BELOW_BAR_FLOOR_PCT);
    expect(ceiling("NVDA-CALL-SPREAD")).toBe(BELOW_BAR_FLOOR_PCT);
    expect(ceiling("G1-GOOG")).toBeUndefined();
  });
});

describe("the floor is one constant, smaller than today's size", () => {
  it("is never larger than a below-bar share play's smallest size, and under its standard one", () => {
    const sized = registeredPlaybooks().filter((p) => belowBar(p.id) && p.size.standard > 0);
    expect(sized.map((p) => p.id)).toEqual(["S1-NVDA"]);
    for (const playbook of sized) {
      expect(BELOW_BAR_FLOOR_PCT).toBeLessThanOrEqual(playbook.size.conservative);
      expect(BELOW_BAR_FLOOR_PCT).toBeLessThan(playbook.size.standard);
    }
  });
});

describe("the guards size a below-bar share open to the floor", () => {
  const context = aContext({ NVDA: { last: 100 } }, "2026-10-07T15:00:00Z");
  const config: RiskConfig = { maxPositionPct: 0.5, openCeiling: openCeilingFor() };
  const order = (side: "buy" | "sell", playbookId: string, quantity = 30): OrderIntent => ({
    symbol: "NVDA",
    side,
    quantity,
    type: "market",
    reason: "test",
    playbookId,
    playbookMode: "standard",
  });
  const ask = context.quotes.NVDA?.ask ?? 0;

  it("cuts a below-bar buy to the whole shares 1% of the account buys", () => {
    const portfolio = aPortfolio({ cash: 100_000 });
    const floorShares = Math.floor((BELOW_BAR_FLOOR_PCT * 100_000) / ask);
    const { approved } = applyGuardsWithVerdicts(
      [order("buy", "S1-NVDA")],
      portfolio,
      context,
      config,
    );
    expect(floorShares).toBeGreaterThan(0);
    expect(floorShares).toBeLessThan(30);
    expect(approved.map((i) => i.quantity)).toEqual([floorShares]);
  });

  it("leaves a clean pair's buy at what the other bounds allow", () => {
    const portfolio = aPortfolio({ cash: 100_000 });
    const { approved } = applyGuardsWithVerdicts(
      [{ ...order("buy", "G1-GOOG"), symbol: "NVDA" }],
      portfolio,
      context,
      config,
    );
    expect(approved.map((i) => i.quantity)).toEqual([30]);
  });

  it("counts the order, not the holding: a below-bar pair already holding may still add a floor-sized lot", () => {
    const portfolio = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "NVDA", quantity: 20, avgPrice: 100 })],
    });
    const equity = computeEquity(portfolio, context.quotes);
    const { approved } = applyGuardsWithVerdicts(
      [order("buy", "S1-NVDA")],
      portfolio,
      context,
      config,
    );
    expect(approved.map((i) => i.quantity)).toEqual([
      Math.floor((BELOW_BAR_FLOOR_PCT * equity) / ask),
    ]);
  });

  it("refuses `below-bar-floor` when one share costs more than the floor lets it risk", () => {
    const portfolio = aPortfolio({ cash: 5_000 }); // 1% is $50; a share is about $100
    const { approved, refused } = applyGuardsWithVerdicts(
      [order("buy", "S1-NVDA")],
      portfolio,
      context,
      config,
    );
    expect(approved).toEqual([]);
    expect(refused.map((r) => r.reason)).toEqual(["below-bar-floor"]);
    expect(REFUSAL_LABEL["below-bar-floor"]).toContain(BELOW_BAR_LABEL);
  });

  it("fails closed on a ceiling that is not a share of the account: refused under the floor's name", () => {
    const portfolio = aPortfolio({ cash: 100_000 });
    for (const bad of [Number.NaN, -0.01, 2]) {
      const { refused } = applyGuardsWithVerdicts([order("buy", "S1-NVDA")], portfolio, context, {
        maxPositionPct: 0.5,
        openCeiling: () => bad,
      });
      expect(refused.map((r) => r.reason)).toEqual(["below-bar-floor"]);
    }
  });

  it("never sizes an exit: a below-bar pair sells all it holds", () => {
    const portfolio = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 })],
    });
    const { approved } = applyGuardsWithVerdicts(
      [order("sell", "S1-NVDA", 40)],
      portfolio,
      context,
      config,
    );
    expect(approved.map((i) => i.quantity)).toEqual([40]);
  });

  it("changes nothing when no ceiling is configured — evals and the readiness gate", () => {
    const portfolio = aPortfolio({ cash: 100_000 });
    const { approved } = applyGuardsWithVerdicts([order("buy", "S1-NVDA")], portfolio, context, {
      maxPositionPct: 0.5,
    });
    expect(approved.map((i) => i.quantity)).toEqual([30]);
  });
});

describe("the guards hold a below-bar option open to the floor", () => {
  // CRWV fixtures as `option-guards-clamp.spec.ts` uses them, with the wheel's pair stubbed below
  // its bar: the mechanism is what is under test here, the table's mapping above.
  const AS_OF = "2026-10-07T15:00:00Z";
  const PUT = "CRWV261106P00085000";
  const CALL_95 = "CRWV261106C00095000";
  const CALL_100 = "CRWV261106C00100000";
  const QUOTES: readonly OptionContractQuote[] = [
    anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }),
    anOptionQuote(CALL_95, { bid: 3.5, ask: 3.7, at: AS_OF }),
    anOptionQuote(CALL_100, { bid: 1.6, ask: 1.8, at: AS_OF }),
  ];
  const market: MarketContext = withOptionQuotes(aContext({ CRWV: { last: 90 } }, AS_OF), QUOTES);
  const subscription: PlaybookSubscription = {
    accountId: "sauron",
    playbookId: "CRWV-WHEEL",
    mode: "standard",
    capitalAllocated: 100_000,
    enabled: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const config: OptionGuardConfig = {
    optionsLevel: 3,
    discipline: {
      calendar: [
        {
          symbol: "CRWV",
          date: "2026-11-10",
          status: "estimate",
          source: "test",
          window: { start: "2026-11-09", end: "2026-11-16" },
        },
      ],
    },
    subscriptions: [subscription],
    playbookSymbols: new Map([["CRWV-WHEEL", ["CRWV"]]]),
    openCeiling: (id) => (id === "CRWV-WHEEL" ? BELOW_BAR_FLOOR_PCT : undefined),
  };
  const clamp = (intent: OrderIntent, portfolio: Portfolio): string | number => {
    if (!intent.option) throw new Error("not an option intent");
    const book = bookNeeds(portfolio);
    const outcome = clampOption(intent, intent.option, portfolio, market, config, {
      ledger: openLedger([intent], book, portfolio),
      book,
    });
    return outcome.ok ? outcome.intent.quantity : outcome.reason;
  };
  const rich = aPortfolio({ cash: 100_000 }); // the floor is $1,000

  it("cuts a bought call to the contracts the floor pays for ($360 each)", () => {
    const longCall = anOptionIntent({
      side: "buy",
      quantity: 5,
      option: {
        structure: "long-call",
        legs: [{ occSymbol: CALL_95, side: "buy", ratio: 1 }],
        limitPrice: 3.6,
      },
    });
    expect(clamp(longCall, rich)).toBe(2);
  });

  it("passes a spread whose one debit fits under the floor", () => {
    const spread = anOptionIntent({
      side: "buy",
      option: {
        structure: "call-debit-spread",
        legs: [
          { occSymbol: CALL_95, side: "buy", ratio: 1 },
          { occSymbol: CALL_100, side: "sell", ratio: 1 },
        ],
        limitPrice: 2,
      },
    });
    expect(clamp(spread, rich)).toBe(1);
  });

  it("refuses `below-bar-floor` for a put whose collateral alone is over the floor", () => {
    expect(clamp({ ...anOptionIntent(), quantity: 3 }, rich)).toBe("below-bar-floor");
  });

  it("names the floor, not the cash, when a put is over both — more cash would not fix it", () => {
    expect(clamp(anOptionIntent(), aPortfolio({ cash: 5_000 }))).toBe("below-bar-floor");
  });

  it("never sizes a covered call: it risks no cash of its own", () => {
    const shares = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "CRWV", quantity: 100 })],
    });
    const coveredCall = anOptionIntent({
      option: {
        structure: "covered-call",
        legs: [{ occSymbol: CALL_100, side: "sell", ratio: 1 }],
        limitPrice: 1.7,
      },
    });
    expect(clamp(coveredCall, shares)).toBe(1);
  });
});

describe("each below-bar opening decision says so", () => {
  const open: OrderIntent = {
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    type: "market",
    reason: "S1-NVDA window open (standard): the run-up",
    playbookId: "S1-NVDA",
    playbookMode: "standard",
  };

  it("labels an open from a below-bar pair, with the floor in words", () => {
    expect(labelBelowBar(open).reason).toBe(
      "S1-NVDA window open (standard): the run-up · below its bar: sized to at most 1% of the account",
    );
  });

  it("labels once, however many times it passes", () => {
    expect(labelBelowBar(labelBelowBar(open))).toEqual(labelBelowBar(open));
  });

  it("leaves an exit, a clean pair and an unattributed order as they came", () => {
    const exit = { ...open, side: "sell" as const };
    const clean = { ...open, playbookId: "G1-GOOG" };
    const { playbookId: _dropped, ...bare } = open;
    expect(labelBelowBar(exit)).toBe(exit);
    expect(labelBelowBar(clean)).toBe(clean);
    expect(labelBelowBar(bare)).toBe(bare);
  });

  it("leaves a covered call alone: it risks no cash, so the floor never sizes it", () => {
    const coveredCall = anOptionIntent({
      playbookId: "NVDA-CALL-SPREAD",
      option: { structure: "covered-call" },
    });
    expect(labelBelowBar(coveredCall)).toBe(coveredCall);
  });

  it("labels what a wrapped persona decides, and keeps the rest of the persona", () => {
    const inner = {
      id: "sauron",
      name: "Sauron",
      thesis: "n/a",
      decide: () => [open],
      playbookVerdicts: () => [],
    };
    const wrapped = withBelowBarLabel(inner);
    expect(wrapped.decide(aContext({}), aPortfolio()).map((i) => i.reason)).toEqual([
      labelBelowBar(open).reason,
    ]);
    expect(wrapped.playbookVerdicts).toBe(inner.playbookVerdicts);
  });
});

const BELOW_BAR_OPEN: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "a below-bar open",
  playbookId: "S1-NVDA",
  playbookMode: "standard",
};

describe("the live roster turns the label and the floor on together", () => {
  const roster = tradingRoster(
    {
      bot: {
        persona: {
          id: "sauron",
          name: "Sauron",
          thesis: "n/a",
          decide: () => [{ ...BELOW_BAR_OPEN }],
        },
        credentials: { apiKey: "k", apiSecret: "s" },
      },
      subscriptions: [aSubscription("sauron", "S1-NVDA")],
      enabled: [],
    },
    { maxPositionPct: 0.03 },
  );

  it("hands the guards the floor for a below-bar pair", () => {
    expect(roster.risk.openCeiling?.("S1-NVDA")).toBe(BELOW_BAR_FLOOR_PCT);
    expect(roster.risk.openCeiling?.("G1-GOOG")).toBeUndefined();
  });

  it("labels the open the composed persona decides", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-10-07T15:00:00Z");
    const reasons = roster.persona.decide(context, aPortfolio()).map((i) => i.reason);
    expect(reasons).toEqual([labelBelowBar(BELOW_BAR_OPEN).reason]);
  });
});
