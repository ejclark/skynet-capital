import {
  parseGuardRefusal,
  parseIntentOutcome,
  parseMarketContext,
  parseOrderIntent,
} from "../../src/autonomous/decision-wire-parts.js";

describe("parseOrderIntent", () => {
  it("parses a minimal well-formed intent", () => {
    const parsed = parseOrderIntent({
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "panic fade",
    });
    expect(parsed).toEqual({
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "panic fade",
    });
  });

  it("carries the structured strategy/expectation/forecast fields when present", () => {
    const parsed = parseOrderIntent({
      symbol: "NVDA",
      side: "sell",
      quantity: 5,
      reason: "euphoria fade",
      strategy: "sauron-euphoria-fade",
      expectation: "expect a pullback",
      forecast: { direction: "down", invalidator: "sentiment recovers" },
      playbookId: "S1-NVDA",
      playbookMode: "standard",
    });
    expect(parsed).toMatchObject({
      strategy: "sauron-euphoria-fade",
      expectation: "expect a pullback",
      forecast: { direction: "down", invalidator: "sentiment recovers" },
      playbookId: "S1-NVDA",
      playbookMode: "standard",
    });
  });

  it.each([
    { symbol: "NVDA", side: "up", quantity: 1, reason: "x" }, // bad side
    { symbol: "NVDA", side: "buy", quantity: "10", reason: "x" }, // quantity not a number
    { symbol: "", side: "buy", quantity: 1, reason: "x" }, // empty symbol
    { symbol: "NVDA", side: "buy", quantity: 1, reason: "" }, // empty reason
    "not an object",
    null,
    42,
  ])("rejects a malformed intent %#", (value) => {
    expect(parseOrderIntent(value)).toBeUndefined();
  });
});

describe("parseIntentOutcome", () => {
  const intent = { symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "x" };

  it("parses an observed outcome with no result", () => {
    expect(parseIntentOutcome({ intent, action: "observed" })).toEqual({
      intent,
      action: "observed",
    });
  });

  it("parses a placed outcome carrying a filled result", () => {
    const parsed = parseIntentOutcome({
      intent,
      action: "placed",
      result: { status: "filled", orderId: "ord-1", filledQuantity: 10, filledPrice: 400.5 },
    });
    expect(parsed?.result).toMatchObject({
      status: "filled",
      orderId: "ord-1",
      filledQuantity: 10,
      filledPrice: 400.5,
    });
  });

  it("rejects an unknown action", () => {
    expect(parseIntentOutcome({ intent, action: "flerbed" })).toBeUndefined();
  });

  it("rejects an outcome whose intent doesn't parse", () => {
    expect(parseIntentOutcome({ intent: { symbol: "NVDA" }, action: "observed" })).toBeUndefined();
  });
});

describe("parseGuardRefusal", () => {
  const intent = { symbol: "NVDA", side: "buy", quantity: 60, type: "market", reason: "panic" };

  it("parses a refusal against the real reason set", () => {
    expect(parseGuardRefusal({ intent, reason: "s2-print" })).toEqual({
      intent,
      reason: "s2-print",
    });
  });

  it("rejects a reason string outside the known set — never trusts a foreign literal", () => {
    expect(parseGuardRefusal({ intent, reason: "made-up-reason" })).toBeUndefined();
  });
});

describe("parseMarketContext", () => {
  it("parses quotes plus the optional per-symbol momentum/sentiment maps", () => {
    const parsed = parseMarketContext({
      asOf: "2026-09-09T10:00:00Z",
      quotes: { NVDA: { symbol: "NVDA", bid: 100, ask: 100.1, last: 100.05, asOf: "t" } },
      momentum: { NVDA: 0.02 },
      newsSentiment: { NVDA: -0.5 },
    });
    expect(parsed).toEqual({
      asOf: "2026-09-09T10:00:00Z",
      quotes: { NVDA: { symbol: "NVDA", bid: 100, ask: 100.1, last: 100.05, asOf: "t" } },
      momentum: { NVDA: 0.02 },
      newsSentiment: { NVDA: -0.5 },
    });
  });

  it("drops a malformed quote rather than failing the whole context", () => {
    const parsed = parseMarketContext({
      asOf: "t",
      quotes: { NVDA: { symbol: "NVDA", bid: 100, ask: 100.1, last: 100.05, asOf: "t" }, MSFT: {} },
    });
    expect(Object.keys(parsed?.quotes ?? {})).toEqual(["NVDA"]);
  });

  it("rejects a context missing quotes entirely", () => {
    expect(parseMarketContext({ asOf: "t" })).toBeUndefined();
  });
});
