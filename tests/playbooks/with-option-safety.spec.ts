import { NO_OPTION_DEMAND, type OrderIntent } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { withOptionSafety } from "../../src/playbooks/with-option-safety.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

// Expiry hygiene wrapped around a persona: the safety closes first, then everything the persona
// decided — and nothing at all when no contract is held.
const CALL = "CRWV261106C00095000";
const T2 = "2026-11-04T16:00:00Z";
const shareBuy: OrderIntent = {
  symbol: "MSFT",
  side: "buy",
  quantity: 5,
  type: "market",
  reason: "r",
};

const inner: Persona = {
  id: "sauron",
  name: "Sauron",
  thesis: "test",
  decide: () => [shareBuy],
  playbookVerdicts: () => [{ playbookId: "S1-NVDA", mode: "standard", state: "no-window" }],
  optionUnderlyings: ["NVDA"],
  optionDemand: () => ({
    chains: [{ underlying: "NVDA", expiration: "2026-11-13", type: "call" }],
    contracts: [],
  }),
};
const context = withOptionQuotes(aContext({ CRWV: { last: 92 } }, T2), [
  anOptionQuote(CALL, { bid: 1, ask: 1.2, at: T2 }),
]);
const holdsCall = aPortfolio({ positions: [{ symbol: CALL, quantity: 1, avgPrice: 1.4 }] });

describe("withOptionSafety", () => {
  it("with no contracts held, decides exactly what the inner persona decides", () => {
    const safe = withOptionSafety(inner, [], []);
    expect(safe.decide(context, aPortfolio())).toEqual([shareBuy]);
    expect(safe.optionDemand?.(T2, aPortfolio(), {})).toEqual(
      inner.optionDemand?.(T2, aPortfolio(), {}),
    );
  });

  it("puts a due safety close ahead of the persona's own intents", () => {
    const intents = withOptionSafety(inner, [], []).decide(context, holdsCall);
    expect(intents.map((i) => i.strategy ?? i.symbol)).toEqual(["expiry-hygiene", "MSFT"]);
  });

  it("never closes twice a contract the inner playbooks already close", () => {
    const ownClose: OrderIntent = {
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      type: "limit",
      reason: "the play's own exit",
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: CALL, side: "sell", ratio: 1 }],
        limitPrice: 1.1,
      },
    };
    const closing: Persona = { ...inner, decide: () => [ownClose] };
    expect(withOptionSafety(closing, [], []).decide(context, holdsCall)).toEqual([ownClose]);
  });

  it("adds the quotes due closes need to the inner demand, and passes verdicts and underlyings through", () => {
    const safe = withOptionSafety(inner, [], []);
    expect(safe.optionDemand?.(T2, holdsCall, {})).toEqual({
      chains: [{ underlying: "NVDA", expiration: "2026-11-13", type: "call" }],
      contracts: [CALL],
    });
    expect(safe.playbookVerdicts?.(context)).toEqual(inner.playbookVerdicts?.(context));
    expect(safe.optionUnderlyings).toEqual(["NVDA"]);
    const bare = withOptionSafety({ ...inner, optionDemand: undefined }, [], []);
    expect(bare.optionDemand?.(T2, aPortfolio(), {})).toEqual(NO_OPTION_DEMAND);
  });
});
