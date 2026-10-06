import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import { reasoningForOrder } from "../../src/observatory/wire-reasoning.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * #4642 criterion 8 — WHEN a bot's option order fills, its owner sees the contract in words, the
 * dollar cost, the playbook and what would prove it wrong, on Heartbeat (the decision cycle view)
 * and on Activity (the fill row's attached decision).
 */

const INVALIDATOR =
  "CRWV settles below $85 on 2026-11-06 — the wheel buys 100 shares at $85; the play retires if its net P/L is below 0 on 2027-01-29";

const sold: OrderIntent = {
  ...anOptionIntent(),
  expectation: "CRWV holds above $85 through expiry and the put expires worthless",
  forecast: { direction: "up", invalidator: INVALIDATOR },
};

const record = (intent: OrderIntent = sold): DecisionRecord => ({
  at: Date.parse("2026-10-07T14:30:00Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [
    {
      intent,
      action: "placed",
      result: {
        intent,
        status: "filled",
        orderId: "opt-1",
        filledQuantity: 1,
        filledPrice: 2.05,
        legFills: [{ occSymbol: "CRWV261106P00085000", filledQuantity: 1, filledPrice: 2.05 }],
      },
    },
  ],
});

describe("a bot's filled option order, in words and dollars", () => {
  it("Heartbeat: the outcome names the contract, the playbook, the dollars and the invalidator", () => {
    const [cycle] = decisionCyclesView([record()]).cycles;
    expect(cycle?.outcomes[0]).toMatchObject({
      contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      playbook: "CRWV-WHEEL",
      fill: "$205.00 received — 1 contract × 100 shares × $2.05",
      forecast: { invalidator: INVALIDATOR },
    });
  });

  it("Activity: the fill's decision carries the order, its cost and what would prove it wrong", () => {
    const entry = record();
    const reasoning = reasoningForOrder("opt-1", {
      findByOrderId: () => ({ record: entry, intent: entry.outcomes[0]?.intent as OrderIntent }),
    });
    expect(reasoning).toMatchObject({
      playbookId: "CRWV-WHEEL",
      contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      cost: "$205.00 received — 1 contract × 100 shares × $2.05",
      invalidator: INVALIDATOR,
    });
  });

  it("Activity: an option that never confirmed a fill carries its order but no cost", () => {
    const entry: DecisionRecord = {
      ...record(),
      outcomes: [{ intent: sold, action: "placed", result: { intent: sold, status: "working" } }],
    };
    const reasoning = reasoningForOrder("opt-1", {
      findByOrderId: () => ({ record: entry, intent: sold }),
    });
    expect(reasoning).toHaveProperty("contract");
    expect(reasoning).not.toHaveProperty("cost");
  });

  it("Activity: a share fill carries none of the option rows", () => {
    const shares: OrderIntent = {
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "momentum",
    };
    const entry = record(shares);
    const reasoning = reasoningForOrder("opt-1", {
      findByOrderId: () => ({ record: entry, intent: shares }),
    });
    expect(reasoning).not.toHaveProperty("contract");
    expect(reasoning).not.toHaveProperty("cost");
    expect(reasoning).not.toHaveProperty("invalidator");
  });
});
