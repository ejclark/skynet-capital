import { asideFor, asideHolds, asideWords, readAside, writeAside } from "../../src/live/mark-aside";
import type { PositionMark } from "../../src/live/position-mark";

/**
 * NOT NOW (#5070; Eric, 468e3897: worth a look first is "a setting, easy to dismiss or bypass").
 * Not now steps a row's mark aside until a stated return condition: the close of the next trading
 * session, or sooner when the stock trades through the price the mark names. A different mark on
 * the same row is a new fact, so it is never hidden by an old Not now.
 */

const PUT_REVIEW: PositionMark = {
  kind: "review",
  fact: "$2.60 above strike",
  watch: { symbol: "CRWV", price: 80, side: "below" },
};
const SHARES_REVIEW: PositionMark = { kind: "review", fact: "below breakeven" };

// The profile world's instant: Thursday 2026-10-08, 3:00 PM ET (EDT, UTC−4).
const THU_3PM = new Date("2026-10-08T19:00:00Z");

describe("asideFor — when the mark comes back", () => {
  it("holds until the next session's close: Friday's, from a Thursday afternoon", () => {
    expect(asideFor("CRWV", SHARES_REVIEW, THU_3PM)).toEqual({
      symbol: "CRWV",
      kind: "review",
      until: "2026-10-09",
    });
  });

  it("skips the weekend and the exchange's holidays", () => {
    const friday = new Date("2026-10-09T15:00:00Z");
    expect(asideFor("CRWV", SHARES_REVIEW, friday).until).toBe("2026-10-12");
    const wednesdayBeforeThanksgiving = new Date("2026-11-25T15:00:00Z");
    expect(asideFor("CRWV", SHARES_REVIEW, wednesdayBeforeThanksgiving).until).toBe("2026-11-27");
  });

  it("carries the price the mark names", () => {
    expect(asideFor("CRWV261106P00080000", PUT_REVIEW, THU_3PM).watch).toEqual({
      symbol: "CRWV",
      price: 80,
      side: "below",
    });
  });
});

describe("asideHolds", () => {
  const entry = asideFor("CRWV261106P00080000", PUT_REVIEW, THU_3PM);

  it("keeps the mark aside through the rest of today and the next session", () => {
    expect(asideHolds(entry, PUT_REVIEW, THU_3PM, 82.6)).toBe(true);
    expect(asideHolds(entry, PUT_REVIEW, new Date("2026-10-09T19:59:00Z"), 82.6)).toBe(true);
  });

  it("lets it back at Friday's close", () => {
    expect(asideHolds(entry, PUT_REVIEW, new Date("2026-10-09T20:00:00Z"), 82.6)).toBe(false);
  });

  it("lets it back as soon as the stock trades through the named price", () => {
    expect(asideHolds(entry, PUT_REVIEW, THU_3PM, 79.9)).toBe(false);
  });

  it("never hides a different mark on the same row", () => {
    const consider: PositionMark = { kind: "consider", fact: "70% of premium kept" };
    expect(asideHolds(entry, consider, THU_3PM, 95)).toBe(false);
  });
});

describe("asideWords", () => {
  it("states the return condition on the row and in full", () => {
    expect(asideWords(asideFor("CRWV261106P00080000", PUT_REVIEW, THU_3PM))).toEqual({
      short: "till Fri close",
      full: "Back after Friday's close, or sooner if CRWV trades below $80.00.",
    });
    expect(asideWords(asideFor("CRWV", SHARES_REVIEW, THU_3PM)).full).toBe(
      "Back after Friday's close.",
    );
  });
});

describe("readAside / writeAside — this browser's own, per account", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips one account's entries and keeps accounts apart", () => {
    const entry = asideFor("CRWV", SHARES_REVIEW, THU_3PM);
    writeAside("sauron", [entry]);
    expect(readAside("sauron")).toEqual([entry]);
    expect(readAside("eric")).toEqual([]);
  });

  it("reads junk as nothing set aside", () => {
    localStorage.setItem("skynet.marks.aside.sauron", "{not json");
    expect(readAside("sauron")).toEqual([]);
    localStorage.setItem("skynet.marks.aside.sauron", JSON.stringify([{ symbol: 3 }]));
    expect(readAside("sauron")).toEqual([]);
  });
});
