import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import { reasoningForOrder } from "../../src/observatory/wire-reasoning.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Say it once (#4650, plan #4642): the broker's words reach a reader only where the order never
 * traded — there they answer "why not", and on the pass log they take the generic label's place. A
 * fill's words or a working order's restate what the row already shows, and a rejection whose words
 * are only "order rejected" adds nothing — so neither the pass log nor a fill's why carries them.
 */

const sold: OrderIntent = { ...anOptionIntent({ quantity: 2 }), clientOrderId: "sk1-x-0" };

function readBoth(result: Omit<OrderResult, "intent">) {
  const record: DecisionRecord = {
    at: Date.parse("2026-10-07T14:30:00.000Z"),
    personaId: "sauron",
    mode: "live",
    rawIntents: [sold],
    guardedIntents: [sold],
    outcomes: [
      {
        intent: sold,
        action:
          result.status === "unfilled" || result.status === "rejected" ? "rejected" : "placed",
        result: { intent: sold, orderId: "opt-1", ...result },
      },
    ],
  };
  const outcome = decisionCyclesView([record]).cycles[0]?.outcomes[0];
  const why = reasoningForOrder("opt-1", { findByOrderId: () => ({ record, intent: sold }) });
  return { outcome, why };
}

describe("the broker's words, said once", () => {
  it("WHEN the order filled, neither the pass log nor the why adds the broker's words", () => {
    const { outcome, why } = readBoth({
      status: "filled",
      filledQuantity: 1,
      filledPrice: 2.12,
      reason: "partial fill; remainder canceled",
    });
    expect(outcome).not.toHaveProperty("brokerReason");
    expect(why).not.toHaveProperty("brokerReason");
  });

  it("WHEN the order is still working, neither adds them — its settlement will say how it ended", () => {
    for (const reason of ["order accepted", "cancel not confirmed — rechecked next cycle"]) {
      const { outcome, why } = readBoth({ status: "working", reason });
      expect(outcome).not.toHaveProperty("brokerReason");
      expect(outcome?.resultLabel).toBe("may still fill — cancel not confirmed");
      expect(why).not.toHaveProperty("brokerReason");
    }
  });

  it("WHEN the order never traded, both carry the broker's words", () => {
    for (const [status, reason] of [
      ["unfilled", "limit $2.10 not reached in 15s; canceled"],
      ["rejected", "insufficient buying power"],
      ["rejected", "order expired"],
    ] as const) {
      const { outcome, why } = readBoth({ status, reason });
      expect(outcome?.brokerReason).toBe(reason);
      expect(why?.brokerReason).toBe(reason);
    }
  });

  it("WHEN a rejection's words only restate it, neither carries them", () => {
    const { outcome, why } = readBoth({ status: "rejected", reason: "order rejected" });
    expect(outcome).not.toHaveProperty("brokerReason");
    expect(why).not.toHaveProperty("brokerReason");
  });

  it("WHEN the broker said nothing, the pass log keeps its generic label", () => {
    const { outcome, why } = readBoth({ status: "unfilled" });
    expect(outcome).not.toHaveProperty("brokerReason");
    expect(outcome?.resultLabel).toBe("limit not reached — canceled");
    expect(why).not.toHaveProperty("brokerReason");
  });
});
