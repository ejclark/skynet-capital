import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import {
  fillCashBetween,
  flowTolerance,
  inferCapitalFlow,
  spreadNear,
} from "../../src/observatory/capital-flow.js";
import type { EquitySample } from "../../src/observatory/history-record.js";

// #4563 — a member who resets their Alpaca paper balance moves their equity with no fill in our
// journal. Standings rank raw equity, so until this detector existed the top-up read as a gain.

const sample = (at: string, equity: number, cash: number): EquitySample => ({
  at,
  participantId: "human-dana",
  equity,
  cash,
  realizedPl: 0,
});

const fill = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "o1",
  participantId: "human-dana",
  symbol: "SPY",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 500,
  status: "filled",
  at: "2026-10-05T14:02:00.000Z",
  source: "stream",
  ...over,
});

const T0 = "2026-10-05T14:00:00.000Z";
const T1 = "2026-10-05T14:05:00.000Z";

describe("inferCapitalFlow", () => {
  it("records a top-up when equity and cash jump with no journaled fill to explain it", () => {
    // Down to $700k, then the member refunds the paper account to $1,000,000.
    const flow = inferCapitalFlow(sample(T0, 700_000, 200_000), sample(T1, 1_000_000, 500_000), []);
    expect(flow).toEqual({
      participantId: "human-dana",
      from: T0,
      at: T1,
      amount: 300_000,
      direction: "added",
      unexplainedCash: 300_000,
      basis: "inferred",
    });
  });

  it("records a reset that wipes held positions at the equity change, not the cash change", () => {
    // $700k equity = $200k cash + $500k of positions; a reset to $1M clears the positions too, so
    // cash moves $800k while the capital that actually arrived is the $300k equity moved.
    const flow = inferCapitalFlow(
      sample(T0, 700_000, 200_000),
      sample(T1, 1_000_000, 1_000_000),
      [],
    );
    expect(flow?.amount).toBe(300_000);
    expect(flow?.unexplainedCash).toBe(800_000);
  });

  it("records capital removed when a member resets a winning account back down", () => {
    const flow = inferCapitalFlow(
      sample(T0, 1_300_000, 500_000),
      sample(T1, 1_000_000, 1_000_000),
      [],
    );
    expect(flow?.direction).toBe("removed");
    expect(flow?.amount).toBe(-300_000);
  });

  it("records nothing when a journaled fill explains the cash move", () => {
    // A $5,000 buy: cash drops, equity barely moves — ordinary trading.
    const flow = inferCapitalFlow(sample(T0, 1_000_000, 500_000), sample(T1, 1_000_000, 495_000), [
      fill({}),
    ]);
    expect(flow).toBeUndefined();
  });

  it("records nothing when the market moves equity but cash stays put", () => {
    const flow = inferCapitalFlow(
      sample(T0, 1_000_000, 500_000),
      sample(T1, 1_030_000, 500_000),
      [],
    );
    expect(flow).toBeUndefined();
  });

  it("records nothing for an assignment: cash changes hands at the strike, equity holds", () => {
    // OPASN arrives as a $0 lifecycle line — the share leg's cash is unjournaled, but no capital
    // arrived, and equity says so.
    const flow = inferCapitalFlow(sample(T0, 1_000_000, 500_000), sample(T1, 1_000_400, 458_000), [
      fill({ symbol: "AAPL261016P00420000", side: "buy", price: undefined, source: "lifecycle" }),
    ]);
    expect(flow).toBeUndefined();
  });

  it("treats a rounding-sized difference as noise, never as a flow", () => {
    const flow = inferCapitalFlow(
      sample(T0, 1_000_000, 500_000),
      sample(T1, 1_000_900, 500_900),
      [],
    );
    expect(flow).toBeUndefined();
  });

  it("refuses to compare samples from two different participants", () => {
    const other = { ...sample(T1, 1_000_000, 500_000), participantId: "human-eric" };
    expect(inferCapitalFlow(sample(T0, 700_000, 200_000), other, [])).toBeUndefined();
  });
});

describe("fillCashBetween", () => {
  it("counts only fills inside the window: a buy spends cash, a sell raises it", () => {
    const records = [
      fill({ orderId: "a", side: "buy", at: "2026-10-05T14:01:00.000Z" }),
      fill({ orderId: "b", side: "sell", price: 510, at: "2026-10-05T14:04:00.000Z" }),
      fill({ orderId: "c", side: "buy", at: "2026-10-05T13:59:00.000Z" }), // before the window
      fill({ orderId: "d", side: "buy", at: "2026-10-05T14:06:00.000Z" }), // after it
    ];
    expect(fillCashBetween(records, T0, T1)).toBe(-5_000 + 5_100);
  });

  it("scales an option fill by its 100-share multiplier", () => {
    const records = [fill({ symbol: "AAPL261016C00200000", side: "sell", price: 3.2 })];
    expect(fillCashBetween(records, T0, T1)).toBeCloseTo(10 * 3.2 * 100);
  });

  it("counts only the part of a partial fill that landed inside the window", () => {
    const records = [
      fill({ orderId: "p", filledQuantity: 4, price: 500, at: "2026-10-05T13:58:00.000Z" }),
      fill({ orderId: "p", filledQuantity: 10, price: 501, at: "2026-10-05T14:03:00.000Z" }),
    ];
    // Notional by the window's end 10 × 501, less the 4 × 500 already spent before it opened.
    expect(fillCashBetween(records, T0, T1)).toBe(-(10 * 501 - 4 * 500));
  });
});

describe("flowTolerance", () => {
  it("is the larger of $1,000 and 0.5% of equity", () => {
    expect(flowTolerance(100_000)).toBe(1_000);
    expect(flowTolerance(1_000_000)).toBe(5_000);
  });
});

// The hub folds no multi-leg fill until the next broker sync, so for a minute the book and the
// journal disagree by the spread's net cash — a window near a spread cannot be read.
describe("spreadNear", () => {
  const leg = (at: string) =>
    fill({ orderId: "leg", symbol: "SPY261218C00600000", price: 2, parentOrderId: "p", at });

  it("leaves a window alone when a spread leg filled inside it", () => {
    const top = inferCapitalFlow(sample(T0, 700_000, 200_000), sample(T1, 1_000_000, 500_000), [
      leg("2026-10-05T14:03:00.000Z"),
    ]);
    expect(top).toBeUndefined();
  });

  it("covers the window after a spread too, until the sync has caught the book up", () => {
    expect(spreadNear([leg("2026-10-05T13:59:00.000Z")], T0, T1)).toBe(true);
    expect(spreadNear([leg("2026-10-05T13:50:00.000Z")], T0, T1)).toBe(false);
  });

  it("treats a symbol-less parent line from a broker read as a spread", () => {
    expect(spreadNear([fill({ symbol: "", price: 1.62 })], T0, T1)).toBe(true);
  });

  it("ignores plain fills and unfilled spread lines", () => {
    expect(spreadNear([fill({})], T0, T1)).toBe(false);
    expect(
      spreadNear([fill({ parentOrderId: "p", filledQuantity: 0, price: undefined })], T0, T1),
    ).toBe(false);
  });
});
