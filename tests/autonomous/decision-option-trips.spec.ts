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

  it("scores a spread's legs as ONE trip when one is assigned and one expires at the same close", () => {
    const assigned: OptionLifecycleRow = { ...expired(HIGH), type: "OPASN" };
    const trips = optionRetrospectives(spreadOpen, [expired(LOW), assigned], new Set());
    expect(trips).toHaveLength(1);
    // Long call −$510, short call's premium kept +$175: one trade, not a −100% and a +100%.
    expect(trips[0]?.realized).toBeCloseTo(-335, 6);
    expect(trips[0]).toMatchObject({
      symbol: `${LOW}/${HIGH}`,
      exitReason: "assigned / expired worthless",
    });
  });

  it("scores none of a spread whose long leg was exercised, rather than the short leg alone", () => {
    const exercised: OptionLifecycleRow = { ...expired(LOW), type: "OPEXC" };
    // Settled between the strikes: the 185C is exercised, the 200C expires. The true −$135 rests on
    // shares this ledger does not score, so +$175 for the short leg alone would be a fiction.
    expect(optionRetrospectives(spreadOpen, [exercised, expired(HIGH)], new Set())).toEqual([]);
    // Settled above both: the short leg is assigned, the long leg exercised.
    const assigned: OptionLifecycleRow = { ...expired(HIGH), type: "OPASN" };
    expect(optionRetrospectives(spreadOpen, [exercised, assigned], new Set())).toEqual([]);
  });

  it("waits for every leg's report before scoring a spread's expiry", () => {
    // The broker's batch posts one leg before the other: the first read must not score half.
    expect(optionRetrospectives(spreadOpen, [expired(LOW)], new Set())).toEqual([]);
    const trips = optionRetrospectives(spreadOpen, [expired(LOW), expired(HIGH)], new Set());
    expect(trips.map((t) => [t.symbol, t.realized])).toEqual([[`${LOW}/${HIGH}`, -335]]);
  });

  it("waits for every contract's report before scoring an assignment", () => {
    const twoPuts = [leg({ intentId: 1, quantity: 2 })];
    const assigned: OptionLifecycleRow = { ...expired(PUT), type: "OPASN" };
    expect(optionRetrospectives(twoPuts, [assigned], new Set())).toEqual([]);
    const trips = optionRetrospectives(twoPuts, [assigned, assigned], new Set());
    expect(trips.map((t) => [t.symbol, t.realized])).toEqual([[PUT, 410]]);
  });

  it("scores none of a spread whose short leg was bought back alone while the long leg was exercised", () => {
    const exercised: OptionLifecycleRow = { ...expired(LOW), type: "OPEXC" };
    const buyBackHigh = leg({
      intentId: 2,
      occSymbol: HIGH,
      side: "buy",
      price: 2.9,
      at: Date.parse("2026-11-05T15:00:00Z"),
    });
    expect(optionRetrospectives([...spreadOpen, buyBackHigh], [exercised], new Set())).toEqual([]);
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
