import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { decisionContextFor } from "../../src/observatory/decision-context.js";

const intent = (symbol: string, side: "buy" | "sell", quantity: number, reason: string) => ({
  symbol,
  side,
  quantity,
  type: "market" as const,
  reason,
});

const cycle = (at: string, overrides: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: new Date(at).getTime(),
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent("NVDA", "buy", 12, "momentum breakout")],
  guardedIntents: [intent("NVDA", "buy", 5, "momentum breakout")],
  outcomes: [{ intent: intent("NVDA", "buy", 5, "momentum breakout"), action: "placed" }],
  ...overrides,
});

const order = { symbol: "NVDA", side: "buy", at: "2026-08-04T14:00:30.000Z" };

describe("decisionContextFor", () => {
  it("matches an order to the nearest cycle with the same symbol and side", () => {
    const far = cycle("2026-08-04T13:50:00.000Z");
    const near = cycle("2026-08-04T14:00:00.000Z", {
      outcomes: [{ intent: intent("NVDA", "buy", 5, "the near cycle"), action: "placed" }],
    });
    const context = decisionContextFor(order, [far, near]);
    expect(context).toMatchObject({ reason: "the near cycle", mode: "live", action: "placed" });
  });

  it("surfaces how the guards resized the persona's ask", () => {
    expect(decisionContextFor(order, [cycle("2026-08-04T14:00:00.000Z")])?.guardNote).toBe(
      "persona asked for 12, risk guards sized it to 5",
    );
  });

  it("refuses a match outside the time tolerance or on a different symbol/side", () => {
    expect(decisionContextFor(order, [cycle("2026-08-04T10:00:00.000Z")])).toBeUndefined();
    expect(
      decisionContextFor({ ...order, symbol: "AAPL" }, [cycle("2026-08-04T14:00:00.000Z")]),
    ).toBeUndefined();
    expect(
      decisionContextFor({ ...order, side: "sell" }, [cycle("2026-08-04T14:00:00.000Z")]),
    ).toBeUndefined();
  });

  it("carries the strategy tag and forward expectation when the intent has them", () => {
    const hardcore = cycle("2026-08-04T14:00:00.000Z", {
      outcomes: [
        {
          intent: {
            ...intent("NVDA", "buy", 5, "tranche into the discarded"),
            strategy: "hc-panic-claim",
            expectation: "expect a mean-reversion bounce; invalidated below the stop",
          },
          action: "placed",
        },
      ],
    });
    expect(decisionContextFor(order, [hardcore])).toMatchObject({
      strategy: "hc-panic-claim",
      expectation: "expect a mean-reversion bounce; invalidated below the stop",
    });
  });

  it("carries the playbook attribution when the intent has one", () => {
    const played = cycle("2026-08-04T14:00:00.000Z", {
      outcomes: [
        {
          intent: {
            ...intent("NVDA", "buy", 5, "S1 entry window"),
            playbookId: "S1-NVDA",
            playbookMode: "standard",
          },
          action: "placed",
        },
      ],
    });
    expect(decisionContextFor(order, [played])).toMatchObject({
      playbookId: "S1-NVDA",
      playbookMode: "standard",
    });
  });
});
