import type { DeskActivityEvent, DeskActivityLeg } from "../../src/live/desk";
import {
  byDay,
  cashMoved,
  dayHeader,
  instrumentWords,
  orderBet,
  orderDayKey,
  orderTime,
  sideWord,
  signedDollars,
  sizeWord,
  statusMark,
} from "../../src/live/order-facts";

/** #5101 (round 2 of #5037, activity slice 1): every word on a phone card's two lines is read off
 *  the row the ledger already sends — the side, the size, the fill, the contract — never guessed. */

const NOW = new Date("2026-10-08T19:00:00Z");

const order = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "o1",
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 40,
  filled: 40,
  price: "$226.10",
  status: "filled",
  at: "2026-10-05T15:20:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const soldPut = order({
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
});

const leg = (symbol: string, side: "buy" | "sell"): DeskActivityLeg => ({
  ...order({ orderId: `leg-${symbol}`, symbol, display: symbol, side, quantity: 1, filled: 1 }),
});

describe("the first line — what happened", () => {
  it("says a filled order in the past tense and an unfilled one as the instruction it was", () => {
    expect(sideWord(order())).toBe("BOUGHT");
    expect(sideWord(soldPut)).toBe("SOLD");
    expect(sideWord(order({ filled: 0, status: "canceled" }))).toBe("BUY");
  });

  it("states a partial fill as filled of asked", () => {
    expect(sizeWord(order({ filled: 3, quantity: 10 }))).toBe("3/10");
    expect(sizeWord(order())).toBe("40");
  });

  it("names a share by its fill and a contract by strike, type and a plain expiry", () => {
    expect(instrumentWords(order(), NOW)).toBe("NVDA at $226.10");
    expect(instrumentWords(soldPut, NOW)).toBe("CRWV $80 PUT · Nov 6");
    const nextYear = order({ symbol: "CRWV270115C00095000", display: "x" });
    expect(instrumentWords(nextYear, NOW)).toBe("CRWV $95 CALL · Jan 15, 2027");
  });

  it("keeps a spread's own name, its expiry said the way a single contract's is", () => {
    const spread = order({
      symbol: "",
      display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
      legs: [leg("NVDA261113C00185000", "buy"), leg("NVDA261113C00200000", "sell")],
    });
    expect(instrumentWords(spread, NOW)).toBe("NVDA $185/$200 CALL SPREAD · Nov 13");
    expect(instrumentWords({ ...spread, legs: undefined }, NOW)).toBe(
      "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
    );
  });
});

describe("the cash an order moved", () => {
  it("is shares × price for a share, paid on a buy", () => {
    expect(cashMoved(order())).toEqual({ word: "paid", dollars: -9044 });
  });

  it("is contracts × 100 × price for an option, received on a sale", () => {
    expect(cashMoved(soldPut)).toEqual({ word: "received", dollars: 255 });
  });

  it("is a spread's net as the server worded it, once", () => {
    const spread = order({ symbol: "", net: "$335.00 paid", price: "$3.35" });
    expect(cashMoved(spread)).toEqual({ word: "paid", dollars: -335 });
  });

  it("is nothing for an order that never filled, or an expiry report", () => {
    expect(cashMoved(order({ filled: 0, price: "—" }))).toBeUndefined();
    expect(cashMoved({ ...soldPut, lifecycle: "OPEXP", price: "$0.00" })).toBeUndefined();
  });

  it("says dollars whole past $100 and to the cent below, with a true minus", () => {
    expect(signedDollars(-9044)).toBe("−$9,044");
    expect(signedDollars(255)).toBe("+$255");
    expect(signedDollars(45.5)).toBe("+$45.50");
  });
});

