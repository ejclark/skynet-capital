import type { DeskPosition, PositionLot } from "../../src/live/desk";
import type { DeskOrderEvent } from "../../src/live/desk-events";
import { atLockInBar } from "../../src/live/position-mark";
import { type LockInFlag, lockedIn, lockInFlag } from "../../src/shell/locked-in";

/**
 * A locked-in profit, recognized (#4609 slice 1). The app marks a winner Consider ▲ past the
 * decision engine's lock-in bar; closing it used to read like any other close.
 *
 * WHEN an order the viewer owns fills and closes part or all of a position the app had marked
 * Consider for its gain, THE receipt SHALL say the realized dollars beside the reason, past tense.
 * WHERE the close realized a loss, it SHALL add nothing (the plain "Sold …" line stands alone).
 * WHEN a partial close fills, it SHALL say plainly that the rest is still running.
 * The words SHALL state the realized dollars and SHALL NOT imply what the rest will do.
 */

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "AMD",
  display: "AMD",
  detail: "",
  isOption: false,
  quantity: "10",
  costPerShare: "$100.00",
  price: "$130.00",
  costBasis: "$1,000",
  value: "$1,300",
  dayPl: "+$10",
  dayPct: "+1.0%",
  dayTone: "pos",
  totalPl: "+$300",
  totalPlRaw: 300,
  returnPct: "+30.0%",
  totalTone: "pos",
  weightPct: 50,
  ...over,
});

/** Three AMD calls bought at $2.00 (Alpaca's cost is per contract: $200), now $3.40 — up 70%. */
const CALL = pos({
  symbol: "AMD261120C00180000",
  display: "AMD $180 call",
  isOption: true,
  quantity: "3",
  costPerShare: "$200.00",
  price: "$340.00",
  totalPlRaw: 420,
  returnPct: "+70.0%",
});

const fillOf = (orderId: string, over: Record<string, unknown> = {}): DeskOrderEvent => ({
  id: `${orderId}:order.filled`,
  eventType: "order.filled",
  orderId,
  at: "2026-11-10T15:00:00Z",
  outcome: "success",
  payload: { status: "filled", ...over },
});

const sentFor = (position: DeskPosition, count: number, lockIn: LockInFlag | undefined) => ({
  orderId: "o-1",
  symbol: position.symbol,
  display: position.display,
  side: "sell" as const,
  count,
  ...(lockIn ? { lockIn } : {}),
});

describe("atLockInBar — the Consider badge's gain, not its clock", () => {
  it("is set for shares up 25% and an option up 50%: the decision engine's bars", () => {
    expect(atLockInBar(pos({}))).toBe(true);
    expect(atLockInBar(CALL)).toBe(true);
    expect(atLockInBar(pos({ returnPct: "+24.0%" }))).toBe(false);
  });

  it("is not set for a call marked Consider only because the house's time stop is near", () => {
    expect(atLockInBar({ ...CALL, returnPct: "+5.0%", totalPlRaw: 30, expiresInDays: 20 })).toBe(
      false,
    );
  });
});

describe("lockInFlag — what a close remembers as it is sent", () => {
  it("carries the badge's fact, the count held and the cost", () => {
    expect(lockInFlag(CALL)).toEqual({
      fact: "up 70%",
      held: 3,
      buys: [{ qty: 3, unitCost: 200 }],
    });
  });

  it("is absent for a position not marked Consider for its gain", () => {
    expect(lockInFlag(pos({ returnPct: "+3.0%", totalPlRaw: 30 }))).toBeUndefined();
    expect(lockInFlag(pos({ returnPct: "-12.0%", totalPlRaw: -120 }))).toBeUndefined();
  });

  it("never flags a written option without its stock's price — its strike is judged first", () => {
    const sold = { ...CALL, quantity: "-3", returnPct: "+70.0%" };
    expect(lockInFlag(sold)).toBeUndefined();
  });
});

