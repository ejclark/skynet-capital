import { stakeFingerprint } from "../../../src/options/position-guidance";
import type { DeskPosition, DeskSnapshot } from "../../src/live/desk";
import { heldStake, writeSnapshot } from "../../src/live/guidance";
import { CONFIDENCE_METER, rowCallOf } from "../../src/live/row-call";

/**
 * THE CALL AND ITS CONFIDENCE ON THE ROW (#5070; Eric, round 2: "We should communicate strength of
 * confidence to the user based on our data"). A row shows its guidance call ("Hold · ▰▰▱ medium")
 * only when this browser holds a read of the position guidance made today for EXACTLY this
 * holding — the account's own shares and cost, keyed by the stake's fingerprint as the Guidance
 * tab keys its snapshots. Another stake's read, or yesterday's, is never shown as this row's call.
 */

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "NVDA",
  display: "NVDA",
  detail: "",
  isOption: false,
  quantity: "130",
  costPerShare: "$223.98",
  price: "$232.10",
  costBasis: "$29,117",
  value: "$30,173",
  dayPl: "+$195",
  dayPct: "+0.6%",
  dayTone: "pos",
  totalPl: "+$1,056",
  totalPlRaw: 1055.6,
  returnPct: "+3.63%",
  totalTone: "pos",
  weightPct: 3,
  ...over,
});

const BOOK = [pos({})];
const NOW = new Date("2026-10-08T19:00:00Z"); // Thu 3:00 PM ET

/** The Guidance tab's own write for this account's NVDA, at `asOf`. */
function readToday(
  asOf: string,
  stake = heldStake({ desk: { positions: BOOK } } as unknown as DeskSnapshot, "NVDA"),
) {
  writeSnapshot("NVDA", stakeFingerprint(stake ?? {}), {
    asOf,
    spot: 232.1,
    calls: [
      { lever: "shares", call: "HOLD", confidence: "medium" },
      { lever: "covered-calls", call: "WAIT", confidence: "low" },
      { lever: "cash-secured-puts", call: "NOT AVAILABLE", confidence: "none" },
    ],
    richness: "middling",
  });
}

beforeEach(() => localStorage.clear());

describe("rowCallOf", () => {
  it("shows the shares call from today's read of exactly this holding", () => {
    readToday("2026-10-08T18:00:00.000Z");
    expect(rowCallOf(BOOK, BOOK[0] as DeskPosition, NOW)).toEqual({
      word: "Hold",
      confidence: "medium",
      readAt: "2:00 PM ET",
    });
  });

  it("shows nothing from yesterday's read", () => {
    readToday("2026-10-07T19:00:00.000Z");
    expect(rowCallOf(BOOK, BOOK[0] as DeskPosition, NOW)).toBeUndefined();
  });

  it("shows nothing from a read made with another stake", () => {
    readToday("2026-10-08T18:00:00.000Z", { shares: 10, costBasis: 100 });
    expect(rowCallOf(BOOK, BOOK[0] as DeskPosition, NOW)).toBeUndefined();
  });

  it("never gives an option row a call it does not have", () => {
    readToday("2026-10-08T18:00:00.000Z");
    const put = pos({ symbol: "NVDA261120P00200000", isOption: true, quantity: "-1" });
    expect(rowCallOf(BOOK, put, NOW)).toBeUndefined();
  });

  it("draws confidence as a three-step meter beside its word", () => {
    expect(CONFIDENCE_METER).toEqual({ high: "▰▰▰", medium: "▰▰▱", low: "▰▱▱", none: "▱▱▱" });
  });
});
