import {
  lifecycleLedgerRecord,
  lifecycleOrderId,
} from "../../src/observatory/option-lifecycle-activity.js";
import type { NormalizedLifecycleActivity } from "../../src/trading/option-lifecycle.js";

const base: NormalizedLifecycleActivity = {
  id: "act-1",
  type: "OPEXP",
  symbol: "MSFT260918P00420000",
  quantity: 2,
  at: "2026-09-19T00:00:00.000Z",
};

describe("lifecycleLedgerRecord (#468 criterion 6)", () => {
  it("namespaces the activity id into a ledger-unique orderId", () => {
    expect(lifecycleOrderId("act-1")).toBe("lifecycle:act-1");
    expect(lifecycleLedgerRecord(base, "ann").orderId).toBe("lifecycle:act-1");
  });

  it("closes OPEXP/OPASN at an honest, definite $0 — no cash changed hands", () => {
    expect(lifecycleLedgerRecord(base, "ann")).toMatchObject({
      side: "sell",
      price: 0,
      status: "expired worthless",
      source: "lifecycle",
      filledQuantity: 2,
      quantity: 2,
    });
    expect(lifecycleLedgerRecord({ ...base, type: "OPASN" }, "ann")).toMatchObject({
      price: 0,
      status: "assigned",
    });
  });

  it("never fabricates a price for OPEXC/OPTRD — omits it when the activity didn't carry one", () => {
    const exercised = lifecycleLedgerRecord({ ...base, type: "OPEXC" }, "ann");
    expect(exercised.status).toBe("exercised");
    expect(exercised.price).toBeUndefined();
  });

  it("carries a real OPTRD price through when the activity reported one", () => {
    const settled = lifecycleLedgerRecord(
      { ...base, type: "OPTRD", symbol: "AAPL", price: 150, side: "buy" },
      "ann",
    );
    expect(settled).toMatchObject({ status: "option settlement", price: 150, side: "buy" });
  });
});
