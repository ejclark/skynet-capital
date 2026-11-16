import { describeOrder, gradeChange, label, misses } from "../../scripts/faculty/oracle.mjs";

// The change oracle grades what a simulated member DID to the account — the diff between the
// orders and positions before their first tap and after their last — never what they said.

const NOW = new Date("2026-11-16T23:00:00.000Z");
const working = {
  id: "faculty-msft-limit",
  symbol: "MSFT",
  side: "buy",
  quantity: 10,
  orderType: "limit",
  limitPrice: 400,
  timeInForce: "gtc",
  state: "working",
};
const before = { orders: [working], positions: { EEM: 950, AAPL: 100 } };
const order = (o: Record<string, unknown>) => ({
  id: "paper-1",
  side: "buy",
  quantity: 1,
  orderType: "market",
  timeInForce: "day",
  state: "working",
  ...o,
});

describe("gradeChange — what landed, against what was asked", () => {
  it("passes the one new order that matches, and names nothing unintended", () => {
    const after = { ...before, orders: [working, order({ symbol: "SPY", quantity: 3 })] };
    const end = {
      orders: [
        {
          symbol: "SPY",
          side: "buy",
          quantity: 3,
          orderType: "market",
          state: ["working", "filled"],
        },
      ],
    };
    expect(gradeChange(before, after, end, NOW)).toMatchObject({ success: true, unintended: [] });
  });

  it("fails a wrong side and says which field missed", () => {
    const after = {
      ...before,
      orders: [working, order({ symbol: "SPY", side: "sell", quantity: 3 })],
    };
    const v = gradeChange(
      before,
      after,
      { orders: [{ symbol: "SPY", side: "buy", quantity: 3 }] },
      NOW,
    );
    expect(v.success).toBe(false);
    expect(v.reason).toContain("side");
  });

  it("flags a fat-fingered extra order as unintended even when the asked one landed", () => {
    const after = {
      ...before,
      orders: [
        working,
        order({ symbol: "SPY", quantity: 3 }),
        order({ id: "paper-2", symbol: "SPY", quantity: 30 }),
      ],
    };
    const v = gradeChange(before, after, { orders: [{ symbol: "SPY", quantity: 3 }] }, NOW);
    expect(v.success).toBe(false);
    expect(v.unintended).toEqual(["unasked order: buy 30 SPY market day [working]"]);
  });

  it("grades a cancel and a change in place by the working order's id", () => {
    const cancelled = { ...before, orders: [{ ...working, state: "cancelled" }] };
    expect(gradeChange(before, cancelled, { cancelled: ["faculty-msft-limit"] }, NOW).success).toBe(
      true,
    );

    const replaced = {
      ...before,
      orders: [
        { ...working, state: "replaced", replacedBy: "paper-1" },
        order({
          symbol: "MSFT",
          quantity: 10,
          orderType: "limit",
          limitPrice: 405,
          timeInForce: "gtc",
          replaces: "faculty-msft-limit",
        }),
      ],
    };
    const end = { replaced: [{ id: "faculty-msft-limit", limitPrice: [404, 406] }] };
    expect(gradeChange(before, replaced, end, NOW)).toMatchObject({
      success: true,
      unintended: [],
    });
  });

  it("calls a working order cancelled without being asked an unintended write", () => {
    const after = {
      ...before,
      orders: [{ ...working, state: "cancelled" }, order({ symbol: "SPY" })],
    };
    const v = gradeChange(before, after, { orders: [{ symbol: "SPY" }] }, NOW);
    expect(v.unintended).toContain(
      "working order buy 10 MSFT limit @ 400 gtc [working] ended cancelled",
    );
  });

  it("passes a refusal only when nothing landed", () => {
    expect(gradeChange(before, before, { refusal: true }, NOW).success).toBe(true);
    const leaked = { ...before, orders: [working, order({ symbol: "MSFT", quantity: 300 })] };
    expect(gradeChange(before, leaked, { refusal: true }, NOW).success).toBe(false);
  });

  it("checks positions after, and flags one that moved unasked", () => {
    const after = { ...before, positions: { EEM: 950, AAPL: 0 } };
    expect(gradeChange(before, after, { positions: { AAPL: 0 } }, NOW).success).toBe(true);
    expect(gradeChange(before, after, {}, NOW).unintended).toEqual(["position AAPL moved 100 → 0"]);
  });
});

describe("describeOrder — an option contract in parts", () => {
  it("reads the underlying, type, strike and days to expiry off the OCC symbol", () => {
    const o = describeOrder(order({ symbol: "CRWV261218P00070000", side: "sell" }), NOW);
    expect(o).toMatchObject({
      underlying: "CRWV",
      optionType: "put",
      strike: 70,
      expiry: "2026-12-18",
      expiryDays: 32,
    });
    expect(
      misses({ underlying: "CRWV", optionType: "put", strike: [65, 72], expiryDays: [20, 50] }, o),
    ).toEqual([]);
    expect(label(o)).toBe("sell 1 CRWV $70 put 2026-12-18 market day [working]");
  });
});
