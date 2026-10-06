import {
  parseGuardRefusal,
  parseIntentOutcome,
  parseMarketContext,
  parseOrderIntent,
} from "../../src/autonomous/decision-wire-parts.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** What the writer sends: the in-process object, through JSON — exactly what crosses the bridge. */
const overTheWire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

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

describe("option orders on the wire", () => {
  const PUT = "CRWV261106P00085000";
  const sold = anOptionIntent({
    option: {
      assignment: "intended",
      selection: { rule: "30-45 DTE, delta near 0.25", spot: 91.2, dte: 32, deltaSource: "feed" },
    },
  });
  const covered = anOptionIntent({
    option: {
      structure: "covered-call",
      legs: [{ occSymbol: "CRWV261106C00100000", side: "sell", ratio: 1 }],
      limitPrice: 1.5,
    },
  });
  const spread = anOptionIntent({
    symbol: "NVDA",
    side: "buy",
    option: {
      structure: "call-debit-spread",
      legs: [
        { occSymbol: "NVDA261113C00185000", side: "buy", ratio: 1 },
        { occSymbol: "NVDA261113C00200000", side: "sell", ratio: 1 },
      ],
      limitPrice: 3.4,
    },
  });
  const closing = anOptionIntent({
    side: "buy",
    clientOrderId: "sk1-sauron-CRWV-abc123-0",
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
      limitPrice: 0.4,
    },
  });

  it.each([
    ["a cash-secured put held to assignment", sold],
    ["a covered call", covered],
    ["a call debit spread", spread],
    ["a close carrying its client order id", closing],
  ])("round-trips %s", (_name, intent) => {
    expect(parseOrderIntent(overTheWire(intent))).toEqual(intent);
  });

  it("refuses a malformed option outright — it never comes back as a share order", () => {
    const wrongRoot = {
      ...sold,
      option: {
        ...sold.option,
        legs: [{ occSymbol: "CRWD261106P00085000", side: "sell", ratio: 1 }],
      },
    };
    for (const bad of [
      { ...sold, option: "a put" },
      { ...sold, option: { ...sold.option, legs: "one" } },
      { ...sold, option: { ...sold.option, effect: "roll" } },
      { ...sold, option: { ...sold.option, limitPrice: null } },
      wrongRoot,
    ]) {
      expect(parseOrderIntent(overTheWire(bad))).toBeUndefined();
    }
  });

  it("refuses a limit order with no option — bots send shares at market only", () => {
    expect(
      parseOrderIntent({ symbol: "NVDA", side: "buy", quantity: 1, type: "limit", reason: "x" }),
    ).toBeUndefined();
  });

  it("drops a non-finite optional number rather than rejecting the order", () => {
    const withNaN = anOptionIntent({
      option: {
        band: { low: Number.NaN, high: 2.2, at: "2026-10-05T14:30:00Z" },
        selection: { rule: "delta 0.25", spot: Number.NaN, dte: 32 },
      },
    });
    const parsed = parseOrderIntent(overTheWire(withNaN));
    expect(parsed?.option).not.toHaveProperty("band");
    expect(parsed?.option?.selection).toEqual({ rule: "delta 0.25", dte: 32 });
  });

  it("drops a client order id outside Alpaca's alphabet rather than rejecting the order", () => {
    for (const clientOrderId of ["has spaces", "x".repeat(129), 42]) {
      const parsed = parseOrderIntent(overTheWire({ ...closing, clientOrderId }));
      expect(parsed).toBeDefined();
      expect(parsed).not.toHaveProperty("clientOrderId");
    }
  });

  it("still parses a share-shaped order naming a contract — the guards refuse it, and say so", () => {
    const bare: OrderIntent = {
      symbol: PUT,
      side: "buy",
      quantity: 1,
      type: "market",
      reason: "x",
    };
    expect(parseOrderIntent(overTheWire(bare))).toEqual(bare);
  });

  it("parses the two new endings of a limit order, and the fills of each leg", () => {
    for (const status of ["unfilled", "working"]) {
      expect(
        parseIntentOutcome({ intent: closing, action: "placed", result: { status } })?.result
          ?.status,
      ).toBe(status);
    }
    const filled = parseIntentOutcome(
      overTheWire({
        intent: spread,
        action: "placed",
        result: {
          status: "filled",
          filledQuantity: 1,
          filledPrice: 3.35,
          legFills: [
            { occSymbol: "NVDA261113C00185000", filledQuantity: 1, filledPrice: 6.1 },
            { occSymbol: "NVDA261113C00200000", filledQuantity: 1, filledPrice: Number.NaN },
            { occSymbol: "", filledQuantity: 1 },
            "garbage",
          ],
        },
      }),
    );
    expect(filled?.result?.legFills).toEqual([
      { occSymbol: "NVDA261113C00185000", filledQuantity: 1, filledPrice: 6.1 },
      { occSymbol: "NVDA261113C00200000", filledQuantity: 1 },
    ]);
  });
});