describe("the second line — the bet, read off the contract", () => {
  it("reads a sold put as staying above its strike, never as a fall", () => {
    expect(orderBet(soldPut)).toEqual({ shape: "above", words: "Stays above $80" });
  });

  it("reads a sold call as staying below, a bought call as rising, a bought put as falling", () => {
    const call = "CRWV261106C00095000";
    expect(orderBet({ ...soldPut, symbol: call })).toEqual({
      shape: "below",
      words: "Stays below $95",
    });
    expect(orderBet({ ...soldPut, symbol: call, side: "buy" })).toEqual({
      shape: "rises",
      words: "Rises above $95",
    });
    expect(orderBet({ ...soldPut, side: "buy" })).toEqual({
      shape: "falls",
      words: "Falls below $80",
    });
  });

  it("reads a bought share as a rise, and any fill that booked a result as a close", () => {
    expect(orderBet(order())).toEqual({ shape: "rises", words: "Rises" });
    const close = order({ side: "sell", realizedPl: "+$516", realizedTone: "pos" });
    expect(orderBet(close)).toEqual({ shape: "closed", words: "Closed" });
  });

  it("claims no direction for a share sale whose opening buy the ledger does not hold", () => {
    expect(orderBet(order({ side: "sell" }))).toEqual({ shape: "sold", words: "Sold" });
  });

  it("reads a vertical off its legs: a debit call spread rises, a credit put spread stays above", () => {
    const bull = order({
      symbol: "",
      legs: [leg("NVDA261113C00185000", "buy"), leg("NVDA261113C00200000", "sell")],
    });
    expect(orderBet(bull)).toEqual({ shape: "rises", words: "Rises above $185" });
    const credit = order({
      symbol: "",
      side: "sell",
      legs: [leg("NVDA261113P00180000", "sell"), leg("NVDA261113P00170000", "buy")],
    });
    expect(orderBet(credit)).toEqual({ shape: "above", words: "Stays above $180" });
  });

  it("says no bet for a spread whose legs are not all in the ledger, or an expiry report", () => {
    expect(orderBet(order({ symbol: "", legs: [leg("NVDA261113C00185000", "buy")] }))).toBe(
      undefined,
    );
    expect(orderBet({ ...soldPut, lifecycle: "OPEXP" })).toBeUndefined();
  });
});

describe("status, only when it is not 'filled'", () => {
  it("marks a dead order ✕ and a live one ◷, in words", () => {
    expect(statusMark(order())).toBeUndefined();
    expect(statusMark(order({ status: "canceled" }))).toBe("✕ canceled");
    expect(statusMark(order({ status: "partially_filled" }))).toBe("◷ partially filled");
  });
});

describe("the day header", () => {
  it("files an order under its New York day, not the UTC one", () => {
    // 02:00 UTC on the 7th is 10 PM on the 6th in New York.
    expect(orderDayKey(order({ at: "2026-10-07T02:00:00Z" }))).toBe("2026-10-06");
  });

  it("files an expiry report under its own date, read in UTC", () => {
    expect(orderDayKey({ at: "2026-11-06T23:59:59.999Z", lifecycle: "OPEXP" })).toBe("2026-11-06");
  });

  it("says the day as TUE · OCT 6, with the year only when it is not this one", () => {
    expect(dayHeader("2026-10-06", NOW)).toBe("TUE · OCT 6");
    expect(dayHeader("2025-12-31", NOW)).toBe("WED · DEC 31, 2025");
  });

  it("puts one header over a day even when its rows are not side by side", () => {
    const days = byDay([
      order({ orderId: "a", at: "2026-10-06T15:00:00Z" }),
      order({ orderId: "b", at: "2026-10-05T15:00:00Z" }),
      order({ orderId: "c", at: "2026-10-06T14:00:00Z" }),
    ]);
    expect(days.map((d) => [d.key, d.events.map((e) => e.orderId)])).toEqual([
      ["2026-10-06", ["a", "c"]],
      ["2026-10-05", ["b"]],
    ]);
  });

  it("gives the time of day in New York time, saying so — and none for a report", () => {
    expect(orderTime(order({ at: "2026-10-06T14:31:00Z" }))).toBe("10:31 AM ET");
    expect(orderTime({ at: "2026-11-06T23:59:59.999Z", lifecycle: "OPEXP" })).toBeUndefined();
  });
});
