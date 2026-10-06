import {
  type OptionLegFillRow,
  type OptionLifecycleRow,
  optionRetrospectiveKey,
  optionRetrospectives,
} from "../../src/autonomous/decision-option-trips.js";

/** A bot's option round trips, scored per contract and summed back per order (#4642 slice 8) — the
 *  P/L the CRWV wheel's 2027-01-29 falsifier and every option play's compounding read. */

const PUT = "CRWV261106P00085000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const EXPIRY_END = Date.parse("2026-11-06T23:59:59.999Z");

const leg = (over: Partial<OptionLegFillRow> & Pick<OptionLegFillRow, "intentId">) =>
  ({
    orderId: `ord-${over.intentId}`,
    occSymbol: PUT,
    side: "sell",
    quantity: 1,
    price: 2.05,
    at: Date.parse("2026-10-07T14:30:00Z"),
    reason: `intent ${over.intentId}`,
    ...over,
  }) satisfies OptionLegFillRow;

const expired = (occSymbol: string, quantity = 1): OptionLifecycleRow => ({
  type: "OPEXP",
  occSymbol,
  quantity,
  at: EXPIRY_END,
});

describe("optionRetrospectives", () => {
  it("scores a sold put that expires worthless as its whole premium, ×100", () => {
    const [trip, ...rest] = optionRetrospectives([leg({ intentId: 1 })], [expired(PUT)], new Set());
    expect(rest).toEqual([]);
    expect(trip).toEqual({
      at: EXPIRY_END,
      symbol: PUT,
      entryIntentId: 1,
      exitReason: "expired worthless",
      realized: 205,
      returnPct: 100,
      sentimentDelta: null,
      momentumDelta: null,
    });
  });

  it("scores an assigned put as its premium kept, and says it was assigned", () => {
    const assigned: OptionLifecycleRow = { ...expired(PUT), type: "OPASN" };
    const [trip] = optionRetrospectives([leg({ intentId: 1 })], [assigned], new Set());
    expect(trip).toMatchObject({ realized: 205, exitReason: "assigned" });
  });

  it("scores a bought-back put as premium less the cost to close, with the closing order's reason", () => {
    const [trip] = optionRetrospectives(
      [
        leg({ intentId: 1, momentum: 0.2 }),
        leg({
          intentId: 2,
          side: "buy",
          price: 0.35,
          at: Date.parse("2026-10-20T15:00:00Z"),
          momentum: 0.5,
        }),
      ],
      [],
      new Set(),
    );
    expect(trip?.realized).toBeCloseTo(170, 6);
    expect(trip?.returnPct).toBeCloseTo((170 / 205) * 100, 6);
    expect(trip).toMatchObject({ entryIntentId: 1, exitReason: "intent 2" });
    expect(trip?.momentumDelta).toBeCloseTo(0.3, 6);
  });

  const spreadOpen = [
    leg({ intentId: 1, occSymbol: LOW, side: "buy", price: 5.1 }),
    leg({ intentId: 1, occSymbol: HIGH, side: "sell", price: 1.75 }),
  ];

  it("sums a spread's legs into ONE trip, measured against the net debit", () => {
    const closedAt = Date.parse("2026-11-06T15:00:00Z");
    const trips = optionRetrospectives(
      [
        ...spreadOpen,
        leg({ intentId: 2, occSymbol: LOW, side: "sell", price: 7, at: closedAt }),
        leg({ intentId: 2, occSymbol: HIGH, side: "buy", price: 2.9, at: closedAt }),
      ],
      [],
      new Set(),
    );
    expect(trips).toHaveLength(1);
    // Long call +$190, short call −$115: the spread made $75 on $335 paid.
    expect(trips[0]?.realized).toBeCloseTo(75, 6);
    expect(trips[0]?.returnPct).toBeCloseTo((75 / 335) * 100, 6);
    expect(trips[0]).toMatchObject({ symbol: `${LOW}/${HIGH}`, exitReason: "intent 2" });
  });

  it("scores a spread whose legs both expire worthless as the whole debit lost", () => {
    const trips = optionRetrospectives(spreadOpen, [expired(LOW), expired(HIGH)], new Set());
    expect(trips).toHaveLength(1);
    expect(trips[0]?.realized).toBeCloseTo(-335, 6);
    expect(trips[0]?.returnPct).toBeCloseTo(-100, 6);
  });

  it("scores none of a spread with an unpriced leg, rather than half of it", () => {
    const [low, high] = spreadOpen;
    const legs = [low as OptionLegFillRow, { ...(high as OptionLegFillRow), price: undefined }];
    expect(optionRetrospectives(legs, [expired(LOW), expired(HIGH)], new Set())).toEqual([]);
  });

  it("skips what is already recorded, and closes nothing that was never opened", () => {
    const recorded = new Set([optionRetrospectiveKey(1, EXPIRY_END, PUT)]);
    expect(optionRetrospectives([leg({ intentId: 1 })], [expired(PUT)], recorded)).toEqual([]);
    expect(optionRetrospectives([], [expired(PUT)], new Set())).toEqual([]);
  });
});