describe("lockedIn — the fill of a flagged close, said with its reason", () => {
  it("says the realized dollars on a full close, and the reason in the past tense", () => {
    const sent = sentFor(CALL, 3, lockInFlag(CALL));
    // 3 × ($3.40 × 100 − $200) = $420.
    const kept = lockedIn(sent, fillOf("o-1", { filledQuantity: 3, price: 3.4 }));
    expect(kept).toMatchObject({
      headline: "Locked in $420 on 3 contracts of AMD $180 call",
      rest: "Closed in full.",
    });
    expect(kept?.realized).toBeCloseTo(420);
    expect(kept?.why).toBe(
      "✦ it was marked Consider, up 70%, and winners can give it back. you closed it, so the gain is locked in.",
    );
  });

  it("on a partial close says what was locked in and plainly that the rest is still running", () => {
    const shares = pos({});
    const kept = lockedIn(
      sentFor(shares, 4, lockInFlag(shares)),
      fillOf("o-1", { filledQuantity: 4, price: 130 }),
    );
    expect(kept?.headline).toBe("Locked in $120 on 4 shares of AMD");
    expect(kept?.rest).toBe("The other 6 shares are still running.");
    expect(kept?.why).toContain("you closed part of it, so that part is locked in.");
    // Nothing about where the rest goes from here.
    expect(`${kept?.rest} ${kept?.why}`).not.toMatch(/will|keep (rising|climbing)|more to come/i);
    const lastOne = lockedIn(
      sentFor(CALL, 2, lockInFlag(CALL)),
      fillOf("o-1", { filledQuantity: 2, price: 3.4 }),
    );
    expect(lastOne?.rest).toBe("The other contract is still running.");
  });

  it("realizes a sell against the OLDEST buys first, as the ledger does", () => {
    const lot = (quantity: string, cost: string): PositionLot => ({
      lotId: `AMD-${cost}`,
      openedAt: "2026-10-01 14:00 UTC",
      quantity,
      costPerShare: cost,
      price: "$130.00",
      costBasis: "$0",
      value: "$0",
      dayPl: "$0",
      dayTone: "flat",
      totalPl: "$0",
      returnPct: "0%",
      totalTone: "flat",
    });
    // Average $100: 5 bought at $80, then 5 at $120. A sell of 5 at $130 comes out of the $80 buy.
    const two = pos({ lots: [lot("5", "$80.00"), lot("5", "$120.00")] });
    const kept = lockedIn(
      sentFor(two, 5, lockInFlag(two)),
      fillOf("o-1", { filledQuantity: 5, price: 130 }),
    );
    expect(kept?.headline).toBe("Locked in $250 on 5 shares of AMD");
  });

  it("adds nothing when the close realized a loss — no celebration, no penalty", () => {
    const sent = sentFor(CALL, 3, lockInFlag(CALL));
    expect(lockedIn(sent, fillOf("o-1", { filledQuantity: 3, price: 1.5 }))).toBeUndefined();
    expect(lockedIn(sent, fillOf("o-1", { filledQuantity: 3, price: 2.0 }))).toBeUndefined();
  });

  it("adds nothing for a position that was not flagged", () => {
    const flat = pos({ returnPct: "+3.0%", totalPlRaw: 30 });
    const sent = sentFor(flat, 10, lockInFlag(flat));
    expect(lockedIn(sent, fillOf("o-1", { filledQuantity: 10, price: 103 }))).toBeUndefined();
  });

  it("recognizes only this close's own completed fill, never another order's or an unfinished one", () => {
    const sent = sentFor(CALL, 3, lockInFlag(CALL));
    expect(lockedIn(sent, undefined)).toBeUndefined();
    expect(lockedIn(sent, fillOf("o-2", { filledQuantity: 3, price: 3.4 }))).toBeUndefined();
    expect(
      lockedIn(sent, {
        ...fillOf("o-1", { filledQuantity: 1, price: 3.4, status: "partially_filled" }),
        eventType: "order.partially_filled",
      }),
    ).toBeUndefined();
    expect(
      lockedIn(sent, { ...fillOf("o-1", { filledQuantity: 3, price: 3.4 }), outcome: "failure" }),
    ).toBeUndefined();
  });

  it("claims no dollars when the fill carries no price", () => {
    const sent = sentFor(CALL, 3, lockInFlag(CALL));
    expect(lockedIn(sent, fillOf("o-1", { filledQuantity: 3 }))).toBeUndefined();
  });

  it("measures a written option's buy-back against the premium it brought in", () => {
    // Sold 2 puts for $3.00 ($300 per contract), bought back at $1.00: $400 kept.
    const flag: LockInFlag = {
      fact: "67% of premium kept",
      held: 2,
      buys: [{ qty: 2, unitCost: 300 }],
    };
    const kept = lockedIn(
      {
        orderId: "o-1",
        symbol: "AMD261120P00150000",
        display: "AMD $150 put",
        side: "buy",
        count: 2,
        lockIn: flag,
      },
      fillOf("o-1", { filledQuantity: 2, price: 1 }),
    );
    expect(kept?.headline).toBe("Locked in $400 on 2 contracts of AMD $150 put");
  });
});
